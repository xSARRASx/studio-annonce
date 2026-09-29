"""Administration des comptes. Chaque permission est vérifiée côté serveur."""
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased

from .. import credits
from ..db import session
from ..models import (CodeConnexion, Compte, ConnexionCompte, Jeton, JournalAdmin,
                      Logement, Photo, maintenant)
from .auth import compte_complet
from .compte import Profil

routeur = APIRouter(prefix="/admin", tags=["administration"])


def administrateur(compte: Compte = Depends(compte_complet)) -> Compte:
    if compte.role not in ("proprietaire", "admin"):
        raise HTTPException(403, "Cet espace est réservé aux administrateurs.")
    return compte


def utc(value):
    return value.isoformat() + "Z" if value else None


def identite(c: Compte):
    return {"id": c.id, "email": c.email, "prenom": c.prenom, "nom": c.nom,
            "role": c.role, "statut": c.statut, "revision": c.revision_admin,
            "cree_le": utc(c.cree_le), "email_verifie_le": utc(c.email_verifie_le),
            "derniere_connexion_le": utc(c.derniere_connexion_le)}


def journal(s, acteur, cible, action, details=None):
    s.add(JournalAdmin(acteur_id=acteur.id, cible_id=cible.id, action=action, details=details or {}))


def revoquer(s, c):
    s.execute(delete(Jeton).where(Jeton.compte_id == c.id))
    s.execute(update(CodeConnexion).where(CodeConnexion.email == c.email, CodeConnexion.utilise == 0).values(utilise=1))


def verrouiller(s, acteur):
    # Sérialise les mutations avec les changements d'accès concurrents (SQLite
    # et PostgreSQL), puis recharge les droits de l'acteur avant toute écriture.
    s.execute(update(Compte).where(Compte.id == acteur.id).values(revision_admin=Compte.revision_admin))
    s.refresh(acteur)
    if acteur.statut != "actif" or acteur.role not in ("proprietaire", "admin"):
        raise HTTPException(403, "Vos droits d’administration ont changé. Rechargez la page.")


def cible_modifiable(s, acteur, cible_id, revision):
    verrouiller(s, acteur)
    c = s.scalar(select(Compte).where(Compte.id == cible_id).with_for_update())
    if not c:
        raise HTTPException(404, "Compte introuvable.")
    s.refresh(c)
    if c.id == acteur.id or c.role == "proprietaire":
        raise HTTPException(403, "Le compte propriétaire et votre propre accès sont protégés.")
    if c.role == "admin" and acteur.role != "proprietaire":
        raise HTTPException(403, "Seul le propriétaire peut gérer un autre administrateur.")
    if c.revision_admin != revision:
        raise HTTPException(409, "Ce compte a changé. Actualisez sa fiche avant de continuer.")
    return c


class NouveauCompte(Profil):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr


class ModificationProfil(Profil):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)


class ActionCompte(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)
    action: Literal["suspendre", "reactiver", "supprimer", "restaurer", "deconnecter", "nommer_admin", "retirer_admin"]
    confirmation_email: EmailStr


@routeur.get("/vue-ensemble")
def vue_ensemble(acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    statuts = dict(s.execute(select(Compte.statut, func.count()).group_by(Compte.statut)).all())
    debut = maintenant().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
    jours = dict(s.execute(select(func.date(ConnexionCompte.cree_le), func.count())
                          .where(ConnexionCompte.cree_le >= debut).group_by(func.date(ConnexionCompte.cree_le))).all())
    return {"comptes": sum(statuts.values()), "actifs": statuts.get("actif", 0),
            "suspendus": statuts.get("suspendu", 0), "supprimes": statuts.get("supprime", 0),
            "administrateurs": s.scalar(select(func.count()).select_from(Compte).where(
                Compte.role.in_(["proprietaire", "admin"]), Compte.statut == "actif")),
            "photos": s.scalar(select(func.count()).select_from(Photo)),
            "connexions": [{"jour": (debut + timedelta(days=i)).date().isoformat(),
                             "nombre": jours.get((debut + timedelta(days=i)).date().isoformat(), 0)} for i in range(7)]}


@routeur.get("/comptes")
def liste_comptes(q: str = Query("", max_length=120), statut: Literal["tous", "actif", "suspendu", "supprime"] = "tous",
                  role: Literal["tous", "equipe"] = "tous", page: int = Query(1, ge=1),
                  acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    filtres = []
    if statut != "tous":
        filtres.append(Compte.statut == statut)
    if role == "equipe":
        filtres.append(Compte.role.in_(["proprietaire", "admin"]))
    if q.strip():
        terme = "%" + q.strip().lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        filtres.append(or_(*[func.lower(col).like(terme, escape="\\") for col in (Compte.email, Compte.prenom, Compte.nom)]))
    total = s.scalar(select(func.count()).select_from(Compte).where(*filtres))
    comptes = s.scalars(select(Compte).where(*filtres).order_by(Compte.cree_le.desc(), Compte.id).offset((page - 1) * 20).limit(20)).all()
    ids = [c.id for c in comptes]
    sessions = dict(s.execute(select(Jeton.compte_id, func.count()).where(Jeton.compte_id.in_(ids)).group_by(Jeton.compte_id)).all()) if ids else {}
    return {"total": total, "page": page, "par_page": 20,
            "comptes": [{**identite(c), "sessions": sessions.get(c.id, 0)} for c in comptes]}


@routeur.get("/journal")
def liste_journal(page: int = Query(1, ge=1), acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    a, c = aliased(Compte), aliased(Compte)
    lignes = s.execute(select(JournalAdmin, a, c).join(a, a.id == JournalAdmin.acteur_id).join(c, c.id == JournalAdmin.cible_id)
                       .order_by(JournalAdmin.id.desc()).offset((page - 1) * 20).limit(20)).all()
    return {"total": s.scalar(select(func.count()).select_from(JournalAdmin)), "page": page, "par_page": 20,
            "evenements": [{"id": j.id, "action": j.action, "le": utc(j.cree_le), "details": j.details,
                            "acteur": f"{a.prenom} {a.nom}".strip() or a.email,
                            "cible": c.email} for j, a, c in lignes]}


@routeur.get("/comptes/{cible_id}")
def detail_compte(cible_id: str, acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    c = s.get(Compte, cible_id)
    if not c:
        raise HTTPException(404, "Compte introuvable.")
    return {**identite(c), "sessions": s.scalar(select(func.count()).select_from(Jeton).where(Jeton.compte_id == c.id)),
            "solde": credits.solde(s, c.id), "photo_offerte_utilisee": bool(c.photos_offertes_utilisees),
            "logements": s.scalar(select(func.count()).select_from(Logement).where(Logement.compte_id == c.id)),
            "photos": s.scalar(select(func.count()).select_from(Photo).join(Logement).where(Logement.compte_id == c.id)),
            "connexions": [utc(d) for d in s.scalars(select(ConnexionCompte.cree_le).where(ConnexionCompte.compte_id == c.id)
                                                    .order_by(ConnexionCompte.id.desc()).limit(10)).all()]}


@routeur.post("/comptes", status_code=201)
def creer_compte(d: NouveauCompte, acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    verrouiller(s, acteur)
    email = str(d.email).lower()
    if s.scalar(select(Compte.id).where(Compte.email == email)):
        raise HTTPException(409, "Cette adresse possède déjà un compte. Retrouvez-le dans la liste, y compris parmi les comptes supprimés.")
    c = Compte(email=email, prenom=d.prenom, nom=d.nom, profil_complete_le=maintenant())
    s.add(c)
    try:
        s.flush()
    except IntegrityError:
        s.rollback()
        raise HTTPException(409, "Cette adresse possède déjà un compte.")
    journal(s, acteur, c, "compte_cree")
    s.commit()
    return identite(c)


@routeur.patch("/comptes/{cible_id}")
def modifier_compte(cible_id: str, d: ModificationProfil, acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    c = cible_modifiable(s, acteur, cible_id, d.revision)
    if c.statut == "supprime":
        raise HTTPException(409, "Restaurez ce compte avant de modifier son profil.")
    c.prenom, c.nom = d.prenom, d.nom
    c.profil_complete_le = c.profil_complete_le or maintenant()
    c.revision_admin += 1
    journal(s, acteur, c, "profil_modifie")
    s.commit()
    return identite(c)


@routeur.post("/comptes/{cible_id}/actions")
def action_compte(cible_id: str, d: ActionCompte, acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    c = cible_modifiable(s, acteur, cible_id, d.revision)
    if str(d.confirmation_email).lower() != c.email:
        raise HTTPException(400, "L’adresse de confirmation ne correspond pas au compte.")
    avant = {"role": c.role, "statut": c.statut}
    transitions = {"suspendre": ("actif", "suspendu"), "reactiver": ("suspendu", "actif"), "restaurer": ("supprime", "actif")}
    if d.action in ("nommer_admin", "retirer_admin"):
        if acteur.role != "proprietaire":
            raise HTTPException(403, "Seul le propriétaire peut attribuer ou retirer les droits administrateur.")
        if c.statut != "actif" or not c.email_verifie_le or not c.profil_complete_le:
            raise HTTPException(409, "Le compte doit être actif et avoir validé son email et son profil avant tout changement de rôle.")
        attendu, nouveau = ("client", "admin") if d.action == "nommer_admin" else ("admin", "client")
        if c.role != attendu:
            raise HTTPException(409, "Ce compte n’a plus le rôle attendu. Actualisez sa fiche.")
        c.role = nouveau
    elif d.action == "supprimer":
        if c.statut == "supprime":
            raise HTTPException(409, "Ce compte est déjà supprimé.")
        c.statut = "supprime"
        c.role = "client"  # Une restauration ne réattribue jamais les droits admin.
    elif d.action in transitions:
        attendu, nouveau = transitions[d.action]
        if c.statut != attendu:
            raise HTTPException(409, "L’état du compte a changé. Actualisez sa fiche.")
        c.statut = nouveau
    elif c.statut != "actif":
        raise HTTPException(409, "Ce compte n’est pas actif.")
    revoquer(s, c)
    c.revision_admin += 1
    journal(s, acteur, c, d.action, {"avant": avant, "apres": {"role": c.role, "statut": c.statut}})
    s.commit()
    return identite(c)

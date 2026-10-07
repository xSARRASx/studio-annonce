"""Administration des comptes. Chaque permission est vérifiée côté serveur."""
from datetime import date, datetime, time, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased

from .. import credits, frais, limites
from ..db import session
from ..models import (AchatCredits, CodeConnexion, Compte, ConnexionCompte, Jeton, JournalAdmin,
                      FraisFournisseur, Logement, Photo, QuotaCreation, Version, Video, maintenant)
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
    action: Literal["suspendre", "reactiver", "supprimer", "restaurer", "deconnecter", "nommer_admin", "retirer_admin", "reinitialiser_essais"]
    confirmation_email: EmailStr


class NouveauFrais(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    fournisseur: Literal["OpenAI", "Higgsfield", "Stripe", "Stockage", "Autre"]
    reference: str = Field(min_length=1, max_length=160)
    nature: Literal["photo", "video", "autre"]
    montant_centimes: int = Field(gt=0, le=10_000_000, strict=True)
    date: date
    compte_id: str | None = Field(default=None, max_length=24)


@routeur.post("/frais", status_code=201)
def ajouter_frais(d: NouveauFrais, acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    verrouiller(s, acteur)
    if d.date > maintenant().date():
        raise HTTPException(422, "Indiquez la date d’un frais déjà constaté.")
    if d.compte_id and not s.get(Compte, d.compte_id):
        raise HTTPException(404, "Compte introuvable.")
    donnees = {**d.model_dump(exclude={"date"}), "date_frais": datetime.combine(d.date, time.min)}
    precedent = s.scalar(select(FraisFournisseur).where(FraisFournisseur.fournisseur == d.fournisseur,
                                                        FraisFournisseur.reference == d.reference))
    if precedent:
        if precedent.annule_le or any(getattr(precedent, k) != v for k, v in donnees.items()):
            raise HTTPException(409, "Cette référence est déjà enregistrée. Vérifiez la saisie existante avant d’ajouter un autre frais.")
        return {"id": precedent.id, "deja_enregistre": True}
    f = FraisFournisseur(**donnees, acteur_id=acteur.id)
    s.add(f)
    try:
        s.flush()
    except IntegrityError:
        s.rollback()
        raise HTTPException(409, "Cette référence vient d’être enregistrée. Actualisez le tableau.")
    journal(s, acteur, s.get(Compte, d.compte_id) if d.compte_id else acteur, "frais_enregistre",
            {"frais_id": f.id, "fournisseur": f.fournisseur, "montant_centimes": f.montant_centimes})
    s.commit()
    return {"id": f.id, "deja_enregistre": False}


@routeur.post("/frais/{frais_id}/annuler")
def annuler_frais(frais_id: str, acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    verrouiller(s, acteur)
    f = s.get(FraisFournisseur, frais_id)
    if not f:
        raise HTTPException(404, "Frais introuvable.")
    if not f.annule_le:
        f.annule_le = maintenant()
        journal(s, acteur, s.get(Compte, f.compte_id) if f.compte_id else acteur, "frais_annule", {"frais_id": f.id})
        s.commit()
    return {"id": f.id, "annule": True}


@routeur.get("/vue-ensemble")
def vue_ensemble(acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    statuts = dict(s.execute(select(Compte.statut, func.count()).group_by(Compte.statut)).all())
    debut = maintenant().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
    jours = dict(s.execute(select(func.date(ConnexionCompte.cree_le), func.count())
                          .where(ConnexionCompte.cree_le >= debut).group_by(func.date(ConnexionCompte.cree_le))).all())
    par_compte = s.execute(select(Compte.id, Compte.email, Compte.prenom, Compte.nom,
                                 func.count(ConnexionCompte.id), func.max(ConnexionCompte.cree_le))
        .join(ConnexionCompte, ConnexionCompte.compte_id == Compte.id)
        .where(ConnexionCompte.cree_le >= debut)
        .group_by(Compte.id, Compte.email, Compte.prenom, Compte.nom)
        .order_by(func.count(ConnexionCompte.id).desc(), func.max(ConnexionCompte.cree_le).desc())).all()
    return {"comptes": sum(statuts.values()), "actifs": statuts.get("actif", 0),
            "suspendus": statuts.get("suspendu", 0), "supprimes": statuts.get("supprime", 0),
            "administrateurs": s.scalar(select(func.count()).select_from(Compte).where(
                Compte.role.in_(["proprietaire", "admin"]), Compte.statut == "actif")),
            "photos": s.scalar(select(func.count()).select_from(Photo)),
            "connexions": [{"jour": (debut + timedelta(days=i)).date().isoformat(),
                             "nombre": jours.get((debut + timedelta(days=i)).date().isoformat(), 0)} for i in range(7)],
            "connexions_par_compte": [{"id": ident, "email": email,
                "nom": f"{prenom} {nom}".strip(), "nombre": nombre, "derniere_connexion_le": utc(derniere)}
                for ident, email, prenom, nom, nombre, derniere in par_compte]}


@routeur.get("/activite-commerciale")
def activite_commerciale(acteur: Compte = Depends(administrateur), s: Session = Depends(session)):
    """Paiements réels crédités et remboursements enregistrés, sans marge inventée."""
    operations = s.execute(select(AchatCredits, Compte).join(Compte, Compte.id == AchatCredits.compte_id)
        .where(AchatCredits.statut.in_(["paye", "rembourse"]), AchatCredits.credite_le.is_not(None), AchatCredits.reel == 1)
        .order_by(AchatCredits.credite_le.desc(), AchatCredits.id.desc())).all()
    ventes = [(achat, compte) for achat, compte in operations if achat.statut == "paye"]
    remboursements = [(achat, compte) for achat, compte in operations if achat.statut == "rembourse"]
    revenus = {"photo": 0, "video": 0}
    par_compte: dict[str, dict] = {}
    for achat, compte in operations:
        ligne = par_compte.setdefault(compte.id, {"id": compte.id, "email": compte.email,
            "nom": f"{compte.prenom} {compte.nom}".strip(), "achats_photo": 0,
            "achats_video": 0, "ca_photo_centimes": 0, "ca_video_centimes": 0,
            "achats_rembourses": 0, "remboursements_centimes": 0,
            "photos_importees": 0, "retouches_creees": 0, "videos_creees": 0})
        if achat.statut == "rembourse":
            ligne["achats_rembourses"] += 1
            ligne["remboursements_centimes"] += achat.montant_centimes
        else:
            revenus[achat.nature] = revenus.get(achat.nature, 0) + achat.montant_centimes
            ligne[f"achats_{achat.nature}"] = ligne.get(f"achats_{achat.nature}", 0) + 1
            ligne[f"ca_{achat.nature}_centimes"] = ligne.get(f"ca_{achat.nature}_centimes", 0) + achat.montant_centimes
    photos = dict(s.execute(select(Logement.compte_id, func.count(Photo.id)).join(Photo, Photo.logement_id == Logement.id).group_by(Logement.compte_id)).all())
    retouches = dict(s.execute(select(Logement.compte_id, func.count(Version.id)).join(Photo, Photo.logement_id == Logement.id)
        .join(Version, Version.photo_id == Photo.id).group_by(Logement.compte_id)).all())
    videos = dict(s.execute(select(Logement.compte_id, func.count(Video.id)).join(Video, Video.logement_id == Logement.id)
        .group_by(Logement.compte_id)).all())
    comptes_frais = set(s.scalars(select(FraisFournisseur.compte_id).where(FraisFournisseur.compte_id.is_not(None))))
    comptes = s.scalars(select(Compte).where(Compte.id.in_(set(photos) | set(retouches) | set(videos) | set(par_compte) | comptes_frais))).all()
    for compte in comptes:
        ligne = par_compte.setdefault(compte.id, {"id": compte.id, "email": compte.email,
            "nom": f"{compte.prenom} {compte.nom}".strip(), "achats_photo": 0,
            "achats_video": 0, "ca_photo_centimes": 0, "ca_video_centimes": 0,
            "achats_rembourses": 0, "remboursements_centimes": 0,
            "photos_importees": 0, "retouches_creees": 0, "videos_creees": 0})
        ligne.update(photos_importees=photos.get(compte.id, 0), retouches_creees=retouches.get(compte.id, 0), videos_creees=videos.get(compte.id, 0))
    depenses = frais.resume(s, sum(revenus.values()))
    for ligne in par_compte.values():
        cout = depenses["par_compte"].get(ligne["id"])
        ligne.update(frais_centimes=cout, marge_provisoire_centimes=(ligne["ca_photo_centimes"] + ligne["ca_video_centimes"] - cout) if cout is not None else None)
    return {"devise": "EUR", "ca_photo_centimes": revenus.get("photo", 0),
        "ca_video_centimes": revenus.get("video", 0), "ca_total_centimes": sum(revenus.values()),
        "encaissements_bruts_centimes": sum(achat.montant_centimes for achat, _ in operations),
        "remboursements_centimes": sum(achat.montant_centimes for achat, _ in remboursements),
        "achats_rembourses": len(remboursements),
        "achats_payes": len(ventes), "photos_importees": sum(photos.values()),
        "retouches_creees": sum(retouches.values()), "videos_creees": sum(videos.values()),
        "cout_fournisseur": depenses["montant_centimes"], "benefice": None, "frais": depenses,
        "note_couts": "La marge provisoire correspond aux encaissements nets moins les frais saisis en euros. Elle reste partielle tant que tous les frais, taxes et commissions ne sont pas rapprochés des justificatifs. Une recharge API n’est pas le coût d’une génération.",
        "par_compte": sorted(par_compte.values(), key=lambda ligne: (ligne["ca_photo_centimes"] + ligne["ca_video_centimes"] + ligne["remboursements_centimes"], ligne["photos_importees"] + ligne["videos_creees"]), reverse=True),
        "ventes_recentes": [{"id": achat.id, "compte": compte.email, "nature": achat.nature,
            "pack": achat.pack_id, "credits": achat.credits, "montant_centimes": achat.montant_centimes,
            "statut": achat.statut, "date": utc(achat.credite_le)} for achat, compte in operations[:50]]}


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


@routeur.get("/alertes")
def liste_alertes(page: int = Query(1, ge=1), acteur: Compte = Depends(administrateur),
                 s: Session = Depends(session)):
    # Les quotas confirmés sont la source de vérité. Les réservations en cours
    # ne produisent pas d'alerte. Un achat ou un déblocage résout l'alerte dans
    # la même transaction que la remise à zéro, sans doublon de notification.
    # Les administrateurs et le propriétaire ne sont pas bloqués par ces quotas.
    filtres = [Compte.statut == "actif", Compte.role == "client", or_(
        and_(QuotaCreation.nature == "photo", QuotaCreation.utilisees >= limites.plafond("photo")),
        and_(QuotaCreation.nature == "video", QuotaCreation.utilisees >= limites.plafond("video")),
    )]
    requete = select(QuotaCreation, Compte).join(Compte, Compte.id == QuotaCreation.compte_id).where(*filtres)
    total = s.scalar(select(func.count()).select_from(QuotaCreation).join(
        Compte, Compte.id == QuotaCreation.compte_id).where(*filtres))
    lignes = s.execute(requete.order_by(Compte.cree_le.desc(), Compte.id, QuotaCreation.nature)
                       .offset((page - 1) * 20).limit(20)).all()
    return {"total": total, "page": page, "par_page": 20, "alertes": [
        {"id": f"quota:{c.id}:{q.nature}:{q.periode}", "nature": q.nature,
         "utilisees": q.utilisees, "limite": limites.plafond(q.nature), "compte": identite(c),
         "message": f"Ce compte a atteint la limite de {limites.plafond(q.nature)} créations "
                    f"{'photo' if q.nature == 'photo' else 'vidéo'} depuis son dernier achat. "
                    "Les nouvelles créations sont bloquées ; les fichiers déjà achetés restent accessibles."}
        for q, c in lignes]}


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
            "limites": limites.vue(s, c.id),
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
    if d.action == "reinitialiser_essais":
        if c.statut != "actif":
            raise HTTPException(409, "Réactivez le compte avant de débloquer ses créations.")
        quotas_avant = limites.vue(s, c.id)
        limites.reinitialiser(s, c.id)
        c.revision_admin += 1
        journal(s, acteur, c, d.action, {"avant": quotas_avant})
        s.commit()
        return identite(c)
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

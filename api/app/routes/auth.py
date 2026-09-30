"""Connexion sans mot de passe : un mail, un code à 6 chiffres, un jeton."""
import secrets
import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from ..config import reglages
from ..db import session
from ..mail import disponible as email_disponible, envoyer_code_connexion
from ..models import CodeConnexion, Compte, ConnexionCompte, Jeton, TentativeConnexion, maintenant

routeur = APIRouter(prefix="/auth", tags=["connexion"])
journal = logging.getLogger("studioannonce.auth")


class DemandeCode(BaseModel):
    email: EmailStr


class Verification(BaseModel):
    email: EmailStr
    code: str


@routeur.post("/code")
def demander_code(d: DemandeCode, s: Session = Depends(session)):
    if not email_disponible() and not reglages.CODE_DANS_LA_REPONSE:
        raise HTTPException(503, "La connexion par email n'est pas encore disponible.")
    email = d.email.lower()
    existant = s.scalar(select(Compte).where(Compte.email == email))
    if existant and existant.statut != "actif":
        # Même réponse publique : ne pas révéler l'existence d'un compte bloqué.
        return {"ok": True}
    # expire_le = émission + 10 minutes ; cette borne couvre la dernière heure.
    derniere_heure = maintenant() - timedelta(minutes=50)
    demandes = s.scalar(select(func.count(CodeConnexion.id)).where(
        CodeConnexion.email == email, CodeConnexion.expire_le >= derniere_heure)) or 0
    if demandes >= 3:
        raise HTTPException(429, "Trop de codes demandés pour cette adresse. Réessayez dans une heure.")
    code = f"{secrets.randbelow(1_000_000):06d}"
    s.execute(update(CodeConnexion).where(CodeConnexion.email == email, CodeConnexion.utilise == 0)
              .values(utilise=1))
    s.add(CodeConnexion(email=email, code=code, expire_le=maintenant() + timedelta(minutes=10)))
    if email_disponible():
        try:
            message_id = envoyer_code_connexion(email, code)
            journal.info("email_connexion_accepte domaine=%s message_id=%s", email.rsplit("@", 1)[-1], message_id)
        except Exception as erreur:
            s.rollback()
            journal.warning("email_connexion_refuse domaine=%s erreur=%s", email.rsplit("@", 1)[-1], type(erreur).__name__)
            raise HTTPException(503, "Le code n'a pas pu être envoyé. Réessayez plus tard.") from erreur
    s.commit()
    if reglages.CODE_DANS_LA_REPONSE and not email_disponible():
        return {"ok": True, "code_demo": code}
    return {"ok": True}


@routeur.post("/verifier")
def verifier(v: Verification, s: Session = Depends(session)):
    if not email_disponible() and not reglages.CODE_DANS_LA_REPONSE:
        raise HTTPException(503, "La connexion par email n'est pas encore disponible.")
    email = v.email.lower()
    if len(v.code) != 6 or not v.code.isascii() or not v.code.isdigit():
        raise HTTPException(400, "Code incorrect ou expiré.")
    tentatives = s.scalar(select(func.count(TentativeConnexion.id)).where(
        TentativeConnexion.email == email, TentativeConnexion.cree_le >= maintenant() - timedelta(minutes=10))) or 0
    if tentatives >= 5:
        raise HTTPException(429, "Trop de codes incorrects. Réessayez dans dix minutes.")
    c = s.execute(select(CodeConnexion).where(CodeConnexion.email == email, CodeConnexion.code == v.code,
                                               CodeConnexion.utilise == 0).order_by(CodeConnexion.id.desc())).scalars().first()
    if not c or c.expire_le < maintenant():
        s.add(TentativeConnexion(email=email))
        s.commit()
        raise HTTPException(400, "Code incorrect ou expiré.")
    # Consommer le code atomiquement : deux validations concurrentes ne créent pas deux sessions.
    consomme = s.execute(update(CodeConnexion).where(
        CodeConnexion.id == c.id, CodeConnexion.utilise == 0
    ).values(utilise=1)).rowcount
    if not consomme:
        s.rollback()
        raise HTTPException(400, "Code incorrect ou expiré.")
    compte = s.execute(select(Compte).where(Compte.email == email)).scalar_one_or_none()
    if compte and compte.statut != "actif":
        s.commit()
        raise HTTPException(400, "Code incorrect ou expiré.")
    if not compte:
        compte = Compte(email=email)
        s.add(compte)
        s.flush()
    compte.email_verifie_le = compte.email_verifie_le or maintenant()
    compte.derniere_connexion_le = maintenant()
    s.add(ConnexionCompte(compte_id=compte.id))
    jeton = Jeton(valeur=secrets.token_urlsafe(32), compte_id=compte.id)
    s.add(jeton)
    s.commit()
    return {"jeton": jeton.valeur, "compte_id": compte.id,
            "profil_complet": bool(compte.prenom and compte.nom and compte.profil_complete_le)}


def compte_courant(authorization: str = Header(default=""), s: Session = Depends(session)) -> Compte:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Connexion requise.")
    j = s.get(Jeton, authorization[7:])
    if not j:
        raise HTTPException(401, "Session inconnue, reconnectez-vous.")
    compte = s.get(Compte, j.compte_id)
    if not compte or compte.statut != "actif":
        raise HTTPException(401, "Ce compte n’est pas accessible. Contactez l’administrateur.")
    return compte


@routeur.post("/deconnexion")
def deconnexion(authorization: str = Header(default=""), s: Session = Depends(session)):
    if authorization.startswith("Bearer "):
        s.execute(delete(Jeton).where(Jeton.valeur == authorization[7:]))
        s.commit()
    return {"ok": True}


def compte_complet(compte: Compte = Depends(compte_courant)) -> Compte:
    if not compte.prenom or not compte.nom or not compte.profil_complete_le:
        raise HTTPException(403, "Complétez votre prénom et votre nom dans Mon compte avant de continuer.")
    return compte

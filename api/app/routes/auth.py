"""Inscription vérifiée par email, connexion par mot de passe et reprise des anciens comptes."""
import secrets
import logging
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from ..config import reglages
from ..db import session
from ..mail import disponible as email_disponible, envoyer_code_connexion, envoyer_code_securite
from ..mots_de_passe import hacher, valider, verifier as verifier_mot_de_passe
from ..models import CodeConnexion, Compte, ConnexionCompte, Jeton, TentativeConnexion, maintenant

routeur = APIRouter(prefix="/auth", tags=["connexion"])
journal = logging.getLogger("studioannonce.auth")


class DemandeCode(BaseModel):
    email: EmailStr


class Verification(BaseModel):
    email: EmailStr
    code: str
    intention: Literal["connexion", "inscription"] = "inscription"


class Inscription(BaseModel):
    email: EmailStr
    mot_de_passe: str
    prenom: str
    nom: str


class Connexion(BaseModel):
    email: EmailStr
    mot_de_passe: str


class VerificationCode(BaseModel):
    email: EmailStr
    code: str


class Reinitialisation(VerificationCode):
    mot_de_passe: str


def _limite_codes(s: Session, email: str) -> None:
    derniere_heure = maintenant() - timedelta(minutes=50)
    demandes = s.scalar(select(func.count(CodeConnexion.id)).where(
        CodeConnexion.email == email, CodeConnexion.expire_le >= derniere_heure)) or 0
    if demandes >= 3:
        raise HTTPException(429, "Trop de codes demandés pour cette adresse. Réessayez dans une heure.")


def _emettre_code(s: Session, email: str, usage: str) -> str:
    _limite_codes(s, email)
    code = f"{secrets.randbelow(1_000_000):06d}"
    s.execute(update(CodeConnexion).where(CodeConnexion.email == email, CodeConnexion.usage == usage,
                                         CodeConnexion.utilise == 0).values(utilise=1))
    s.add(CodeConnexion(email=email, code=code, usage=usage,
                        expire_le=maintenant() + timedelta(minutes=10)))
    return code


def _consommer_code(s: Session, email: str, code: str, usage: str) -> None:
    if len(code) != 6 or not code.isascii() or not code.isdigit():
        raise HTTPException(400, "Code incorrect ou expiré.")
    tentatives = s.scalar(select(func.count(TentativeConnexion.id)).where(
        TentativeConnexion.email == email,
        TentativeConnexion.cree_le >= maintenant() - timedelta(minutes=10))) or 0
    if tentatives >= 5:
        raise HTTPException(429, "Trop de tentatives. Réessayez dans dix minutes.")
    c = s.execute(select(CodeConnexion).where(CodeConnexion.email == email, CodeConnexion.code == code,
                                               CodeConnexion.usage == usage, CodeConnexion.utilise == 0)
                  .order_by(CodeConnexion.id.desc())).scalars().first()
    if not c or c.expire_le < maintenant():
        s.add(TentativeConnexion(email=email))
        s.commit()
        raise HTTPException(400, "Code incorrect ou expiré.")
    consomme = s.execute(update(CodeConnexion).where(CodeConnexion.id == c.id,
                                                     CodeConnexion.utilise == 0).values(utilise=1)).rowcount
    if not consomme:
        s.rollback()
        raise HTTPException(400, "Code incorrect ou expiré.")


def _session(s: Session, compte: Compte) -> dict:
    s.execute(delete(TentativeConnexion).where(TentativeConnexion.email == compte.email))
    compte.derniere_connexion_le = maintenant()
    s.add(ConnexionCompte(compte_id=compte.id))
    jeton = Jeton(valeur=secrets.token_urlsafe(32), compte_id=compte.id)
    s.add(jeton)
    s.commit()
    return {"jeton": jeton.valeur, "compte_id": compte.id,
            "profil_complet": bool(compte.prenom and compte.nom and compte.profil_complete_le)}


@routeur.post("/inscription")
def inscrire(d: Inscription, s: Session = Depends(session)):
    if not email_disponible() and not reglages.CODE_DANS_LA_REPONSE:
        raise HTTPException(503, "La vérification par email est momentanément indisponible.")
    try:
        empreinte = hacher(d.mot_de_passe)
    except ValueError as erreur:
        raise HTTPException(422, str(erreur)) from erreur
    prenom, nom, email = d.prenom.strip(), d.nom.strip(), d.email.lower()
    if not prenom or not nom or len(prenom) > 80 or len(nom) > 80:
        raise HTTPException(422, "Indiquez votre prénom et votre nom.")
    compte = s.scalar(select(Compte).where(Compte.email == email))
    if compte and compte.email_verifie_le:
        raise HTTPException(409, "Cette adresse possède déjà un compte. Connectez-vous ou réinitialisez votre mot de passe.")
    if compte and compte.statut != "actif":
        raise HTTPException(409, "Ce compte n’est pas accessible. Contactez le support.")
    code = _emettre_code(s, email, "inscription")
    if not compte:
        compte = Compte(email=email)
        s.add(compte)
    compte.prenom, compte.nom = prenom, nom
    compte.profil_complete_le = maintenant()
    compte.mot_de_passe_hash = empreinte
    if email_disponible():
        try:
            envoyer_code_securite(email, code, "inscription")
        except Exception as erreur:
            s.rollback()
            journal.warning("email_inscription_refuse domaine=%s erreur=%s", email.rsplit("@", 1)[-1], type(erreur).__name__)
            raise HTTPException(503, "Le code n'a pas pu être envoyé. Réessayez plus tard.") from erreur
    s.commit()
    return {"ok": True, **({"code_demo": code} if reglages.CODE_DANS_LA_REPONSE and not email_disponible() else {})}


@routeur.post("/inscription/verifier")
def confirmer_inscription(v: VerificationCode, s: Session = Depends(session)):
    email = v.email.lower()
    _consommer_code(s, email, v.code, "inscription")
    compte = s.scalar(select(Compte).where(Compte.email == email))
    if not compte or compte.statut != "actif" or not compte.mot_de_passe_hash:
        s.commit()
        raise HTTPException(400, "Code incorrect ou expiré.")
    nouveau = compte.email_verifie_le is None
    compte.email_verifie_le = maintenant()
    return {**_session(s, compte), "nouveau_compte": nouveau}


@routeur.post("/connexion")
def connecter(d: Connexion, s: Session = Depends(session)):
    email = d.email.lower()
    tentatives = s.scalar(select(func.count(TentativeConnexion.id)).where(
        TentativeConnexion.email == email,
        TentativeConnexion.cree_le >= maintenant() - timedelta(minutes=10))) or 0
    if tentatives >= 5:
        raise HTTPException(429, "Trop de tentatives. Réessayez dans dix minutes.")
    compte = s.scalar(select(Compte).where(Compte.email == email))
    if compte and compte.statut == "actif" and not compte.mot_de_passe_hash:
        raise HTTPException(409, "Ce compte a été créé sans mot de passe. Utilisez « Mot de passe oublié » pour en définir un.")
    if not compte or compte.statut != "actif" or not compte.email_verifie_le or not verifier_mot_de_passe(d.mot_de_passe, compte.mot_de_passe_hash):
        s.add(TentativeConnexion(email=email))
        s.commit()
        raise HTTPException(401, "Email ou mot de passe incorrect.")
    return _session(s, compte)


@routeur.post("/mot-de-passe/code")
def demander_reinitialisation(d: DemandeCode, s: Session = Depends(session)):
    if not email_disponible() and not reglages.CODE_DANS_LA_REPONSE:
        raise HTTPException(503, "L’envoi d’email est momentanément indisponible.")
    email = d.email.lower()
    _limite_codes(s, email)
    compte = s.scalar(select(Compte).where(Compte.email == email))
    if not compte or compte.statut != "actif" or not compte.email_verifie_le:
        return {"ok": True}
    code = _emettre_code(s, email, "reinitialisation")
    if email_disponible():
        try:
            envoyer_code_securite(email, code, "reinitialisation")
        except Exception as erreur:
            s.rollback()
            journal.warning("email_reinitialisation_refuse domaine=%s erreur=%s", email.rsplit("@", 1)[-1], type(erreur).__name__)
            raise HTTPException(503, "Le code n'a pas pu être envoyé. Réessayez plus tard.") from erreur
    s.commit()
    return {"ok": True, **({"code_demo": code} if reglages.CODE_DANS_LA_REPONSE and not email_disponible() else {})}


@routeur.post("/mot-de-passe/reinitialiser")
def reinitialiser(v: Reinitialisation, s: Session = Depends(session)):
    try:
        valider(v.mot_de_passe)
    except ValueError as erreur:
        raise HTTPException(422, str(erreur)) from erreur
    email = v.email.lower()
    _consommer_code(s, email, v.code, "reinitialisation")
    compte = s.scalar(select(Compte).where(Compte.email == email))
    if not compte or compte.statut != "actif" or not compte.email_verifie_le:
        s.commit()
        raise HTTPException(400, "Code incorrect ou expiré.")
    compte.mot_de_passe_hash = hacher(v.mot_de_passe)
    s.execute(delete(TentativeConnexion).where(TentativeConnexion.email == email))
    s.execute(delete(Jeton).where(Jeton.compte_id == compte.id))
    s.commit()
    return {"ok": True}


@routeur.post("/code")
def demander_code(d: DemandeCode, s: Session = Depends(session)):
    if not email_disponible() and not reglages.CODE_DANS_LA_REPONSE:
        raise HTTPException(503, "La connexion par email n'est pas encore disponible.")
    email = d.email.lower()
    existant = s.scalar(select(Compte).where(Compte.email == email))
    if not existant or existant.statut != "actif" or existant.mot_de_passe_hash:
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
                                               CodeConnexion.usage == "connexion",
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
    if compte and (compte.statut != "actif" or compte.mot_de_passe_hash):
        s.commit()
        raise HTTPException(400, "Code incorrect ou expiré.")
    if not compte:
        s.commit()
        raise HTTPException(404, "Aucun compte n’est associé à cette adresse. Créez votre compte pour commencer.")
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

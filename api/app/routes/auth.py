"""Connexion sans mot de passe : un mail, un code à 6 chiffres, un jeton."""
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import reglages
from ..db import session
from ..mail import envoyer
from ..models import CodeConnexion, Compte, Jeton, maintenant

routeur = APIRouter(prefix="/auth", tags=["connexion"])


class DemandeCode(BaseModel):
    email: EmailStr


class Verification(BaseModel):
    email: EmailStr
    code: str


@routeur.post("/code")
def demander_code(d: DemandeCode, s: Session = Depends(session)):
    code = f"{secrets.randbelow(1_000_000):06d}"
    s.add(CodeConnexion(email=d.email.lower(), code=code, expire_le=maintenant() + timedelta(minutes=10)))
    s.commit()
    envoyer(d.email, "Votre code Studio Annonce", f"Votre code de connexion : {code}\nIl est valable 10 minutes.")
    if reglages.CODE_DANS_LA_REPONSE and not reglages.SMTP_HOST:
        return {"ok": True, "code_demo": code}
    return {"ok": True}


@routeur.post("/verifier")
def verifier(v: Verification, s: Session = Depends(session)):
    email = v.email.lower()
    c = s.execute(select(CodeConnexion).where(CodeConnexion.email == email, CodeConnexion.code == v.code,
                                               CodeConnexion.utilise == 0).order_by(CodeConnexion.id.desc())).scalars().first()
    if not c or c.expire_le < maintenant():
        raise HTTPException(400, "Code incorrect ou expiré.")
    c.utilise = 1
    compte = s.execute(select(Compte).where(Compte.email == email)).scalar_one_or_none()
    if not compte:
        compte = Compte(email=email)
        s.add(compte)
        s.flush()
    jeton = Jeton(valeur=secrets.token_urlsafe(32), compte_id=compte.id)
    s.add(jeton)
    s.commit()
    return {"jeton": jeton.valeur, "compte_id": compte.id}


def compte_courant(authorization: str = Header(default=""), s: Session = Depends(session)) -> Compte:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Connexion requise.")
    j = s.get(Jeton, authorization[7:])
    if not j:
        raise HTTPException(401, "Session inconnue, reconnectez-vous.")
    return s.get(Compte, j.compte_id)

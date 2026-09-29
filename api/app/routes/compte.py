from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import credits
from ..config import reglages
from ..db import session
from ..models import Compte, MouvementCredit, maintenant
from ..paiements import PACKS, disponible as paiement_disponible
from .auth import compte_courant

routeur = APIRouter(prefix="/compte", tags=["compte"])

class Profil(BaseModel):
    prenom: str = Field(min_length=1, max_length=80)
    nom: str = Field(min_length=1, max_length=80)

    @field_validator("prenom", "nom")
    @classmethod
    def nettoyer(cls, valeur):
        valeur = " ".join(valeur.split())
        if not valeur or any(ord(c) < 32 for c in valeur):
            raise ValueError("Renseignez votre prénom et votre nom.")
        return valeur


@routeur.patch("/profil")
def enregistrer_profil(profil: Profil, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    compte.prenom, compte.nom = profil.prenom, profil.nom
    compte.profil_complete_le = compte.profil_complete_le or maintenant()
    s.commit()
    return moi(compte, s)


@routeur.get("")
def moi(compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    mouvements = s.execute(select(MouvementCredit).where(MouvementCredit.compte_id == compte.id)
                           .order_by(MouvementCredit.id.desc()).limit(50)).scalars().all()
    return {"id": compte.id, "email": compte.email, "prenom": compte.prenom, "nom": compte.nom,
            "profil_complet": bool(compte.prenom and compte.nom and compte.profil_complete_le),
            "paiement_disponible": paiement_disponible(), "solde": credits.solde(s, compte.id),
            "photo_offerte_disponible": compte.photos_offertes_utilisees < reglages.PHOTO_OFFERTE_PAR_COMPTE,
            "packs": PACKS,
            "registre": [{"delta": m.delta, "motif": m.motif, "le": m.cree_le.isoformat()} for m in mouvements]}

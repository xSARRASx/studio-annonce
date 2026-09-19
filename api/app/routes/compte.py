from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import credits
from ..config import reglages
from ..db import session
from ..models import Compte, MouvementCredit
from .auth import compte_courant

routeur = APIRouter(prefix="/compte", tags=["compte"])

PACKS = [  # prix décidés avec Martin le 18/09/2026
    {"id": "p5", "credits": 5, "prix_centimes": 890, "libelle": "5 photos"},
    {"id": "p10", "credits": 10, "prix_centimes": 1490, "libelle": "10 photos"},
    {"id": "p25", "credits": 25, "prix_centimes": 2990, "libelle": "25 photos"},
]


@routeur.get("")
def moi(compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    mouvements = s.execute(select(MouvementCredit).where(MouvementCredit.compte_id == compte.id)
                           .order_by(MouvementCredit.id.desc()).limit(50)).scalars().all()
    return {"id": compte.id, "email": compte.email, "solde": credits.solde(s, compte.id),
            "photo_offerte_disponible": compte.photos_offertes_utilisees < reglages.PHOTO_OFFERTE_PAR_COMPTE,
            "packs": PACKS,
            "registre": [{"delta": m.delta, "motif": m.motif, "le": m.cree_le.isoformat()} for m in mouvements]}

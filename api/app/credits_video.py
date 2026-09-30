"""Solde vidéo séparé : le client ne doit jamais convertir mentalement une photo en secondes."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Compte, MouvementCreditVideo


def solde(s: Session, compte_id: str) -> int:
    return int(s.execute(select(func.coalesce(func.sum(MouvementCreditVideo.delta), 0))
                         .where(MouvementCreditVideo.compte_id == compte_id)).scalar() or 0)


def mouvement(s: Session, compte: Compte, delta: int, motif: str, reference: str = "") -> None:
    s.add(MouvementCreditVideo(compte_id=compte.id, delta=delta, motif=motif, reference=reference))

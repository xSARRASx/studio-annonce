"""Le solde d'un compte, c'est la somme de son registre. Rien d'autre."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Compte, MouvementCredit


def solde(s: Session, compte_id: str) -> int:
    return int(s.execute(select(func.coalesce(func.sum(MouvementCredit.delta), 0))
                         .where(MouvementCredit.compte_id == compte_id)).scalar() or 0)


def mouvement(s: Session, compte: Compte, delta: int, motif: str, reference: str = "") -> None:
    s.add(MouvementCredit(compte_id=compte.id, delta=delta, motif=motif, reference=reference))

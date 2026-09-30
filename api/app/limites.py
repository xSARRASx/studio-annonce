"""Limites de créations communes à tous les appareils.

Appeler les mutations sous le verrou SQL du compte et valider dans la même
transaction que l'opération métier. Aucun compteur n'est fourni par le client.
Un import, une connexion, un téléchargement offert ou répété ne réinitialise rien.
"""
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import reglages
from .models import QuotaCreation, ReservationCreation, maintenant


def plafond(nature: str) -> int:
    if nature not in ("photo", "video"):
        raise ValueError("Type de création inconnu")
    return reglages.CREATIONS_PHOTO_SANS_ACHAT if nature == "photo" else reglages.CREATIONS_VIDEO_SANS_ACHAT


def _quota(s: Session, compte_id: str, nature: str) -> QuotaCreation:
    plafond(nature)
    q = s.get(QuotaCreation, (compte_id, nature))
    if q is None:
        q = QuotaCreation(compte_id=compte_id, nature=nature, periode=0, utilisees=0)
        s.add(q)
        s.flush()
    return q


def vue(s: Session, compte_id: str) -> dict:
    resultat = {"support_url": reglages.SUPPORT_URL, "support_telephone": reglages.SUPPORT_TELEPHONE,
                "support_email": reglages.SUPPORT_EMAIL}
    for nature in ("photo", "video"):
        q = s.get(QuotaCreation, (compte_id, nature))
        en_cours = s.scalar(select(func.count()).select_from(ReservationCreation).where(
            ReservationCreation.compte_id == compte_id, ReservationCreation.nature == nature,
            ReservationCreation.periode == (q.periode if q else 0),
            ReservationCreation.statut == "en_cours", ReservationCreation.expire_le > maintenant())) or 0
        utilisees = q.utilisees if q else 0
        limite = plafond(nature)
        resultat[nature] = {"utilisees": utilisees, "en_cours": en_cours, "limite": limite,
                            "restantes": max(0, limite - utilisees - en_cours),
                            "bloque": utilisees + en_cours >= limite}
    return resultat


def verifier(s: Session, compte_id: str, nature: str) -> None:
    plafond(nature)
    if vue(s, compte_id)[nature]["bloque"]:
        raise HTTPException(429, "Limite de créations sans achat atteinte. Contactez le support pour débloquer vos créations. Vos contenus achetés restent accessibles.")


def reserver(s: Session, compte_id: str, nature: str, jeton: str) -> None:
    verifier(s, compte_id, nature)
    q = _quota(s, compte_id, nature)
    s.add(ReservationCreation(jeton=jeton, compte_id=compte_id, nature=nature, periode=q.periode,
                              statut="en_cours", expire_le=maintenant() + timedelta(minutes=10)))


def terminer(s: Session, jeton: str, reussie: bool) -> None:
    r = s.get(ReservationCreation, jeton)
    if not r or r.statut != "en_cours":
        return
    q = _quota(s, r.compte_id, r.nature)
    if reussie and r.expire_le <= maintenant():
        raise HTTPException(409, "La réservation a expiré. Réessayez ; aucun essai supplémentaire n’a été compté.")
    # Un achat pendant la génération ouvre une autre période. Une réponse tardive
    # ne consomme pas le quota de cette nouvelle période et ne peut pas le réduire.
    if reussie and q.periode == r.periode:
        q.utilisees += 1
    r.statut = "terminee" if reussie else "echec"


def reinitialiser(s: Session, compte_id: str, nature: str | None = None) -> None:
    for type_creation in ((nature,) if nature else ("photo", "video")):
        q = _quota(s, compte_id, type_creation)
        q.periode += 1
        q.utilisees = 0
        q.reinitialise_le = maintenant()

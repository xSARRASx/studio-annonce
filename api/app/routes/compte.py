from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from .. import acces_ia, credits, credits_video, justificatifs, limites, publicite
from ..config import reglages
from ..db import session
from ..models import (AchatCredits, AttributionPublicitaire, Compte, ConversionPublicitaire, Logement,
                      Photo, MouvementCredit, MouvementCreditVideo, maintenant)
from ..paiements import PACKS_PHOTO, PACKS_VIDEO, photo_disponible, video_disponible
from .auth import compte_courant

routeur = APIRouter(prefix="/compte", tags=["compte"])


class AccordPublicitaire(BaseModel):
    model_config = ConfigDict(extra="forbid")
    consentement: Literal[True]
    date_consentement: datetime


class ClicPublicitaire(AccordPublicitaire):
    identifiant: str = Field(pattern=r"^[A-Za-z0-9_-]{1,250}$")
    type: Literal["gclid", "gbraid", "wbraid"]
    date_clic: datetime
    achat_id: str | None = Field(default=None, max_length=24)


class ConfirmationConversion(AccordPublicitaire):
    ticket: str = Field(min_length=1, max_length=24)


@routeur.post("/publicite")
def attribution(d: ClicPublicitaire, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    consent = publicite.verifier_consentement(d)
    clic = publicite.date_utc(d.date_clic)
    if not maintenant() - timedelta(days=90) <= clic <= maintenant() + timedelta(minutes=5):
        raise HTTPException(422, "Ce clic publicitaire a expiré.")
    publicite.verrou(s, compte)
    if compte.role != "client":
        s.rollback(); return {"enregistre": False}
    attr = s.get(AttributionPublicitaire, compte.id) or AttributionPublicitaire(compte_id=compte.id)
    attr.identifiant, attr.type, attr.date_clic, attr.date_consentement = d.identifiant, d.type, clic, consent
    s.add(attr); s.flush()
    if d.achat_id:
        achat = publicite.commande(s, compte, d.achat_id)
        publicite.suivi(s, compte, achat, consent)
    s.commit(); return {"enregistre": True}


@routeur.post("/publicite/revoquer")
def revoquer_publicite(compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    publicite.verrou(s, compte)
    s.execute(delete(AttributionPublicitaire).where(AttributionPublicitaire.compte_id == compte.id))
    achats_ids = select(AchatCredits.id).where(AchatCredits.compte_id == compte.id)
    s.execute(update(ConversionPublicitaire).where(ConversionPublicitaire.achat_id.in_(achats_ids))
              .values(identifiant="", type="", date_clic=None))
    s.commit(); return {"revoque": True}


@routeur.post("/achats/{achat_id}/conversion")
def conversion_achat(achat_id: str, d: AccordPublicitaire, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    return publicite.reserver_conversion(s, compte, achat_id, publicite.verifier_consentement(d))


@routeur.post("/achats/{achat_id}/conversion/confirmer")
def confirmer_conversion(achat_id: str, d: ConfirmationConversion, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    publicite.verifier_consentement(d); publicite.verrou(s, compte)
    achat = publicite.commande(s, compte, achat_id)
    suivi = s.get(ConversionPublicitaire, achat.id)
    if not suivi or suivi.ticket != d.ticket or achat.statut != "paye":
        raise HTTPException(409, "Cette conversion ne peut pas être confirmée.")
    suivi.envoye_le = suivi.envoye_le or maintenant()
    s.commit(); return {"confirme": True}


@routeur.get("/achats")
def achats(compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    commandes = s.execute(select(AchatCredits).where(AchatCredits.compte_id == compte.id)
                          .order_by(AchatCredits.cree_le.desc()).limit(100)).scalars().all()
    return [{"id": achat.id, "nature": achat.nature, "credits": achat.credits,
             "montant_centimes": achat.montant_centimes, "devise": achat.devise,
             "statut": achat.statut, "cree_le": achat.cree_le.isoformat(),
             "test": not bool(achat.reel)} for achat in commandes]


@routeur.get("/achats/{achat_id}/documents")
def documents_achat(achat_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    achat = s.get(AchatCredits, achat_id)
    if not achat or achat.compte_id != compte.id:
        raise HTTPException(404, "Achat introuvable.")
    # Ne garder aucune transaction SQL ouverte pendant la lecture chez Stripe.
    s.expunge(achat)
    s.rollback()
    return justificatifs.documents(achat)

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
    mouvements_video = s.execute(select(MouvementCreditVideo).where(MouvementCreditVideo.compte_id == compte.id)
                                 .order_by(MouvementCreditVideo.id.desc()).limit(50)).scalars().all()
    photo_offerte_telechargee = s.scalar(select(Photo.id).join(Logement).where(
        Logement.compte_id == compte.id, Photo.offerte == 1, Photo.credite_le.is_not(None)).limit(1)) is not None
    return {"id": compte.id, "email": compte.email, "prenom": compte.prenom, "nom": compte.nom,
            "role": compte.role,
            "gratuit_illimite": acces_ia.gratuit_proprietaire(compte),
            "profil_complet": bool(compte.prenom and compte.nom and compte.profil_complete_le),
            "paiement_disponible": photo_disponible(),
            "paiement_photo_disponible": photo_disponible(),
            "paiement_video_disponible": video_disponible(),
            "solde": credits.solde(s, compte.id), "solde_video": credits_video.solde(s, compte.id),
            "photo_offerte_disponible": compte.photos_offertes_utilisees < reglages.PHOTO_OFFERTE_PAR_COMPTE,
            "photo_offerte_telechargee": photo_offerte_telechargee,
            "packs": PACKS_PHOTO, "packs_photo": PACKS_PHOTO, "packs_video": PACKS_VIDEO,
            "limites": limites.vue(s, compte.id),
            "registre": [{"delta": m.delta, "motif": m.motif, "le": m.cree_le.isoformat()} for m in mouvements],
            "registre_video": [{"delta": m.delta, "motif": m.motif, "le": m.cree_le.isoformat()} for m in mouvements_video]}

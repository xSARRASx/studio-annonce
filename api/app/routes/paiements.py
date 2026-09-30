"""Checkout hébergé. Aucun crédit n'est accordé par un retour du navigateur."""
from datetime import timedelta
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import reglages
from ..credits import mouvement
from .. import limites
from ..db import session
from ..models import AchatCredits, Compte, maintenant
from ..paiements import PACKS, disponible
from .auth import compte_complet, compte_courant

routeur = APIRouter(prefix="/paiements", tags=["paiements"])


class DemandeAchat(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pack_id: str
    cle_demande: UUID


@routeur.post("/checkout")
def checkout(d: DemandeAchat, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    if not disponible():
        raise HTTPException(503, "Les achats ne sont pas encore ouverts. Aucun paiement n'a été lancé.")
    pack = next((p for p in PACKS if p["id"] == d.pack_id), None)
    if not pack:
        raise HTTPException(400, "Pack inconnu.")
    condition = (AchatCredits.compte_id == compte.id, AchatCredits.cle_demande == str(d.cle_demande))
    achat = s.scalar(select(AchatCredits).where(*condition))
    if not achat:
        nombre = s.scalar(select(func.count(AchatCredits.id)).where(
            AchatCredits.compte_id == compte.id, AchatCredits.cree_le > maintenant() - timedelta(hours=1))) or 0
        if nombre >= 10:
            raise HTTPException(429, "Trop de demandes de paiement. Réessayez plus tard.")
        achat = AchatCredits(compte_id=compte.id, cle_demande=str(d.cle_demande), pack_id=pack["id"],
                            credits=pack["credits"], montant_centimes=pack["prix_centimes"],
                            reel=int(reglages.STRIPE_SECRET_KEY.startswith(("sk_live_", "rk_live_"))))
        s.add(achat)
        try:
            s.commit()
        except IntegrityError:
            s.rollback()
            achat = s.scalar(select(AchatCredits).where(*condition))
            if not achat:
                raise HTTPException(409, "La demande a changé. Réessayez.")
    if achat.pack_id != d.pack_id:
        raise HTTPException(409, "Cette demande correspond à un autre pack.")
    if achat.credite_le:
        return {"achat_id": achat.id, "statut": "paye", "url": None}
    if achat.statut != "en_attente" or achat.cree_le < maintenant() - timedelta(hours=23):
        raise HTTPException(409, "Cette demande a expiré. Lancez un nouvel achat.")
    if achat.stripe_url:
        return {"achat_id": achat.id, "statut": achat.statut, "url": achat.stripe_url}
    achat_id, compte_id, email = achat.id, compte.id, compte.email
    montant, quantite, pack_id = achat.montant_centimes, achat.credits, achat.pack_id
    s.commit()  # pas de transaction SQL durant l'appel réseau
    site = reglages.URL_PUBLIQUE_SITE.rstrip("/")
    try:
        resultat = stripe.checkout.Session.create(
            api_key=reglages.STRIPE_SECRET_KEY, idempotency_key=f"studio-annonce:{achat_id}",
            mode="payment", payment_method_types=["card"], locale="fr", customer_email=email,
            client_reference_id=compte_id, metadata={"achat_id": achat_id, "compte_id": compte_id},
            line_items=[{"price_data": {"currency": "eur", "unit_amount": montant,
                "product_data": {"name": f"Studio Annonce — {quantite} crédits photo", "metadata": {"pack_id": pack_id}}}, "quantity": 1}],
            success_url=f"{site}/app/compte/?achat={achat_id}",
            cancel_url=f"{site}/app/compte/?paiement=annule",
        )
    except stripe.StripeError as erreur:
        raise HTTPException(502, "Le paiement ne peut pas être ouvert. Réessayez ; aucun crédit n'a été débité.") from erreur
    achat = s.get(AchatCredits, achat_id)
    achat.stripe_session_id = resultat.id
    achat.stripe_url = resultat.url or ""
    s.commit()
    return {"achat_id": achat.id, "statut": achat.statut, "url": achat.stripe_url}


def appliquer_confirmation(objet: dict, s: Session):
    metadata = objet.get("metadata") or {}
    achat = s.get(AchatCredits, metadata.get("achat_id", ""))
    if not achat:
        # Le même compte Stripe peut servir à d'autres applications.
        return
    if (objet.get("mode") != "payment" or objet.get("payment_status") != "paid"
            or objet.get("amount_total") != achat.montant_centimes or objet.get("currency") != achat.devise
            or metadata.get("compte_id") != achat.compte_id or objet.get("client_reference_id") != achat.compte_id
            or bool(objet.get("livemode")) != bool(achat.reel)
            or not objet.get("id", "").startswith("cs_")
            or (achat.stripe_session_id and achat.stripe_session_id != objet.get("id"))):
        raise HTTPException(400, "Confirmation de paiement incohérente.")
    resultat = s.execute(update(AchatCredits).where(
        AchatCredits.id == achat.id, AchatCredits.credite_le.is_(None)
    ).values(credite_le=maintenant(), statut="paye", stripe_session_id=objet["id"]))
    if resultat.rowcount:
        s.execute(update(Compte).where(Compte.id == achat.compte_id).values(photos_offertes_utilisees=Compte.photos_offertes_utilisees))
        mouvement(s, s.get(Compte, achat.compte_id), achat.credits,
                  f"Achat de {achat.credits} crédits photo", f"stripe:{objet['id']}")
        limites.reinitialiser(s, achat.compte_id, "photo")
    s.commit()  # commande et registre validés dans la même transaction


@routeur.post("/webhook")
async def webhook(request: Request, s: Session = Depends(session)):
    # Traiter les règlements déjà lancés même lorsque les nouvelles ventes sont fermées.
    if not reglages.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(503, "Paiement non configuré.")
    corps = await request.body()
    if len(corps) > 1_000_000:
        raise HTTPException(413, "Message trop volumineux.")
    try:
        evenement = stripe.Webhook.construct_event(corps, request.headers.get("stripe-signature", ""),
                                                   reglages.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError) as erreur:
        raise HTTPException(400, "Signature de paiement invalide.") from erreur
    objet = evenement["data"]["object"]
    if evenement["type"] in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        if objet.get("payment_status") == "paid":
            appliquer_confirmation(objet, s)
    elif evenement["type"] in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        achat_id = (objet.get("metadata") or {}).get("achat_id", "")
        s.execute(update(AchatCredits).where(AchatCredits.id == achat_id, AchatCredits.credite_le.is_(None),
            AchatCredits.stripe_session_id == objet.get("id")).values(statut="expire" if evenement["type"].endswith("expired") else "echec"))
        s.commit()
    return {"recu": True}


@routeur.get("/{achat_id}")
def etat(achat_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    achat = s.get(AchatCredits, achat_id)
    if not achat or achat.compte_id != compte.id:
        raise HTTPException(404, "Achat introuvable.")
    return {"id": achat.id, "statut": achat.statut, "credits": achat.credits,
            "montant_centimes": achat.montant_centimes}

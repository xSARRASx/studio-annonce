"""Checkout hébergé. Aucun crédit n'est accordé par un retour du navigateur."""
from datetime import timedelta
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import reglages
from .. import credits as credits_photo, credits_video
from ..credits import mouvement as mouvement_photo
from ..credits_video import mouvement as mouvement_video
from .. import limites
from ..db import session
from ..models import AchatCredits, Compte, MouvementCredit, MouvementCreditVideo, maintenant
from ..paiements import PACKS, disponible
from .auth import compte_complet, compte_courant

routeur = APIRouter(prefix="/paiements", tags=["paiements"])


class ArticleAchat(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pack_id: str
    quantite: int = Field(ge=1, le=20)


class DemandeAchat(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pack_id: str | None = None
    articles: list[ArticleAchat] | None = Field(default=None, max_length=12)
    cle_demande: UUID
    facture: bool = False  # facture Stripe seulement si le client la demande

    @model_validator(mode="after")
    def panier_ou_pack(self):
        if bool(self.pack_id) == bool(self.articles):
            raise ValueError("Indiquez un pack ou un panier.")
        return self


def composer_panier(d: DemandeAchat):
    demandes = ([ArticleAchat(pack_id=d.pack_id, quantite=1)] if d.pack_id else d.articles) or []
    quantites: dict[str, int] = {}
    for article in demandes:
        quantites[article.pack_id] = quantites.get(article.pack_id, 0) + article.quantite
    if not quantites or sum(quantites.values()) > 20 or any(q > 20 for q in quantites.values()):
        raise HTTPException(400, "Panier trop volumineux.")
    packs = {p["id"]: p for p in PACKS}
    if any(pack_id not in packs for pack_id in quantites):
        raise HTTPException(400, "Pack inconnu.")
    composition = [{"pack_id": pack_id, "quantite": quantites[pack_id]}
                   for pack_id in (p["id"] for p in PACKS) if pack_id in quantites]
    natures = {packs[a["pack_id"]]["nature"] for a in composition}
    if len(natures) != 1:
        raise HTTPException(400, "Réglez les crédits photo et vidéo séparément.")
    nature = natures.pop()
    credits = sum(packs[a["pack_id"]]["credits"] * a["quantite"] for a in composition)
    montant = sum(packs[a["pack_id"]]["prix_centimes"] * a["quantite"] for a in composition)
    return composition, packs, nature, credits, montant


@routeur.post("/checkout")
def checkout(d: DemandeAchat, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    composition, packs, nature, credits, montant = composer_panier(d)
    if not disponible(nature):
        service = "vidéo" if nature == "video" else "photo"
        raise HTTPException(503, f"Les achats {service} ne sont pas encore ouverts. Aucun paiement n'a été lancé.")
    condition = (AchatCredits.compte_id == compte.id, AchatCredits.cle_demande == str(d.cle_demande))
    achat = s.scalar(select(AchatCredits).where(*condition))
    if not achat:
        nombre = s.scalar(select(func.count(AchatCredits.id)).where(
            AchatCredits.compte_id == compte.id, AchatCredits.cree_le > maintenant() - timedelta(hours=1))) or 0
        if nombre >= 10:
            raise HTTPException(429, "Trop de demandes de paiement. Réessayez plus tard.")
        identifiant_pack = composition[0]["pack_id"] if len(composition) == 1 and composition[0]["quantite"] == 1 else f"panier-{nature}"
        achat = AchatCredits(compte_id=compte.id, cle_demande=str(d.cle_demande), pack_id=identifiant_pack,
                            composition=composition, nature=nature, credits=credits, montant_centimes=montant,
                            reel=int(reglages.STRIPE_SECRET_KEY.startswith(("sk_live_", "rk_live_"))))
        s.add(achat)
        try:
            s.commit()
        except IntegrityError:
            s.rollback()
            achat = s.scalar(select(AchatCredits).where(*condition))
            if not achat:
                raise HTTPException(409, "La demande a changé. Réessayez.")
    composition_achat = achat.composition or [{"pack_id": achat.pack_id, "quantite": 1}]
    if composition_achat != composition:
        raise HTTPException(409, "Cette demande correspond à un autre panier.")
    if achat.credite_le:
        return {"achat_id": achat.id, "statut": "paye", "url": None}
    if achat.statut != "en_attente" or achat.cree_le < maintenant() - timedelta(hours=23):
        raise HTTPException(409, "Cette demande a expiré. Lancez un nouvel achat.")
    if achat.stripe_url:
        return {"achat_id": achat.id, "statut": achat.statut, "url": achat.stripe_url}
    achat_id, compte_id, email = achat.id, compte.id, compte.email
    # Libellé lisible dans le tableau Stripe, partagé avec d'autres activités.
    description = (f"Studio Annonce — {achat.credits} crédit{'s' if achat.credits > 1 else ''} {'vidéo' if achat.nature == 'video' else 'photo'}"
                   f" (commande {achat.id})")
    nature = achat.nature
    lignes = [{"price_data": {"currency": "eur", "unit_amount": packs[a["pack_id"]]["prix_centimes"],
                "product_data": {"name": f"Studio Annonce — {packs[a['pack_id']]['libelle']}",
                                 "metadata": {"pack_id": a["pack_id"], "nature": nature}}},
               "quantity": a["quantite"]} for a in composition_achat]
    # Facture Stripe émise après le paiement, uniquement à la demande du client.
    facture = {"invoice_creation": {"enabled": True, "invoice_data": {
        "description": description,
        "metadata": {"site": "studioannonce.fr", "achat_id": achat_id, "compte_id": compte_id}}}} if d.facture else {}
    s.commit()  # pas de transaction SQL durant l'appel réseau
    site = reglages.URL_PUBLIQUE_SITE.rstrip("/")
    try:
        resultat = stripe.checkout.Session.create(
            api_key=reglages.STRIPE_SECRET_KEY, idempotency_key=f"studio-annonce:{achat_id}",
            mode="payment", payment_method_types=["card"], locale="fr", customer_email=email,
            client_reference_id=compte_id, metadata={"achat_id": achat_id, "compte_id": compte_id, "nature": nature},
            line_items=lignes,
            payment_intent_data={"description": description,
                                 "metadata": {"site": "studioannonce.fr", "achat_id": achat_id,
                                              "compte_id": compte_id, "nature": nature}},
            **facture,
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
            or metadata.get("nature", achat.nature) != achat.nature
            or bool(objet.get("livemode")) != bool(achat.reel)
            or not objet.get("id", "").startswith("cs_")
            or (achat.stripe_session_id and achat.stripe_session_id != objet.get("id"))):
        raise HTTPException(400, "Confirmation de paiement incohérente.")
    resultat = s.execute(update(AchatCredits).where(
        AchatCredits.id == achat.id, AchatCredits.credite_le.is_(None)
    ).values(credite_le=maintenant(), statut="paye", stripe_session_id=objet["id"]))
    if resultat.rowcount:
        s.execute(update(Compte).where(Compte.id == achat.compte_id).values(photos_offertes_utilisees=Compte.photos_offertes_utilisees))
        cible = s.get(Compte, achat.compte_id)
        if achat.nature == "video":
            mouvement_video(s, cible, achat.credits,
                            f"Achat de {achat.credits} crédits vidéo ({achat.credits * 5} secondes)",
                            f"stripe:{objet['id']}")
            limites.reinitialiser(s, achat.compte_id, "video")
        else:
            mouvement_photo(s, cible, achat.credits,
                            f"Achat de {achat.credits} crédits photo", f"stripe:{objet['id']}")
            limites.reinitialiser(s, achat.compte_id, "photo")
    s.commit()  # commande et registre validés dans la même transaction


def achat_du_paiement(paiement_id: str | None, s: Session):
    """Un remboursement ne porte pas nos métadonnées : retrouver la commande par sa session Checkout."""
    if not paiement_id:
        return None
    try:
        sessions = stripe.checkout.Session.list(api_key=reglages.STRIPE_SECRET_KEY, payment_intent=paiement_id, limit=1)
    except stripe.StripeError as erreur:
        raise HTTPException(502, "Paiement introuvable pour le moment.") from erreur  # Stripe renverra l'événement
    for session_stripe in sessions.data:
        return s.scalar(select(AchatCredits).where(AchatCredits.stripe_session_id == session_stripe.id))
    return None  # le même compte Stripe peut servir à d'autres applications


def reprendre_credits(achat: AchatCredits, objet: dict, rembourse_centimes: int, origine: str, statut_total: str, s: Session):
    """Reprend les crédits d'un achat remboursé ou contesté, au prorata, sans jamais rendre un solde négatif.

    Rejouable : le registre garde ce qui a été repris et ce qui était déjà utilisé."""
    if not achat.credite_le:
        return
    if objet.get("currency") != achat.devise or bool(objet.get("livemode")) != bool(achat.reel):
        raise HTTPException(400, "Remboursement incohérent.")
    # Écriture neutre : verrouille la commande pendant le calcul, comme pour la confirmation.
    s.execute(update(AchatCredits).where(AchatCredits.id == achat.id).values(statut=AchatCredits.statut))
    total = rembourse_centimes >= achat.montant_centimes
    cible = achat.credits if total else achat.credits * max(rembourse_centimes, 0) // achat.montant_centimes
    registre, soldes, mouvement, nom = ((MouvementCreditVideo, credits_video, mouvement_video, "vidéo")
                                        if achat.nature == "video" else
                                        (MouvementCredit, credits_photo, mouvement_photo, "photo"))
    reference, reference_manque = f"reprise:{achat.id}", f"reprise-manque:{achat.id}:"
    repris = -(s.scalar(select(func.coalesce(func.sum(registre.delta), 0)).where(
        registre.compte_id == achat.compte_id, registre.reference == reference)) or 0)
    manques = s.scalars(select(registre.reference).where(
        registre.compte_id == achat.compte_id, registre.reference.like(reference_manque + "%"))).all()
    reste = cible - repris - sum(int(r.rsplit(":", 1)[1]) for r in manques)
    if reste > 0:
        cible_compte = s.get(Compte, achat.compte_id)
        retrait = min(reste, max(soldes.solde(s, achat.compte_id), 0))
        if retrait:
            mouvement(s, cible_compte, -retrait, f"{origine} : reprise de {retrait} crédits {nom}", reference)
        if reste > retrait:
            mouvement(s, cible_compte, 0, f"{origine} : {reste - retrait} crédits {nom} déjà utilisés, non repris",
                      f"{reference_manque}{reste - retrait}")
    if total:
        # Une commande remboursée ou contestée sort du chiffre d'affaires de l'administration.
        s.execute(update(AchatCredits).where(AchatCredits.id == achat.id).values(statut=statut_total))
    s.commit()


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
    elif evenement["type"] == "charge.refunded":
        achat = achat_du_paiement(objet.get("payment_intent"), s)
        if achat:
            reprendre_credits(achat, objet, objet.get("amount_refunded") or 0, "Remboursement", "rembourse", s)
    elif evenement["type"] == "charge.dispute.created":
        achat = achat_du_paiement(objet.get("payment_intent"), s)
        if achat:
            reprendre_credits(achat, objet, achat.montant_centimes, "Contestation bancaire", "conteste", s)
    return {"recu": True}


@routeur.get("/{achat_id}")
def etat(achat_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    achat = s.get(AchatCredits, achat_id)
    if not achat or achat.compte_id != compte.id:
        raise HTTPException(404, "Achat introuvable.")
    return {"id": achat.id, "statut": achat.statut, "nature": achat.nature, "credits": achat.credits,
            "montant_centimes": achat.montant_centimes}

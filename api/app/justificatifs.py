"""Lecture des documents Stripe existants, sans modifier le paiement ni le registre."""
import re
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException

from .config import reglages
from .models import AchatCredits


def url_stripe(valeur):
    if not isinstance(valeur, str) or not valeur or any(ord(c) < 33 for c in valeur):
        return None
    try:
        adresse = urlsplit(valeur)
        hote = adresse.hostname or ""
        if (adresse.scheme == "https" and (hote == "stripe.com" or hote.endswith(".stripe.com"))
                and not adresse.username and not adresse.password and adresse.port in (None, 443)):
            return valeur
    except ValueError:
        pass
    return None


def lire_session(identifiant: str):
    # Ce client ne peut faire qu'une lecture de la session connue de notre commande.
    # Aucune option globale du SDK utilisé par le checkout n'est modifiée.
    try:
        with httpx.Client(timeout=httpx.Timeout(8, connect=3), follow_redirects=False) as client:
            reponse = client.get(f"https://api.stripe.com/v1/checkout/sessions/{identifiant}",
                                auth=(reglages.STRIPE_SECRET_KEY, ""),
                                params=[("expand[]", "invoice"), ("expand[]", "payment_intent.latest_charge")])
            reponse.raise_for_status()
            objet = reponse.json()
        if not isinstance(objet, dict):
            raise ValueError("Réponse invalide")
        return objet
    except (httpx.HTTPError, ValueError) as erreur:
        raise HTTPException(502, "Le justificatif ne peut pas être ouvert pour le moment. Réessayez ; votre achat reste enregistré.") from erreur


def lire_objet(ressource: str, parametres: dict):
    """Deux listes en lecture seule pour les exports, sans modifier le SDK du paiement."""
    if ressource not in ("refunds", "checkout/sessions") or not reglages.STRIPE_SECRET_KEY:
        raise HTTPException(503, "Le rapprochement Stripe est momentanément indisponible.")
    try:
        with httpx.Client(timeout=httpx.Timeout(8, connect=3), follow_redirects=False) as client:
            reponse = client.get(f"https://api.stripe.com/v1/{ressource}", auth=(reglages.STRIPE_SECRET_KEY, ""), params=parametres)
            reponse.raise_for_status(); objet = reponse.json()
        if not isinstance(objet, dict) or not isinstance(objet.get("data"), list):
            raise ValueError("Réponse invalide")
        return objet
    except (httpx.HTTPError, ValueError) as erreur:
        raise HTTPException(502, "Stripe n’a pas répondu au rapprochement. Aucun paiement n’a été modifié.") from erreur


def documents(achat: AchatCredits):
    vide = {"achat_id": achat.id, "documents": []}
    if not achat.credite_le or achat.statut not in ("paye", "rembourse", "conteste"):
        return {**vide, "message": "Un justificatif est disponible après la confirmation du paiement."}
    if not achat.stripe_session_id or not re.fullmatch(r"cs_[A-Za-z0-9_]{1,250}", achat.stripe_session_id):
        return {**vide, "message": "Contactez le support avec la référence de cette commande pour obtenir son justificatif."}
    if not reglages.STRIPE_SECRET_KEY:
        raise HTTPException(503, "L’accès aux justificatifs est momentanément indisponible. Votre achat reste enregistré.")
    objet = lire_session(achat.stripe_session_id)
    metadata = objet.get("metadata") or {}
    if not isinstance(metadata, dict):
        metadata = {}
    if (objet.get("id") != achat.stripe_session_id or objet.get("mode") != "payment"
            or objet.get("payment_status") != "paid" or objet.get("amount_total") != achat.montant_centimes
            or objet.get("currency") != achat.devise or bool(objet.get("livemode")) != bool(achat.reel)
            or objet.get("client_reference_id") != achat.compte_id
            or metadata.get("achat_id") != achat.id or metadata.get("compte_id") != achat.compte_id):
        raise HTTPException(502, "Ce justificatif ne correspond pas à la commande. Contactez le support avec sa référence.")
    trouves = []
    facture = objet.get("invoice")
    if isinstance(facture, dict):
        for champ, genre, libelle in (("invoice_pdf", "facture_pdf", "Télécharger la facture PDF"),
                                     ("hosted_invoice_url", "facture", "Ouvrir la facture")):
            adresse = url_stripe(facture.get(champ))
            if adresse:
                trouves.append({"type": genre, "libelle": libelle, "url": adresse})
    intention = objet.get("payment_intent")
    charge = intention.get("latest_charge") if isinstance(intention, dict) else None
    adresse = url_stripe(charge.get("receipt_url")) if isinstance(charge, dict) else None
    if adresse:
        trouves.append({"type": "recu", "libelle": "Ouvrir le reçu Stripe", "url": adresse})
    return {"achat_id": achat.id, "documents": trouves,
            "message": "" if trouves else "Stripe n’a pas encore fourni de document pour cet achat. Réessayez ou contactez le support avec sa référence."}

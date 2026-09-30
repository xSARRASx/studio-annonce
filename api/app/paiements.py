"""Catalogue serveur et activation explicite des ventes."""
from .config import reglages
from . import retouche, vision

# Pack validé par Martin le 30/09/2026. Nouvel identifiant pour ne jamais
# réinterpréter une ancienne commande au tarif de 14,90 €.
PACKS = [
    {"id": "photo10-999", "credits": 10, "prix_centimes": 999, "libelle": "10 crédits photo"},
]


def disponible() -> bool:
    return bool(reglages.PAIEMENT_ACTIF and reglages.STRIPE_SECRET_KEY
                and reglages.STRIPE_WEBHOOK_SECRET and vision.disponible() and retouche.disponible())

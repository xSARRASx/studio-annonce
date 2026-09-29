"""Catalogue serveur et activation explicite des ventes."""
from .config import reglages
from . import retouche, vision

# Tarifs de travail existants. Ne pas ouvrir les ventes avant validation de la marge.
PACKS = [
    {"id": "p5", "credits": 5, "prix_centimes": 890, "libelle": "5 photos"},
    {"id": "p10", "credits": 10, "prix_centimes": 1490, "libelle": "10 photos"},
    {"id": "p25", "credits": 25, "prix_centimes": 2990, "libelle": "25 photos"},
]


def disponible() -> bool:
    return bool(reglages.PAIEMENT_ACTIF and reglages.STRIPE_SECRET_KEY
                and reglages.STRIPE_WEBHOOK_SECRET and vision.disponible() and retouche.disponible())

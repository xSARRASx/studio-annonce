"""Catalogue serveur et activation explicite des ventes."""
from .config import reglages
from . import retouche, vision

# Les identifiants figent le prix : une ancienne commande n'est jamais
# réinterprétée quand la grille commerciale évolue.
PACKS_PHOTO = [
    {"id": "photo10-999", "nature": "photo", "credits": 10, "prix_centimes": 999,
     "libelle": "10 crédits photo", "prix_unitaire_centimes": 100},
    {"id": "photo30-2499", "nature": "photo", "credits": 30, "prix_centimes": 2499,
     "libelle": "30 crédits photo", "prix_unitaire_centimes": 83, "avantage": "Économisez 17 %"},
    {"id": "photo50-3499", "nature": "photo", "credits": 50, "prix_centimes": 3499,
     "libelle": "50 crédits photo", "prix_unitaire_centimes": 70, "avantage": "Économisez 30 %"},
    {"id": "photo100-5999", "nature": "photo", "credits": 100, "prix_centimes": 5999,
     "libelle": "100 crédits photo", "prix_unitaire_centimes": 60, "avantage": "Meilleur tarif"},
]

# Un crédit vidéo vaut cinq secondes en 720p. Il reste séparé des crédits photo
# car le coût fournisseur et le risque de nouvelle génération sont très différents.
PACKS_VIDEO = [
    {"id": "video2-1299", "nature": "video", "credits": 2, "secondes": 10,
     "prix_centimes": 1299, "libelle": "10 secondes vidéo", "prix_unitaire_centimes": 650},
    {"id": "video4-2199", "nature": "video", "credits": 4, "secondes": 20,
     "prix_centimes": 2199, "libelle": "20 secondes vidéo", "prix_unitaire_centimes": 550,
     "avantage": "Économisez 15 %"},
    {"id": "video6-2999", "nature": "video", "credits": 6, "secondes": 30,
     "prix_centimes": 2999, "libelle": "30 secondes vidéo", "prix_unitaire_centimes": 500,
     "avantage": "Meilleur tarif"},
]
PACKS = PACKS_PHOTO + PACKS_VIDEO


def paiement_configure() -> bool:
    return bool(reglages.PAIEMENT_ACTIF and reglages.STRIPE_SECRET_KEY and reglages.STRIPE_WEBHOOK_SECRET)


def photo_disponible() -> bool:
    return bool(paiement_configure() and reglages.IA_PUBLIQUE and vision.disponible() and retouche.disponible())


def video_disponible() -> bool:
    return bool(paiement_configure() and reglages.VIDEO_ACTIVE and reglages.HF_KEY)


def disponible(nature: str = "photo") -> bool:
    if nature == "video":
        return video_disponible()
    if nature == "photo":
        return photo_disponible()
    return False

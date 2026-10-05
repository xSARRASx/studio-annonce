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

# Un crédit vidéo finance un essai de cinq secondes en 720p, et non un
# téléchargement. Un nouvel essai consommera à nouveau des crédits.
# La vente reste fermée tant que cette règle n'est pas appliquée au parcours client.
PACKS_VIDEO = [
    {"id": "video1-897", "nature": "video", "credits": 1, "secondes": 5,
     "prix_centimes": 897, "libelle": "5 secondes de crédits vidéo", "prix_unitaire_centimes": 897},
    {"id": "video2-1697", "nature": "video", "credits": 2, "secondes": 10,
     "prix_centimes": 1697, "libelle": "10 secondes de crédits vidéo", "prix_unitaire_centimes": 849,
     "avantage": "Économisez 5 %"},
    {"id": "video3-2497", "nature": "video", "credits": 3, "secondes": 15,
     "prix_centimes": 2497, "libelle": "15 secondes de crédits vidéo", "prix_unitaire_centimes": 832,
     "avantage": "Économisez 7 %"},
    {"id": "video4-3297", "nature": "video", "credits": 4, "secondes": 20,
     "prix_centimes": 3297, "libelle": "20 secondes de crédits vidéo", "prix_unitaire_centimes": 824,
     "avantage": "Économisez 8 %"},
    {"id": "video5-4097", "nature": "video", "credits": 5, "secondes": 25,
     "prix_centimes": 4097, "libelle": "25 secondes de crédits vidéo", "prix_unitaire_centimes": 819,
     "avantage": "Économisez 9 %"},
    {"id": "video6-4797", "nature": "video", "credits": 6, "secondes": 30,
     "prix_centimes": 4797, "libelle": "30 secondes de crédits vidéo", "prix_unitaire_centimes": 800,
     "avantage": "Économisez 11 %"},
    {"id": "video12-9297", "nature": "video", "credits": 12, "secondes": 60,
     "prix_centimes": 9297, "libelle": "60 secondes de crédits vidéo", "prix_unitaire_centimes": 775,
     "avantage": "Économisez 14 %"},
    {"id": "video18-13497", "nature": "video", "credits": 18, "secondes": 90,
     "prix_centimes": 13497, "libelle": "90 secondes de crédits vidéo", "prix_unitaire_centimes": 750,
     "avantage": "Économisez 16 %"},
    {"id": "video24-17497", "nature": "video", "credits": 24, "secondes": 120,
     "prix_centimes": 17497, "libelle": "120 secondes de crédits vidéo", "prix_unitaire_centimes": 729,
     "avantage": "Économisez 19 %"},
]
PACKS = PACKS_PHOTO + PACKS_VIDEO


def paiement_configure() -> bool:
    return bool(reglages.PAIEMENT_ACTIF and reglages.STRIPE_SECRET_KEY and reglages.STRIPE_WEBHOOK_SECRET)


def photo_disponible() -> bool:
    return bool(paiement_configure() and reglages.IA_PUBLIQUE and vision.disponible() and retouche.disponible())


def video_disponible() -> bool:
    return bool(paiement_configure() and reglages.VIDEO_ACTIVE and reglages.VENTE_VIDEO_ACTIVE and reglages.HF_KEY)


def disponible(nature: str = "photo") -> bool:
    if nature == "video":
        return video_disponible()
    if nature == "photo":
        return photo_disponible()
    return False

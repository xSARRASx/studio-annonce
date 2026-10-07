"""Ouverture progressive de la retouche, contrôlée côté serveur."""
from __future__ import annotations

from . import retouche, vision
from .config import reglages
from .models import Compte


def autorise(compte: Compte | None = None) -> bool:
    if not (vision.disponible() and retouche.disponible()):
        return False
    if reglages.IA_PUBLIQUE:
        return True
    return gratuit_proprietaire(compte)


def gratuit_proprietaire(compte: Compte | None) -> bool:
    """Création sans crédit client pour les administrateurs actifs du service."""
    return bool(compte and compte.statut == "actif" and compte.role in ("proprietaire", "admin"))

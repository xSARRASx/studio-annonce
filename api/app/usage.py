"""Mesurer les consommations réelles avant de fixer la marge. Pas de contenu client."""
import logging
from sqlalchemy.exc import IntegrityError
from .db import Session
from .models import UsageIA


def enregistrer(modele: str, operation: str, usage: dict | None, requete_id: str | None = None):
    if not isinstance(usage, dict):
        usage = {}  # appel réussi, mais coût non chiffrable sans les compteurs fournisseur
    try:
        with Session() as s:
            s.add(UsageIA(modele=modele, operation=operation, usage=usage, requete_id=requete_id))
            s.commit()
    except IntegrityError:
        pass  # identifiant fournisseur déjà enregistré
    except Exception:
        # Une indisponibilité du journal ne justifie pas de refaire une génération payante.
        logging.getLogger(__name__).warning("Consommation IA non enregistrée ; vérifier le journal de facturation fournisseur.")

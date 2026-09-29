"""Export privé des profils vérifiés. python -m scripts.export_comptes > fichier_prive.csv"""
import csv
import sys
from sqlalchemy import select
from app.db import Session
from app.models import Compte


def cellule(texte):
    # Neutralise l'interprétation en formule lors de l'ouverture dans un tableur.
    return "'" + texte if texte[:1] in ("=", "+", "-", "@") else texte


if __name__ == "__main__":
    ecrivain=csv.writer(sys.stdout)
    ecrivain.writerow(["prenom","nom","email_verifie","cree_le","profil_complete_le","photo_offerte_attribuee"])
    with Session() as s:
        for c in s.scalars(select(Compte).where(Compte.profil_complete_le.is_not(None)).order_by(Compte.cree_le)):
            ecrivain.writerow([cellule(c.prenom),cellule(c.nom),cellule(c.email),c.cree_le.isoformat(),c.profil_complete_le.isoformat(),c.photos_offertes_utilisees])

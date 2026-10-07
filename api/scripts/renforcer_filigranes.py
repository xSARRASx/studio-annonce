"""Renforce les anciens aperçus non acquis sans toucher aux originaux ni aux HD.

Sans --apply, affiche seulement le nombre d'aperçus concernés. Les anciens
fichiers sont conservés ; une nouvelle clé d'aperçu permet de revenir en arrière.
"""
from __future__ import annotations

import argparse
import hashlib

from sqlalchemy import select

from app import images, stockage
from app.db import Session
from app.models import Compte, Logement, Photo, Version


def versions_a_renforcer(session):
    return session.scalars(
        select(Version).join(Photo, Photo.id == Version.photo_id)
        .join(Logement, Logement.id == Photo.logement_id)
        .join(Compte, Compte.id == Logement.compte_id)
        .where(Photo.offerte.is_(False), Photo.credite_le.is_(None),
               Compte.role != "proprietaire")
    ).all()


def nouvelle_cle(cle: str) -> str:
    if cle.endswith("-apercu-fort.webp"):
        return cle
    suffixe = cle[:-5] if cle.endswith(".webp") else cle
    resultat = f"{suffixe}-fort.webp"
    if len(resultat) > 300:
        raise ValueError("Clé d'aperçu trop longue.")
    return resultat


def main():
    parseur = argparse.ArgumentParser(description=__doc__)
    parseur.add_argument("--apply", action="store_true", help="Écrire les nouveaux aperçus et leurs références")
    args = parseur.parse_args()
    with Session() as session:
        versions = [version for version in versions_a_renforcer(session)
                    if nouvelle_cle(version.cle_apercu) != version.cle_apercu]
        print(f"Aperçus non acquis à renforcer : {len(versions)}")
        if not args.apply:
            return
        for version in versions:
            ancien = version.cle_apercu
            nouveau = nouvelle_cle(ancien)
            donnees = images.apercu_filigrane(stockage.lire(version.cle_pleine))
            stockage.ecrire(nouveau, donnees, "image/webp")
            if hashlib.sha256(stockage.lire(nouveau)).digest() != hashlib.sha256(donnees).digest():
                raise RuntimeError("Le nouvel aperçu ne correspond pas au fichier créé.")
            version.cle_apercu = nouveau
            session.commit()
        print(f"Aperçus renforcés : {len(versions)} ; anciens fichiers conservés.")


if __name__ == "__main__":
    main()

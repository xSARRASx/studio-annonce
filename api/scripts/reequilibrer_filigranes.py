"""Recrée les aperçus payants non acquis avec le filigrane équilibré.

La lecture se fait depuis la version propre conservée dans le stockage privé.
Les anciens aperçus restent disponibles ; seule leur référence change.
"""
from __future__ import annotations

import argparse
import hashlib

from sqlalchemy import select

from app import images, stockage
from app.db import Session
from app.models import Compte, Logement, Photo, Version


def nouvelle_cle(cle: str) -> str:
    if cle.endswith("-apercu-equilibre.webp"):
        return cle
    for suffixe in ("-apercu-fort.webp", "-apercu.webp"):
        if cle.endswith(suffixe):
            resultat = f"{cle[:-len(suffixe)]}-apercu-equilibre.webp"
            break
    else:
        resultat = f"{cle[:-5] if cle.endswith('.webp') else cle}-apercu-equilibre.webp"
    if len(resultat) > 300:
        raise ValueError("Clé d'aperçu trop longue.")
    return resultat


def main() -> None:
    parseur = argparse.ArgumentParser(description=__doc__)
    parseur.add_argument("--apply", action="store_true", help="Créer les aperçus et changer leurs références")
    args = parseur.parse_args()
    with Session() as session:
        versions = session.scalars(
            select(Version).join(Photo, Photo.id == Version.photo_id)
            .join(Logement, Logement.id == Photo.logement_id)
            .join(Compte, Compte.id == Logement.compte_id)
            .where(Photo.offerte.is_(False), Photo.credite_le.is_(None),
                   Compte.role != "proprietaire")
        ).all()
        versions = [v for v in versions if nouvelle_cle(v.cle_apercu) != v.cle_apercu]
        print(f"Aperçus non acquis à équilibrer : {len(versions)}")
        if not args.apply:
            return
        for version in versions:
            nouvelle = nouvelle_cle(version.cle_apercu)
            donnees = images.apercu_filigrane(stockage.lire(version.cle_pleine))
            stockage.ecrire(nouvelle, donnees, "image/webp")
            if hashlib.sha256(stockage.lire(nouvelle)).digest() != hashlib.sha256(donnees).digest():
                raise RuntimeError("Le nouvel aperçu ne correspond pas au fichier créé.")
            version.cle_apercu = nouvelle
            session.commit()
        print(f"Aperçus équilibrés : {len(versions)} ; copies précédentes conservées.")


if __name__ == "__main__":
    main()

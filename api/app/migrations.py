"""Ajouts non destructifs aux bases existantes. Exécuter avant de redémarrer l'API."""
from sqlalchemy import inspect, text

from .db import Base, moteur
from . import models  # noqa: F401 : enregistre les tables


def migrer(engine=moteur):
    Base.metadata.create_all(engine)
    with engine.begin() as connexion:
        colonnes = {c["name"] for c in inspect(connexion).get_columns("comptes")}
        ajouts = {"prenom": "VARCHAR(80) NOT NULL DEFAULT ''",
                  "nom": "VARCHAR(80) NOT NULL DEFAULT ''",
                  "profil_complete_le": "TIMESTAMP NULL"}
        for nom, definition in ajouts.items():
            if nom not in colonnes:
                connexion.execute(text(f"ALTER TABLE comptes ADD COLUMN {nom} {definition}"))


if __name__ == "__main__":
    migrer()
    print("Migration comptes et paiements terminée.")

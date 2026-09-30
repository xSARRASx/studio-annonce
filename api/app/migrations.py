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
                  "profil_complete_le": "TIMESTAMP NULL",
                  "role": "VARCHAR(20) NOT NULL DEFAULT 'client'",
                  "statut": "VARCHAR(20) NOT NULL DEFAULT 'actif'",
                  "revision_admin": "INTEGER NOT NULL DEFAULT 0",
                  "email_verifie_le": "TIMESTAMP NULL",
                  "derniere_connexion_le": "TIMESTAMP NULL"}
        for nom, definition in ajouts.items():
            if nom not in colonnes:
                connexion.execute(text(f"ALTER TABLE comptes ADD COLUMN {nom} {definition}"))
        colonnes_achats = {c["name"] for c in inspect(connexion).get_columns("achats_credits")}
        if "nature" not in colonnes_achats:
            connexion.execute(text("ALTER TABLE achats_credits ADD COLUMN nature VARCHAR(10) NOT NULL DEFAULT 'photo'"))
        # Une session existante atteste d'une validation du code email. Ne pas
        # inventer d'événements de connexion historiques dans le nouveau journal.
        connexion.execute(text("""UPDATE comptes SET email_verifie_le =
            (SELECT MIN(cree_le) FROM jetons WHERE compte_id = comptes.id)
            WHERE email_verifie_le IS NULL AND EXISTS (SELECT 1 FROM jetons WHERE compte_id = comptes.id)"""))
        connexion.execute(text("""UPDATE comptes SET derniere_connexion_le =
            (SELECT MAX(cree_le) FROM jetons WHERE compte_id = comptes.id)
            WHERE derniere_connexion_le IS NULL AND EXISTS (SELECT 1 FROM jetons WHERE compte_id = comptes.id)"""))


if __name__ == "__main__":
    migrer()
    print("Migration comptes, administration et paiements terminée.")

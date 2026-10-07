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
                  "mot_de_passe_hash": "VARCHAR(255) NULL",
                  "derniere_connexion_le": "TIMESTAMP NULL"}
        for nom, definition in ajouts.items():
            if nom not in colonnes:
                connexion.execute(text(f"ALTER TABLE comptes ADD COLUMN {nom} {definition}"))
        colonnes_codes = {c["name"] for c in inspect(connexion).get_columns("codes_connexion")}
        if "usage" not in colonnes_codes:
            connexion.execute(text("ALTER TABLE codes_connexion ADD COLUMN usage VARCHAR(24) NOT NULL DEFAULT 'connexion'"))
        colonnes_achats = {c["name"] for c in inspect(connexion).get_columns("achats_credits")}
        if "nature" not in colonnes_achats:
            connexion.execute(text("ALTER TABLE achats_credits ADD COLUMN nature VARCHAR(10) NOT NULL DEFAULT 'photo'"))
        if "composition" not in colonnes_achats:
            connexion.execute(text("ALTER TABLE achats_credits ADD COLUMN composition JSON NULL"))
        colonnes_photos = {c["name"] for c in inspect(connexion).get_columns("photos")}
        if "demande_brouillon" not in colonnes_photos:
            connexion.execute(text("ALTER TABLE photos ADD COLUMN demande_brouillon TEXT NOT NULL DEFAULT ''"))
        if "usage_initial" not in colonnes_photos:
            connexion.execute(text("ALTER TABLE photos ADD COLUMN usage_initial VARCHAR(10) NOT NULL DEFAULT 'photo'"))
        if "archive_le" not in colonnes_photos:
            connexion.execute(text("ALTER TABLE photos ADD COLUMN archive_le TIMESTAMP NULL"))
        if "supprime_le" not in colonnes_photos:
            connexion.execute(text("ALTER TABLE photos ADD COLUMN supprime_le TIMESTAMP NULL"))
        for nom, definition in {"cle_import": "VARCHAR(36) NULL", "empreinte_import": "VARCHAR(64) NULL"}.items():
            if nom not in colonnes_photos:
                connexion.execute(text(f"ALTER TABLE photos ADD COLUMN {nom} {definition}"))
        connexion.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS photos_cle_import ON photos (cle_import)"))
        colonnes_logements = {c["name"] for c in inspect(connexion).get_columns("logements")}
        if "source_url" not in colonnes_logements:
            connexion.execute(text("ALTER TABLE logements ADD COLUMN source_url VARCHAR(1000) NOT NULL DEFAULT ''"))
        colonnes_videos = {c["name"] for c in inspect(connexion).get_columns("videos")}
        if "supprime_le" not in colonnes_videos:
            connexion.execute(text("ALTER TABLE videos ADD COLUMN supprime_le TIMESTAMP NULL"))
        for nom, definition in {"cle_demande": "VARCHAR(36) NULL", "traitement_jeton": "VARCHAR(24) NOT NULL DEFAULT ''", "traitement_jusqu_au": "TIMESTAMP NULL"}.items():
            if nom not in colonnes_videos:
                connexion.execute(text(f"ALTER TABLE videos ADD COLUMN {nom} {definition}"))
        connexion.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS videos_cle_demande ON videos (cle_demande)"))
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

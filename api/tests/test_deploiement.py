"""Garde-fous du déploiement public, sans appel aux fournisseurs externes."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import stockage
from app.db import Base
from app.routes.auth import DemandeCode, Verification, demander_code, verifier


class DeploiementPublic(unittest.TestCase):
    def test_codes_limites_et_ancien_code_invalide(self):
        with tempfile.TemporaryDirectory() as temporaire:
            moteur = create_engine(f"sqlite:///{Path(temporaire) / 'auth.db'}")
            Base.metadata.create_all(moteur)
            fabrique_session = sessionmaker(bind=moteur)
            with fabrique_session() as s, patch("app.routes.auth.email_disponible", return_value=False), patch(
                "app.routes.auth.reglages.CODE_DANS_LA_REPONSE", True
            ), patch("app.routes.auth.secrets.randbelow", side_effect=[123456, 654321, 222222]):
                email = "client@example.com"
                premier = demander_code(DemandeCode(email=email), s)["code_demo"]
                second = demander_code(DemandeCode(email=email), s)["code_demo"]
                with self.assertRaises(HTTPException) as erreur:
                    verifier(Verification(email=email, code=premier), s)
                self.assertEqual(erreur.exception.status_code, 400)
                self.assertTrue(verifier(Verification(email=email, code=second), s)["jeton"])
                demander_code(DemandeCode(email=email), s)
                with self.assertRaises(HTTPException) as erreur:
                    demander_code(DemandeCode(email=email), s)
                self.assertEqual(erreur.exception.status_code, 429)
            moteur.dispose()

    def test_cinq_codes_errones_bloquent_les_essais_suivants(self):
        with tempfile.TemporaryDirectory() as temporaire:
            moteur = create_engine(f"sqlite:///{Path(temporaire) / 'auth.db'}")
            Base.metadata.create_all(moteur)
            fabrique_session = sessionmaker(bind=moteur)
            with fabrique_session() as s, patch("app.routes.auth.email_disponible", return_value=False), patch(
                "app.routes.auth.reglages.CODE_DANS_LA_REPONSE", True
            ), patch("app.routes.auth.secrets.randbelow", return_value=123456):
                email = "client@example.com"
                demander_code(DemandeCode(email=email), s)
                for _ in range(5):
                    with self.assertRaises(HTTPException) as erreur:
                        verifier(Verification(email=email, code="111111"), s)
                    self.assertEqual(erreur.exception.status_code, 400)
                with self.assertRaises(HTTPException) as erreur:
                    verifier(Verification(email=email, code="123456"), s)
                self.assertEqual(erreur.exception.status_code, 429)
            moteur.dispose()

    def test_connexion_refusee_sans_envoi_email(self):
        with patch("app.routes.auth.reglages.SMTP_HOST", ""), patch(
            "app.routes.auth.reglages.CODE_DANS_LA_REPONSE", False
        ):
            with self.assertRaises(HTTPException) as erreur:
                demander_code(DemandeCode(email="client@example.com"), None)
        self.assertEqual(erreur.exception.status_code, 503)
        with patch("app.routes.auth.reglages.SMTP_HOST", ""), patch(
            "app.routes.auth.reglages.CODE_DANS_LA_REPONSE", False
        ):
            with self.assertRaises(HTTPException) as erreur:
                verifier(Verification(email="client@example.com", code="123456"), None)
        self.assertEqual(erreur.exception.status_code, 503)

    def test_fichier_local_exige_lien_signe_non_expire_et_dans_dossier(self):
        with tempfile.TemporaryDirectory() as temporaire, patch.object(stockage, "DOSSIER_LOCAL", Path(temporaire)), patch.object(
            stockage.reglages, "SECRET_KEY", "secret-de-test"
        ), patch.object(stockage.time, "time", return_value=1000):
            cle = "compte/photo.jpg"
            chemin = Path(temporaire) / cle
            chemin.parent.mkdir()
            chemin.write_bytes(b"photo")
            signature = stockage.signer_lien_local(cle, 1010)
            self.assertEqual(stockage.chemin_local_signe(cle, 1010, signature), chemin)
            self.assertIsNone(stockage.chemin_local_signe(cle, 999, stockage.signer_lien_local(cle, 999)))
            self.assertIsNone(stockage.chemin_local_signe(cle, 1010, "invalide"))
            sortie = "../hors-dossier.jpg"
            self.assertIsNone(stockage.chemin_local_signe(sortie, 1010, stockage.signer_lien_local(sortie, 1010)))


if __name__ == "__main__":
    unittest.main()

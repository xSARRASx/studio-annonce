"""Parcours complet de compte, y compris la reprise des comptes sans mot de passe."""
import tempfile
import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db import Base, session
from app.models import Compte, Jeton, maintenant
from app.routes import auth


class MotDePasseCompte(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/auth.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        app = FastAPI()
        app.include_router(auth.routeur)

        def sessions():
            with self.sessions() as s:
                yield s

        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")
        self.patches = [patch.object(auth, "email_disponible", return_value=False),
                        patch.object(auth.reglages, "CODE_DANS_LA_REPONSE", True)]
        for item in self.patches:
            item.start()

    async def asyncTearDown(self):
        await self.client.aclose()
        for item in self.patches:
            item.stop()
        self.engine.dispose()
        self.temp.cleanup()

    async def test_inscription_connexion_et_reinitialisation(self):
        email = "nouveau@example.com"
        secret = "phrase-secrete-assez-longue"
        payload = {"email": email, "mot_de_passe": secret, "prenom": "Anne", "nom": "Martin"}
        self.assertEqual((await self.client.post("/auth/inscription", json={**payload, "mot_de_passe": "court"})).status_code, 422)
        inscription = await self.client.post("/auth/inscription", json=payload)
        self.assertEqual(inscription.status_code, 200, inscription.text)
        code = inscription.json()["code_demo"]
        self.assertEqual((await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": secret})).status_code, 401)
        self.assertEqual((await self.client.post("/auth/verifier", json={"email": email, "code": code})).status_code, 400)
        confirmation = await self.client.post("/auth/inscription/verifier", json={"email": email, "code": code})
        self.assertEqual(confirmation.status_code, 200, confirmation.text)
        self.assertTrue(confirmation.json()["profil_complet"])
        self.assertEqual((await self.client.post("/auth/inscription/verifier", json={"email": email, "code": code})).status_code, 400)
        self.assertEqual((await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": "erreur"})).status_code, 401)
        connexion = await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": secret})
        self.assertEqual(connexion.status_code, 200)
        self.assertEqual((await self.client.post("/auth/code", json={"email": email})).json(), {"ok": True})
        self.assertEqual((await self.client.post("/auth/inscription", json=payload)).status_code, 409)
        with self.sessions() as s:
            compte = s.scalar(select(Compte).where(Compte.email == email))
            self.assertNotIn(secret, compte.mot_de_passe_hash)
            self.assertNotEqual(compte.mot_de_passe_hash, secret)
        reset = await self.client.post("/auth/mot-de-passe/code", json={"email": email})
        self.assertEqual(reset.status_code, 200)
        code_reset = reset.json()["code_demo"]
        nouveau = "un-nouveau-mot-de-passe"
        self.assertEqual((await self.client.post("/auth/mot-de-passe/reinitialiser", json={"email": email, "code": code_reset, "mot_de_passe": nouveau})).status_code, 200)
        with self.sessions() as s:
            self.assertIsNone(s.get(Jeton, connexion.json()["jeton"]))
        self.assertEqual((await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": secret})).status_code, 401)
        self.assertEqual((await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": nouveau})).status_code, 200)

    async def test_ancien_compte_peut_definir_mot_de_passe_sans_perdre_ses_donnees(self):
        email = "ancien@example.com"
        with self.sessions() as s:
            s.add(Compte(email=email, email_verifie_le=maintenant(), prenom="Ancien", nom="Client"))
            s.commit()
        connexion = await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": "aucun-mot-de-passe"})
        self.assertEqual(connexion.status_code, 409)
        reset = await self.client.post("/auth/mot-de-passe/code", json={"email": email})
        self.assertEqual(reset.status_code, 200)
        self.assertEqual((await self.client.post("/auth/mot-de-passe/reinitialiser", json={"email": email, "code": reset.json()["code_demo"], "mot_de_passe": "ma-phrase-longue-et-privee"})).status_code, 200)
        self.assertEqual((await self.client.post("/auth/connexion", json={"email": email, "mot_de_passe": "ma-phrase-longue-et-privee"})).status_code, 200)
        with self.sessions() as s:
            compte = s.scalar(select(Compte).where(Compte.email == email))
            self.assertEqual((compte.prenom, compte.nom), ("Ancien", "Client"))

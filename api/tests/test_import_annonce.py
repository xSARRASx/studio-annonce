"""Un lien d'annonce est conservé sans aspirer le site tiers ni mélanger les comptes."""
import tempfile
import unittest
from datetime import datetime

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.db import Base, session
from app.migrations import migrer
from app.models import Compte, Jeton, Photo
from app.routes import logements


class ImportAnnonce(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/studio.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            s.add_all([Compte(id="client-a", email="a@example.com"), Compte(id="client-b", email="b@example.com")])
            s.add_all([Jeton(valeur="jeton-a", compte_id="client-a"), Jeton(valeur="jeton-b", compte_id="client-b")])
            s.commit()

        def sessions():
            with self.sessions() as s:
                yield s

        app = FastAPI()
        app.include_router(logements.routeur)
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test",
                                        headers={"Authorization": "Bearer jeton-a"})

    async def asyncTearDown(self):
        await self.client.aclose()
        self.engine.dispose()
        self.temp.cleanup()

    async def test_lien_prive_sans_parametres_et_aucun_achat_a_import(self):
        response = await self.client.post("/logements", json={"nom": "Ma villa", "source_url":
            "https://www.airbnb.fr/rooms/123?check_in=2027-08-09&source_impression_id=abc#photos"})
        self.assertEqual(response.status_code, 200, response.text)
        logement = response.json()
        self.assertEqual(logement["source_url"], "https://www.airbnb.fr/rooms/123")
        self.assertEqual(logement["photos"], [])
        self.assertEqual((await self.client.get("/logements")).json()[0]["source_url"], logement["source_url"])
        modifie = await self.client.patch(f"/logements/{logement['id']}", json={"nom": "Villa du centre"})
        self.assertEqual(modifie.status_code, 200, modifie.text)
        self.assertEqual(modifie.json()["source_url"], logement["source_url"])
        autre = await self.client.get(f"/logements/{logement['id']}", headers={"Authorization": "Bearer jeton-b"})
        self.assertEqual(autre.status_code, 404)
        self.assertEqual((await self.client.get("/logements", headers={"Authorization": "Bearer jeton-b"})).json(), [])

    async def test_lien_non_securise_refuse(self):
        for lien in ("http://www.airbnb.fr/rooms/123", "https://user:secret@www.airbnb.fr/rooms/123"):
            with self.subTest(lien=lien):
                self.assertEqual((await self.client.post("/logements", json={"source_url": lien})).status_code, 422)

    async def test_photos_archivees_cachees_mais_restaurables(self):
        logement = (await self.client.post("/logements", json={"nom": "Maison"})).json()
        with self.sessions() as s:
            s.add(Photo(id="photo-a", logement_id=logement["id"], cle_originale="original.jpg"))
            s.commit()
        with self.sessions() as s:
            s.get(Photo, "photo-a").archive_le = datetime(2026, 10, 4)
            s.commit()
        self.assertEqual((await self.client.get(f"/logements/{logement['id']}")).json()["photos"], [])
        archives = (await self.client.get(f"/logements/{logement['id']}?archives=true")).json()["photos"]
        self.assertEqual(len(archives), 1)
        self.assertTrue(archives[0]["archivee"])
        self.assertEqual((await self.client.get('/logements')).json()[0]['photos'], [])
        self.assertEqual((await self.client.get('/logements?archives=true')).json()[0]['photos'][0]['id'], 'photo-a')
        self.assertEqual((await self.client.get('/logements?archives=true', headers={'Authorization': 'Bearer jeton-b'})).json(), [])


class MigrationAnnonce(unittest.TestCase):
    def test_ajout_colonne_sur_base_existante(self):
        with tempfile.TemporaryDirectory() as dossier:
            engine = create_engine(f"sqlite:///{dossier}/ancien.db")
            with engine.begin() as connexion:
                connexion.execute(text("""CREATE TABLE logements (
                    id VARCHAR(24) PRIMARY KEY, compte_id VARCHAR(24), nom VARCHAR(120),
                    ville VARCHAR(120), type_annonce VARCHAR(40), cree_le TIMESTAMP)"""))
                connexion.execute(text("INSERT INTO logements(id, nom) VALUES ('ancien', 'Maison')"))
            migrer(engine)
            self.assertIn("source_url", {colonne["name"] for colonne in inspect(engine).get_columns("logements")})
            with engine.connect() as connexion:
                self.assertEqual(connexion.execute(text("SELECT source_url FROM logements WHERE id='ancien'")).scalar(), "")
            engine.dispose()

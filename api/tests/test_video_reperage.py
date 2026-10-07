"""Repérage : images temporaires, propriété du logement, aucune création vidéo."""
import base64
import io
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from PIL import Image
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db import Base, session
from app.models import Compte, Jeton, Logement, Photo, Video, maintenant
from app.routes import videos


def jpeg() -> bytes:
    sortie = io.BytesIO()
    Image.new("RGB", (80, 50), "#ddddcc").save(sortie, "JPEG")
    return sortie.getvalue()


class ReperageVideo(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/reperage.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            s.add_all([Compte(id="owner", email="owner@example.test", role="proprietaire", prenom="Owner", nom="Test", profil_complete_le=maintenant(), email_verifie_le=maintenant()),
                       Compte(id="other", email="other@example.test", role="proprietaire", prenom="Other", nom="Test", profil_complete_le=maintenant(), email_verifie_le=maintenant())])
            s.add_all([Jeton(valeur="owner", compte_id="owner"), Jeton(valeur="other", compte_id="other")])
            s.add_all([Logement(id="home", compte_id="owner"), Logement(id="foreign-home", compte_id="other")])
            s.flush()
            s.add_all([Photo(id="salon", logement_id="home", cle_originale="salon.jpg"),
                       Photo(id="cuisine", logement_id="home", cle_originale="cuisine.jpg"),
                       Photo(id="foreign", logement_id="foreign-home", cle_originale="foreign.jpg")])
            s.commit()
        app = FastAPI()
        app.include_router(videos.routeur)
        def sessions():
            with self.sessions() as s:
                yield s
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        self.engine.dispose()
        self.temp.cleanup()

    def data(self, photos=None):
        vue = base64.b64encode(jpeg()).decode()
        return {"photos": photos or ["salon", "cuisine"], "images": [vue, vue, vue]}

    async def test_proposition_sans_video_envoyee_ni_creation_payante(self):
        analyse = {"pieces": ["salon", "cuisine"], "passages": [{"depart": "salon", "arrivee": "cuisine", "porte": "porte de droite", "preuve": "incertain"}], "avertissement": "La destination de cette porte n'est pas visible."}
        with patch.object(videos.reglages, "OPENAI_API_KEY", "test"), patch.object(videos.stockage, "lire", return_value=jpeg()), patch.object(videos.openai_vision, "analyser_reperage", new=AsyncMock(return_value=analyse)) as appel, patch.object(videos.higgsfield_video, "soumettre_references", new=AsyncMock()) as higgs:
            rep = await self.client.post("/videos/reperage", json=self.data(), headers={"Authorization": "Bearer owner"})
            self.assertEqual(rep.status_code, 200, rep.text)
            self.assertIn("coupe", rep.json()["agencement"])
            self.assertIn("porte de droite", rep.json()["passages"][0]["porte"])
            self.assertTrue(all(arg.startswith(b"\xff\xd8") for arg in appel.await_args.args))
            higgs.assert_not_awaited()
        with self.sessions() as s:
            self.assertEqual(s.scalars(select(Video)).all(), [])

    async def test_acces_et_images_invalides(self):
        with patch.object(videos.reglages, "OPENAI_API_KEY", "test"):
            self.assertEqual((await self.client.post("/videos/reperage", json=self.data())).status_code, 401)
            self.assertEqual((await self.client.post("/videos/reperage", json=self.data(["foreign"]), headers={"Authorization": "Bearer owner"})).status_code, 404)
            mauvais = self.data(); mauvais["images"][0] = base64.b64encode(b"not-jpeg").decode()
            self.assertEqual((await self.client.post("/videos/reperage", json=mauvais, headers={"Authorization": "Bearer owner"})).status_code, 400)

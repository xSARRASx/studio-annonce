"""Le compte propriétaire emprunte le parcours vidéo commun sans débit."""
import tempfile
import unittest
from datetime import timedelta
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import higgsfield_video
from app.db import Base, session
from app.models import Compte, Jeton, Logement, Photo, Video, maintenant
from app.routes import videos


class ParcoursVideo(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/video.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            for ident, role in (("owner", "proprietaire"), ("client", "client")):
                s.add(Compte(id=ident, email=f"{ident}@example.test", prenom=ident, nom="Test", role=role,
                             profil_complete_le=maintenant(), email_verifie_le=maintenant()))
            s.flush()
            s.add_all([Jeton(valeur=ident, compte_id=ident) for ident in ("owner", "client")])
            s.add(Logement(id="house", compte_id="owner"))
            s.add(Photo(id="photo", logement_id="house", cle_originale="source"))
            s.commit()
        def sessions():
            with self.sessions() as s:
                yield s
        app = FastAPI()
        app.include_router(videos.routeur)
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test",
                                        headers={"Authorization": "Bearer owner"})

    async def asyncTearDown(self):
        await self.client.aclose()
        self.engine.dispose()
        self.temp.cleanup()

    async def test_owner_creation_gratuite_et_double_clic(self):
        receipt = {"request_id": "provider-1", "status_url": "https://platform.higgsfield.ai/requests/provider-1/status"}
        with patch.object(videos.higgsfield_video, "disponible", return_value=True), \
             patch.object(videos.higgsfield_video, "preparer_image", new=AsyncMock(return_value="https://files.higgsfield.ai/photo.jpg")), \
             patch.object(videos.higgsfield_video, "soumettre", new=AsyncMock(return_value=receipt)) as provider, \
             patch.object(videos.images, "preparer_envoi_ia", return_value=b"jpeg"), \
             patch.object(videos.stockage, "lire", return_value=b"source"):
            first = await self.client.post("/videos/photos/photo", json={"demande": "Caméra douce dans la pièce"})
            self.assertEqual(first.status_code, 200, first.text)
            self.assertEqual(first.json()["statut"], "en_attente")
            second = await self.client.post("/videos/photos/photo", json={"demande": "Caméra douce dans la pièce"})
            self.assertEqual(second.status_code, 409)
            provider.assert_awaited_once()
        with self.sessions() as s:
            item = s.scalar(select(Video))
            self.assertEqual(item.requetes, {"image_url": "https://files.higgsfield.ai/photo.jpg", **receipt})
            self.assertEqual(item.plan["duree"], 5)

    async def test_client_refuse_et_suivi_preserve_sans_nouvel_appel(self):
        forbidden = await self.client.post("/videos/photos/photo", headers={"Authorization": "Bearer client"},
                                           json={"demande": "Caméra douce"})
        self.assertIn(forbidden.status_code, (404, 503))
        with self.sessions() as s:
            s.add(Video(id="clip", logement_id="house", statut="en_attente",
                        plan={"photo_id": "photo", "duree": 5},
                        requetes={"request_id": "p", "status_url": "https://platform.higgsfield.ai/requests/p/status"}))
            s.commit()
        with patch.object(videos.higgsfield_video, "etat", new=AsyncMock(return_value={"status": "completed", "video": {"url": "https://media.higgsfield.ai/clip.mp4"}})), \
             patch.object(videos.higgsfield_video, "fichier_resultat", new=AsyncMock(return_value=b"0000ftypdata")), \
             patch.object(videos.stockage, "ecrire", return_value="prive/videos/clip.mp4"), \
             patch.object(videos.stockage, "url_privee", return_value="https://studioannonce.fr/clip.mp4"):
            result = await self.client.get("/videos/clip")
            self.assertEqual(result.status_code, 200, result.text)
            self.assertEqual(result.json()["statut"], "prete")
            self.assertEqual(result.json()["url"], "https://studioannonce.fr/clip.mp4")

    async def test_timeout_apres_soumission_reprend_meme_intention(self):
        receipt = {"request_id": "provider-2", "status_url": "https://platform.higgsfield.ai/requests/provider-2/status"}
        with patch.object(videos.higgsfield_video, "disponible", return_value=True), \
             patch.object(videos.higgsfield_video, "preparer_image", new=AsyncMock(return_value="https://files.higgsfield.ai/photo.jpg")), \
             patch.object(videos.higgsfield_video, "soumettre", new=AsyncMock(side_effect=[RuntimeError("timeout"), receipt])) as provider, \
             patch.object(videos.higgsfield_video, "etat", new=AsyncMock(return_value={"status": "queued"})), \
             patch.object(videos.images, "preparer_envoi_ia", return_value=b"jpeg"), \
             patch.object(videos.stockage, "lire", return_value=b"source"):
            first = await self.client.post("/videos/photos/photo", json={"demande": "Caméra douce dans la pièce"})
            self.assertEqual(first.status_code, 502)
            latest = (await self.client.get("/videos/photos/photo/derniere")).json()
            resumed = await self.client.get(f"/videos/{latest['id']}")
            self.assertEqual(resumed.status_code, 200, resumed.text)
            self.assertEqual(resumed.json()["statut"], "en_attente")
            self.assertEqual(provider.await_count, 2)
            self.assertEqual(provider.await_args_list[0].args, provider.await_args_list[1].args)
        with self.sessions() as s:
            self.assertEqual(len(s.scalars(select(Video)).all()), 1)

    def test_suivi_higgsfield_accepte_les_deux_domaines_officiels(self):
        for host in ("api.higgsfield.ai", "platform.higgsfield.ai"):
            url = f"https://{host}/requests/123/status"
            self.assertEqual(higgsfield_video._url_statut(url), url)
        for url in ("http://platform.higgsfield.ai/requests/123/status",
                    "https://evil.example/requests/123/status",
                    "https://platform.higgsfield.ai.evil.example/requests/123/status"):
            with self.assertRaises(RuntimeError):
                higgsfield_video._url_statut(url)

    async def test_preparation_interrompue_libere_un_nouvel_essai(self):
        with self.sessions() as s:
            s.add(Video(id="orphelin", logement_id="house", statut="preparation",
                        plan={"photo_id": "photo", "duree": 5}, requetes={},
                        cree_le=maintenant() - timedelta(minutes=6)))
            s.commit()
        suivi = await self.client.get("/videos/orphelin")
        self.assertEqual(suivi.status_code, 200)
        self.assertEqual(suivi.json()["statut"], "echec")
        with patch.object(videos.higgsfield_video, "disponible", return_value=True), \
             patch.object(videos.higgsfield_video, "preparer_image", new=AsyncMock(return_value="https://files.higgsfield.ai/photo.jpg")), \
             patch.object(videos.higgsfield_video, "soumettre", new=AsyncMock(return_value={"request_id": "new", "status_url": "https://platform.higgsfield.ai/requests/new/status"})), \
             patch.object(videos.images, "preparer_envoi_ia", return_value=b"jpeg"), \
             patch.object(videos.stockage, "lire", return_value=b"source"):
            reprise = await self.client.post("/videos/photos/photo", json={"demande": "Caméra douce"})
        self.assertEqual(reprise.status_code, 200, reprise.text)

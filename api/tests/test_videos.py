"""Le suivi vidéo est rapide et les appels facturés gardent la même intention."""
import asyncio
from contextlib import ExitStack
import tempfile
import unittest
import uuid
from datetime import timedelta
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import credits_video, higgsfield_video
from app.db import Base, session
from app.models import Compte, Jeton, Logement, MouvementCreditVideo, Photo, Version, Video, maintenant
from app.routes import videos


class ParcoursVideo(unittest.IsolatedAsyncioTestCase):
    async def test_administrateur_lance_sans_credit_ni_plafond_de_cinq_projets(self):
        with self.sessions() as s:
            s.get(Compte, "owner").role = "admin"
            s.add_all([Video(id=f"ancienne-{i}", logement_id="house", statut="prete", plan={"duree": 5}, cree_le=maintenant()) for i in range(5)])
            s.commit()
        with patch.object(videos, "vente_video_disponible", return_value=False):
            resultat = await self.client.post("/videos/visites", json=self.request())
        self.assertEqual(resultat.status_code, 200, resultat.text)
        with self.sessions() as s:
            self.assertEqual(s.get(Video, resultat.json()["id"]).plan["credits_reserves"], 0)
            self.assertEqual(s.scalars(select(MouvementCreditVideo)).all(), [])

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
            s.add_all([Logement(id="house", compte_id="owner"), Logement(id="house2", compte_id="owner"), Logement(id="other", compte_id="client")])
            s.flush()
            s.add_all([Photo(id="photo", logement_id="house", cle_originale="source", version_gardee_id="v"),
                       Photo(id="photo2", logement_id="house", cle_originale="source2"),
                       Photo(id="photo3", logement_id="house2", cle_originale="source3"),
                       Photo(id="foreign", logement_id="other", cle_originale="foreign")])
            s.flush()
            s.add(Version(id="v", photo_id="photo", numero=1, consigne="Lumière", cle_apercu="preview", cle_pleine="retouched"))
            s.commit()
        def sessions():
            with self.sessions() as s:
                yield s
        app = FastAPI()
        app.include_router(videos.routeur)
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test", headers={"Authorization": "Bearer owner"})
        self.stack = ExitStack()
        # These regression cases cover visits confirmed with the original
        # per-photo model; a separate case exercises the new reference model.
        self.stack.enter_context(patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE))
        self.schedule = self.stack.enter_context(patch.object(videos, "_planifier"))
        self.stack.enter_context(patch.object(videos.higgsfield_video, "disponible", return_value=True))
        self.prepare = self.stack.enter_context(patch.object(videos.higgsfield_video, "preparer_image", new=AsyncMock(return_value="https://files.higgsfield.ai/photo.jpg")))
        self.submit = self.stack.enter_context(patch.object(videos.higgsfield_video, "soumettre", new=AsyncMock(return_value={"request_id": "p", "status_url": "https://api.higgsfield.ai/requests/p/status"})))
        self.submit_references = self.stack.enter_context(patch.object(videos.higgsfield_video, "soumettre_references", new=AsyncMock(return_value={"request_id": "reference", "status_url": "https://api.higgsfield.ai/requests/reference/status"})))
        self.poll = self.stack.enter_context(patch.object(videos.higgsfield_video, "etat", new=AsyncMock(return_value={"status": "queued"})))
        self.stack.enter_context(patch.object(videos.higgsfield_video, "fichier_resultat", new=AsyncMock(return_value=b"0000ftypdata")))
        self.stack.enter_context(patch.object(videos.images, "preparer_envoi_ia", return_value=b"jpeg"))
        self.stack.enter_context(patch.object(videos.stockage, "lire", side_effect=lambda cle: cle.encode()))
        self.stack.enter_context(patch.object(videos.stockage, "ecrire", side_effect=lambda cle, contenu, mime: cle))
        self.stack.enter_context(patch.object(videos.stockage, "url_privee", side_effect=lambda cle: f"https://studio.test/{cle}"))

    async def asyncTearDown(self):
        await self.client.aclose()
        self.stack.close()
        self.engine.dispose()
        self.temp.cleanup()

    def request(self, photos=None, key=None, demande="Caméra douce dans la pièce"):
        return {"photos": photos or [{"photo_id": "photo"}], "cle_demande": key or str(uuid.uuid4()), "demande": demande}

    async def create(self, **options):
        response = await self.client.post("/videos/visites", json=self.request(**options))
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    async def test_duree_confirmee_et_worker_sans_lecture_navigateur(self):
        from app.models import Brouillon
        draft=str(uuid.uuid4())
        with self.sessions() as s:
            s.add(Brouillon(id=draft,compte_id="owner",nature="video",donnees={"duration":20}));s.commit()
        data={**self.request(photos=[{"photo_id":"photo"},{"photo_id":"photo2"}]),"duree":20,"brouillon_id":draft}
        result=await self.client.post("/videos/visites",json=data)
        self.assertEqual(result.status_code,200,result.text)
        self.assertEqual(result.json()["duree"],20)
        id=result.json()["id"]
        self.assertEqual((await self.client.post("/videos/visites",json=data)).json()["id"],id)
        self.assertEqual((await self.client.post("/videos/visites",json={**data,"duree":30})).status_code,409)
        self.poll.return_value={"status":"completed","video":{"url":"https://example.test/clip.mp4"}}
        with patch.object(videos.video_montage,"assembler",return_value=b"0000ftypmontage"):
            await videos._poursuivre(self.sessions,id,pause=0,tours=12)
        with self.sessions() as s:
            self.assertEqual(s.get(Video,id).statut,"prete")
            self.assertEqual(s.get(Brouillon,draft).video_id,id)
        self.assertEqual(self.submit.await_count,2)
        self.assertEqual((await self.client.post("/videos/visites",json={**self.request(),"duree":21})).status_code,422)

    async def test_owner_confirmation_rapide_double_clic_et_zero_debit(self):
        data = self.request()
        first = await self.client.post("/videos/visites", json=data)
        second = await self.client.post("/videos/visites", json=data)
        self.assertEqual(first.json()["id"], second.json()["id"])
        self.assertEqual(first.json()["statut"], "preparation")
        self.submit.assert_not_awaited()
        await videos._avancer(self.sessions, first.json()["id"])
        third = await self.client.post("/videos/visites", json=self.request())
        self.assertEqual(third.status_code, 409)
        self.submit.assert_awaited_once()
        with self.sessions() as s:
            self.assertEqual(len(s.scalars(select(Video)).all()), 1)
            self.assertEqual(s.scalars(select(MouvementCreditVideo)).all(), [])
            self.assertEqual(s.scalar(select(Video)).requetes["clips"][0]["request_id"], "p")

    async def test_ordre_versions_et_original_explicite(self):
        data = self.request(photos=[{"photo_id": "photo2", "version_id": ""}, {"photo_id": "photo", "version_id": "v"}])
        result = (await self.client.post("/videos/visites", json=data)).json()
        self.assertEqual(result["duree"], 10)
        with self.sessions() as s:
            self.assertEqual(s.get(Video, result["id"]).plan["sources"], [
                {"photo_id": "photo2", "version_id": None, "cle_source": "source2"},
                {"photo_id": "photo", "version_id": "v", "cle_source": "retouched"}])
        self.assertEqual((await self.client.post("/videos/visites", json={**data, "photos": list(reversed(data["photos"]))})).status_code, 409)
        with self.sessions() as s:
            s.get(Video, result["id"]).statut = "prete"
            s.commit()
        original = await self.create(photos=[{"photo_id": "photo", "version_id": ""}])
        with self.sessions() as s:
            self.assertEqual(s.get(Video, original["id"]).plan["sources"][0]["cle_source"], "source")

    async def test_modele_multi_reference_soumet_une_seule_visite(self):
        with self.sessions() as s:
            s.get(Photo, "photo2").analyse = {"piece": "Cuisine"}
            s.get(Photo, "photo").analyse = {"piece": "Salon"}
            s.commit()
        demande = {**self.request(photos=[{"photo_id": "photo2", "mouvement": "traversee"},
                                         {"photo_id": "photo", "mouvement": "orbite"}]),
                   "agencement": "La cuisine communique avec le salon par la porte à gauche."}
        with patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE_REFERENCE):
            response = await self.client.post("/videos/visites", json=demande)
            self.assertEqual(response.status_code, 200, response.text)
            result = response.json()
            self.assertEqual(result["duree"], 10)
            self.assertEqual(result["plans_total"], 1)
            await videos._avancer(self.sessions, result["id"])
            self.assertEqual(self.prepare.await_count, 2)
            self.submit.assert_not_awaited()
            self.submit_references.assert_awaited_once()
            self.assertEqual(self.submit_references.await_args.args[0],
                             ["https://files.higgsfield.ai/photo.jpg"] * 2)
            self.assertEqual(self.submit_references.await_args.args[2], 10)
            with self.sessions() as s:
                plan = s.get(Video, result["id"]).plan
                self.assertEqual(plan["modele"], higgsfield_video.MODELE_REFERENCE)
                self.assertIn("REFERENCE ORDER", plan["prompt_continu"])
                self.assertIn("Reference image 1 — kitchen", plan["prompt_continu"])
                self.assertIn("Reference image 2 — living room", plan["prompt_continu"])
                self.assertIn(demande["agencement"], plan["prompt_continu"])
            self.assertEqual((await self.client.post("/videos/visites", json={**demande,
                "agencement": "La chambre est ici."})).status_code, 409)
            self.assertEqual((await self.client.get(f"/videos/{result['id']}")).json()["plans_total"], 1)

    async def test_visite_fluide_demande_des_passages_confirmes(self):
        photos = [{"photo_id": "photo"}, {"photo_id": "photo2"}]
        demande = {**self.request(photos=photos), "montage": "continue", "duree": 10}
        with patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE_REFERENCE):
            sans_trajet = await self.client.post("/videos/visites", json=demande)
            self.assertEqual(sans_trajet.status_code, 422, sans_trajet.text)
            passage_inconnu = await self.client.post("/videos/visites", json={**demande, "liaisons": ["coupe"]})
            self.assertEqual(passage_inconnu.status_code, 422, passage_inconnu.text)
            confirme = await self.client.post("/videos/visites", json={**demande, "liaisons": ["gauche"]})
        self.assertEqual(confirme.status_code, 200, confirme.text)
        with self.sessions() as s:
            plan = s.get(Video, confirme.json()["id"]).plan
            self.assertEqual(plan["montage"], "continue")
            self.assertEqual(plan["liaisons"], ["gauche"])
            self.assertIn("confirmed left doorway", plan["prompt_continu"])
            self.assertIn("one flowing drone-style tour", plan["prompt_continu"])
        self.assertEqual((await self.client.post("/videos/visites", json={**demande, "liaisons": ["droite"]})).status_code, 409)

    async def test_full_hd_debite_deux_credits_par_cinq_secondes_et_arrive_au_fournisseur(self):
        with self.sessions() as s:
            credits_video.mouvement(s, s.get(Compte, "client"), 3, "Pack", "achat:hd")
            s.commit()
        demande = {**self.request(photos=[{"photo_id": "foreign"}]), "duree": 10, "qualite": "1080p"}
        with patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE_REFERENCE), patch.object(videos, "vente_video_disponible", return_value=True):
            insuffisant = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json=demande)
            self.assertEqual(insuffisant.status_code, 402, insuffisant.text)
            with self.sessions() as s:
                credits_video.mouvement(s, s.get(Compte, "client"), 1, "Complément", "achat:hd-complement")
                s.commit()
            confirme = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json=demande)
            self.assertEqual(confirme.status_code, 200, confirme.text)
            await videos._avancer(self.sessions, confirme.json()["id"])
        with self.sessions() as s:
            self.assertEqual(credits_video.solde(s, "client"), 0)
            plan = s.get(Video, confirme.json()["id"]).plan
            self.assertEqual(plan["credits_reserves"], 4)
            self.assertEqual(plan["qualite"], "1080p")
        self.assertEqual(self.submit_references.await_args.args[4], "1080p")
        self.assertEqual(higgsfield_video.parametres_references(["https://files.higgsfield.ai/photo.jpg"], "Visite", 5, "1080p")["resolution"], "1080p")

    async def test_modele_multi_reference_plafonne_deux_photos_par_cinq_secondes(self):
        with patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE_REFERENCE):
            response = await self.client.post("/videos/visites", json={
                **self.request(photos=[{"photo_id": "photo"}, {"photo_id": "photo2"}, {"photo_id": "photo3"}]),
                "duree": 5,
            })
        self.assertEqual(response.status_code, 422)
        self.submit_references.assert_not_awaited()

    async def test_sources_invalides_refusees_avant_fournisseur(self):
        for sources, status in [([{"photo_id": "foreign"}], 404), ([{"photo_id": "photo"}, {"photo_id": "photo"}], 400),
                                ([{"photo_id": "photo"}, {"photo_id": "photo3"}], 400), ([{"photo_id": "photo", "version_id": "absent"}], 400),
                                ([{"photo_id": "photo"}] * 7, 422)]:
            with self.subTest(sources=sources):
                r = await self.client.post("/videos/visites", json=self.request(photos=sources))
                self.assertEqual(r.status_code, status, r.text)
        with self.sessions() as s:
            s.get(Photo, "photo").archive_le = maintenant()
            s.commit()
        self.assertEqual((await self.client.post("/videos/visites", json=self.request())).status_code, 400)
        self.assertEqual((await self.client.post("/videos/visites", json=self.request(demande="   "))).status_code, 422)
        self.submit.assert_not_awaited()

    async def test_client_et_autre_compte_refuses(self):
        refused = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json=self.request(photos=[{"photo_id": "foreign"}]))
        self.assertEqual(refused.status_code, 503)
        video = await self.create()
        self.assertEqual((await self.client.get(f"/videos/{video['id']}", headers={"Authorization": "Bearer client"})).status_code, 404)
        self.submit.assert_not_awaited()

    async def test_solde_video_utilisable_en_plusieurs_fois_et_rembourse_en_cas_echec(self):
        with self.sessions() as s:
            credits_video.mouvement(s, s.get(Compte, "client"), 6, "Pack 30 secondes", "achat:test")
            s.commit()
        first_request = {**self.request(photos=[{"photo_id": "foreign"}]), "duree": 5}
        with patch.object(videos, "vente_video_disponible", return_value=True):
            first = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json=first_request)
            self.assertEqual(first.status_code, 200, first.text)
            same = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json=first_request)
            self.assertEqual(same.json()["id"], first.json()["id"])
            with self.sessions() as s:
                self.assertEqual(credits_video.solde(s, "client"), 5)
                s.get(Video, first.json()["id"]).statut = "prete"
                s.commit()
            second = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json={**self.request(photos=[{"photo_id": "foreign"}]), "duree": 10})
            self.assertEqual(second.status_code, 200, second.text)
            with self.sessions() as s:
                self.assertEqual(credits_video.solde(s, "client"), 3)
                s.get(Video, second.json()["id"]).statut = "prete"
                s.commit()
            too_long = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json={**self.request(photos=[{"photo_id": "foreign"}]), "duree": 20})
            self.assertEqual(too_long.status_code, 402, too_long.text)
            third = await self.client.post("/videos/visites", headers={"Authorization": "Bearer client"}, json={**self.request(photos=[{"photo_id": "foreign"}]), "duree": 15})
            self.assertEqual(third.status_code, 200, third.text)
            self.poll.return_value = {"status": "failed"}
            await videos._avancer(self.sessions, third.json()["id"])
            await videos._avancer(self.sessions, third.json()["id"])
            with self.sessions() as s:
                self.assertEqual(s.get(Video, third.json()["id"]).statut, "echec")
                self.assertEqual(credits_video.solde(s, "client"), 3)
                self.assertEqual(len(s.scalars(select(MouvementCreditVideo).where(MouvementCreditVideo.compte_id == "client")).all()), 5)

    async def test_reponse_perdue_reprend_meme_intention_fournisseur(self):
        self.submit.side_effect = [RuntimeError("timeout"), {"request_id": "p", "status_url": "https://api.higgsfield.ai/requests/p/status"}]
        result = await self.create()
        await videos._avancer(self.sessions, result["id"])
        await videos._avancer(self.sessions, result["id"])
        self.assertEqual(self.submit.await_count, 2)
        self.assertEqual(self.submit.await_args_list[0].args, self.submit.await_args_list[1].args)
        self.prepare.assert_awaited_once()
        followed = (await self.client.get(f"/videos/{result['id']}")).json()
        self.assertEqual(followed["statut"], "en_attente")
        with self.sessions() as s:
            self.assertEqual(len(s.scalars(select(Video)).all()), 1)

    async def test_direction_et_modele_figes_meme_apres_mise_a_jour(self):
        data = self.request(photos=[{"photo_id": "photo2", "mouvement": "orbite"}, {"photo_id": "photo", "mouvement": "traversee"}], demande="Une visite vivante")
        with patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE_KLING):
            result = (await self.client.post("/videos/visites", json=data)).json()
        with self.sessions() as s:
            plan = s.get(Video, result["id"]).plan
            self.assertEqual([d["mouvement"] for d in plan["directions"]], ["orbite", "traversee"])
        self.submit.side_effect = [RuntimeError("timeout"), {"request_id": "p", "status_url": "https://api.higgsfield.ai/requests/p/status"}]
        with patch.object(videos, "preparer_consigne", return_value="Un autre prompt"), patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE):
            await videos._avancer(self.sessions, result["id"])
            await videos._avancer(self.sessions, result["id"])
        self.assertEqual(self.submit.await_args_list[0], self.submit.await_args_list[1])
        self.assertEqual(self.submit.await_args.args[4], higgsfield_video.MODELE_KLING)
        self.assertEqual(self.submit.await_args.args[1], plan["directions"][0]["prompt"])
        changed = {**data, "photos": [{"photo_id": "photo2", "mouvement": "calme"}, {"photo_id": "photo", "mouvement": "traversee"}]}
        self.assertEqual((await self.client.post("/videos/visites", json=changed)).status_code, 409)

    async def test_solde_epuise_ne_relance_pas_apres_recharge(self):
        self.submit.side_effect = httpx.HTTPStatusError("Payment required", request=httpx.Request("POST", "https://api.higgsfield.ai/test"), response=httpx.Response(402))
        result = await self.create()
        await videos._avancer(self.sessions, result["id"])
        self.submit.side_effect = None
        await videos._avancer(self.sessions, result["id"])
        self.submit.assert_awaited_once()
        response = (await self.client.get(f"/videos/{result['id']}")).json()
        self.assertEqual(response["statut"], "echec")
        self.assertIn("solde", response["erreur"])

    async def test_ancien_prompt_et_modele_conserves_lors_d_une_reprise(self):
        result = await self.create(demande="Ancienne demande")
        with self.sessions() as s:
            v = s.get(Video, result["id"])
            v.plan = {key: value for key, value in v.plan.items() if key not in {"directions", "modele", "direction_version"}}
            s.commit()
        with patch.object(videos.reglages, "VIDEO_MODELE", higgsfield_video.MODELE_KLING):
            await videos._avancer(self.sessions, result["id"])
        self.assertEqual(self.submit.await_args.args[1], videos.CONSIGNE_FIDELITE + "Ancienne demande")
        self.assertEqual(self.submit.await_args.args[4], higgsfield_video.MODELE)

    async def test_bail_et_suivi_ne_bloquent_pas_navigation_ou_ecriture(self):
        entered, release = asyncio.Event(), asyncio.Event()
        async def slow(*args):
            entered.set()
            await release.wait()
            return {"request_id": "p", "status_url": "https://api.higgsfield.ai/requests/p/status"}
        self.submit.side_effect = slow
        result = await self.create()
        worker = asyncio.create_task(videos._avancer(self.sessions, result["id"]))
        await asyncio.wait_for(entered.wait(), 1)
        try:
            suivi = await asyncio.wait_for(self.client.get(f"/videos/{result['id']}"), 1)
            self.assertEqual(suivi.status_code, 200)
            await asyncio.wait_for(videos._avancer(self.sessions, result["id"]), 1)
            with self.sessions() as s:
                s.get(Compte, "client").prenom = "Disponible"
                s.commit()
            self.submit.assert_awaited_once()
        finally:
            release.set()
            await worker

    async def test_suspension_pendant_envoi_bloque_la_soumission(self):
        async def suspend(*args):
            with self.sessions() as s:
                s.get(Compte, "owner").statut = "suspendu"
                s.commit()
            return "https://files.higgsfield.ai/photo.jpg"
        self.prepare.side_effect = suspend
        result = await self.create()
        await videos._avancer(self.sessions, result["id"])
        await videos._avancer(self.sessions, result["id"])
        self.submit.assert_not_awaited()
        with self.sessions() as s:
            self.assertEqual(s.get(Video, result["id"]).statut, "echec")

    async def test_montage_ordonne_et_reprise_ne_regenere_pas(self):
        result = await self.create(photos=[{"photo_id": "photo2"}, {"photo_id": "photo"}])
        await videos._avancer(self.sessions, result["id"])
        await videos._avancer(self.sessions, result["id"])
        self.poll.return_value = {"status": "completed", "video": {"url": "https://media.test/clip.mp4"}}
        with patch.object(videos.video_montage, "assembler", side_effect=[RuntimeError("montage"), b"assembled"]) as montage:
            await videos._avancer(self.sessions, result["id"])
            first = (await self.client.get(f"/videos/{result['id']}")).json()
            self.assertEqual(first["plans_prets"], 2)
            self.assertEqual(first["statut"], "montage")
            await videos._avancer(self.sessions, result["id"])
            self.assertEqual(montage.call_args_list[0], montage.call_args_list[1])
            self.assertEqual(montage.call_args.args[0], [f"prive/videos/{result['id']}/plan-0.mp4".encode(), f"prive/videos/{result['id']}/plan-1.mp4".encode()])
        self.assertEqual(self.submit.await_count, 2)
        self.assertEqual((await self.client.get(f"/videos/{result['id']}" )).json()["statut"], "prete")
        self.assertEqual((await self.client.get("/videos/photos/photo2/derniere")).json()["id"], result["id"])

    async def test_plafond_cinq_projets_sur_24h(self):
        with self.sessions() as s:
            s.add_all([Video(logement_id="other", statut="prete", plan={}, requetes={}) for _ in range(5)])
            s.add(MouvementCreditVideo(compte_id="client", delta=1, motif="Fixture"))
            s.commit()
        with patch.object(videos, "vente_video_disponible", return_value=True):
            resultat = await self.client.post("/videos/visites", json=self.request(photos=[{"photo_id": "foreign"}]), headers={"Authorization": "Bearer client"})
        self.assertEqual(resultat.status_code, 429, resultat.text)
        self.submit.assert_not_awaited()

    async def test_ancien_clip_repris_sans_nouvelle_soumission(self):
        with self.sessions() as s:
            s.add(Video(id="clip", logement_id="house", statut="en_attente", plan={"photo_id": "photo", "duree": 5},
                        requetes={"request_id": "p", "status_url": "https://api.higgsfield.ai/requests/p/status"}))
            s.commit()
        self.poll.return_value = {"status": "completed", "video": {"url": "https://media.test/clip.mp4"}}
        await videos._avancer(self.sessions, "clip")
        result = (await self.client.get("/videos/clip")).json()
        self.assertEqual(result["statut"], "prete")
        self.assertTrue(result["url"])
        self.submit.assert_not_awaited()

    async def test_ancienne_preparation_interrompue_libere_essai(self):
        with self.sessions() as s:
            s.add(Video(id="orphelin", logement_id="house", statut="preparation", plan={"photo_id": "photo", "duree": 5}, requetes={}, cree_le=maintenant() - timedelta(minutes=6)))
            s.commit()
        await videos._avancer(self.sessions, "orphelin")
        self.assertEqual((await self.client.get("/videos/orphelin")).json()["statut"], "echec")
        await self.create()
        self.submit.assert_not_awaited()

    def test_suivi_higgsfield_accepte_seulement_domaines_officiels(self):
        for host in ("api.higgsfield.ai", "platform.higgsfield.ai"):
            url = f"https://{host}/requests/123/status"
            self.assertEqual(higgsfield_video._url_statut(url), url)
        for url in ("http://platform.higgsfield.ai/requests/123/status", "https://evil.example/requests/123/status", "https://platform.higgsfield.ai.evil.example/requests/123/status"):
            with self.assertRaises(RuntimeError): higgsfield_video._url_statut(url)

"""Contrats photo/credits hors ligne. Exécuter depuis un dossier sans .env (voir rapport)."""
import asyncio
import base64
import io
import tempfile
import unittest
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from PIL import Image
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app import credits, limites
from app.db import Base, session
from app.models import Compte, Jeton, Logement, MouvementCredit, OperationPhoto, Photo, QuotaCreation, ReprisePhoto, Version
from app.routes import photos


class ContratPhoto(unittest.IsolatedAsyncioTestCase):
    async def test_import_json_repris_sans_doublon_ni_debit(self):
        donnees = {"image": base64.b64encode(self.hd).decode(), "cle_import": str(uuid.uuid4()), "demande": "Plus de lumière"}
        premier = await self.client.post("/photos/la/import", json=donnees)
        self.assertEqual(premier.status_code, 200, premier.text)
        ident = premier.json()["id"]
        await self.client.patch(f"/photos/{ident}/demande", json={"demande": "Une demande affinée"})
        second = await self.client.post("/photos/la/import", json=donnees)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(second.json()["id"], ident)
        self.assertEqual(second.json()["demande_brouillon"], "Une demande affinée")
        autre = await self.client.post("/photos/lb/import", headers={"Authorization": "Bearer token-b"}, json=donnees)
        self.assertEqual(autre.status_code, 404)
        incoherent = await self.client.post("/photos/la/import", json={**donnees, "demande": "Autre demande"})
        self.assertEqual(incoherent.status_code, 409)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count(Photo.id))), 4)
            self.assertEqual(s.get(Compte, "a").photos_offertes_utilisees, 1)
            self.assertEqual(credits.solde(s, "a"), 5)

    async def test_import_stockage_indisponible_preserve_offre_et_lot(self):
        donnees = {"image": base64.b64encode(self.hd).decode(), "cle_import": str(uuid.uuid4())}
        with patch.object(photos.stockage, "ecrire", side_effect=OSError("quota")):
            rate = await self.client.post("/photos/la/import", json=donnees)
        self.assertEqual(rate.status_code, 503)
        self.assertIn("déjà ajoutées", rate.json()["detail"])
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count(Photo.id))), 3)
            self.assertEqual(s.get(Compte, "a").photos_offertes_utilisees, 0)
        reprise = await self.client.post("/photos/la/import", json=donnees)
        self.assertEqual(reprise.status_code, 200, reprise.text)

    async def test_import_incomplet_ou_non_image_refuse_sans_nouvelle_photo(self):
        for contenu in ("$$$$", base64.b64encode(b"pas une image").decode()):
            response = await self.client.post("/photos/la/import", json={"image": contenu, "cle_import": str(uuid.uuid4())})
            self.assertEqual(response.status_code, 400, response.text)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count(Photo.id))), 3)

    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/test.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, autoflush=False, expire_on_commit=False)
        self.instant = datetime(2026, 9, 23, 12, 0, 0)
        hd = io.BytesIO()
        Image.new("RGB", (16, 16), "white").save(hd, format="JPEG")
        self.hd = hd.getvalue()
        self.files = {"source": b"source", "v1": b"v1"}
        self.patches = [
            patch.object(photos, "maintenant", side_effect=lambda: self.instant),
            patch.object(limites, "maintenant", side_effect=lambda: self.instant),
            patch.object(photos.stockage, "lire", side_effect=lambda k: self.files[k]),
            patch.object(photos.stockage, "ecrire", side_effect=self.write),
            patch.object(photos.stockage, "url_publique", side_effect=lambda k: f"/test/{k}"),
            patch.object(photos.images, "apercu_filigrane", return_value=b"apercu"),
            patch.object(photos.retouche, "retoucher", new=AsyncMock(return_value=self.hd)),
            patch.object(photos.retouche, "disponible", return_value=True),
            patch.object(photos.vision, "disponible", return_value=True),
            patch.object(photos.reglages, "IA_PUBLIQUE", True),
            patch.object(photos.vision, "reformuler_demande", new=AsyncMock(return_value="Une vraie consigne")),
        ]
        for p in self.patches:
            p.start()
        with self.sessions() as s:
            s.add_all([Compte(id="a", email="a@example.test", prenom="Alice", nom="Test", profil_complete_le=self.instant), Compte(id="b", email="b@example.test", prenom="Bob", nom="Test", profil_complete_le=self.instant)])
            s.flush()
            s.add_all([Logement(id="la", compte_id="a"), Logement(id="lb", compte_id="b"),
                       Jeton(valeur="token-a", compte_id="a"), Jeton(valeur="token-b", compte_id="b"),
                       MouvementCredit(compte_id="a", delta=5, motif="Fixture"),
                       MouvementCredit(compte_id="b", delta=5, motif="Fixture")])
            s.flush()
            s.add_all([Photo(id="p", logement_id="la", cle_originale="source", essais=1, analyse={"consigne":"pro", "piece":"Salon", "defauts": []}),
                       Photo(id="q", logement_id="la", cle_originale="source", essais=1, analyse={"consigne":"pro"}),
                       Photo(id="autre", logement_id="lb", cle_originale="source", essais=1)])
            s.flush()
            s.add_all([Version(id="v", photo_id="p", numero=1, consigne="Test", cle_apercu="a", cle_pleine="v1", cree_le=self.instant),
                       Version(id="vq", photo_id="q", numero=1, consigne="Test", cle_apercu="a", cle_pleine="v1", cree_le=self.instant),
                       Version(id="va", photo_id="autre", numero=1, consigne="Test", cle_apercu="a", cle_pleine="v1", cree_le=self.instant)])
            s.commit()
        def session_test():
            with self.sessions() as s:
                yield s
        application = FastAPI()
        application.include_router(photos.routeur)
        application.dependency_overrides[session] = session_test
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=application, raise_app_exceptions=False), base_url="http://test", headers={"Authorization": "Bearer token-a"})

    async def asyncTearDown(self):
        await self.client.aclose()
        for p in reversed(self.patches):
            p.stop()
        self.engine.dispose()
        self.temp.cleanup()

    def write(self, key, content, mime):
        self.files[key] = content
        return key

    def balance(self):
        with self.sessions() as s:
            return credits.solde(s, "a")

    def update_photo(self, **attrs):
        with self.sessions() as s:
            p = s.get(Photo, "p")
            for key, value in attrs.items():
                setattr(p, key, value)
            s.commit()

    async def download(self, p="p", v="v"):
        return await self.client.post(f"/photos/{p}/versions/{v}/telecharger")

    async def test_archiver_restaure_sans_perdre_les_versions_ni_ouvrir_autrui(self):
        avant = self.balance()
        self.assertEqual((await self.client.post("/photos/autre/archiver")).status_code, 404)
        archive = await self.client.post("/photos/p/archiver")
        self.assertEqual(archive.status_code, 200, archive.text)
        with self.sessions() as s:
            self.assertIsNotNone(s.get(Photo, "p").archive_le)
            self.assertEqual(len(s.get(Photo, "p").versions), 1)
        self.assertEqual((await self.client.post("/photos/p/restaurer")).status_code, 200)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo, "p").archive_le)
        self.assertEqual(self.balance(), avant)

    async def test_proprietaire_utilise_le_meme_parcours_sans_debit(self):
        with self.sessions() as s:
            compte = s.get(Compte, "a")
            compte.role = "proprietaire"
            s.query(MouvementCredit).filter(MouvementCredit.compte_id == "a").delete()
            s.add(QuotaCreation(compte_id="a", nature="photo", utilisees=29))
            s.commit()
        with patch.object(photos.reglages, "IA_PUBLIQUE", False):
            vue = (await self.client.get("/photos/p")).json()
            self.assertFalse(vue["filigrane"])
            self.assertEqual(self.balance(), 0)
            resultat = await self.download()
            self.assertEqual(resultat.status_code, 200)
            self.assertEqual(resultat.headers["X-Photo-Credit-Consomme"], "0")
            self.assertEqual(self.balance(), 0)
            with self.sessions() as s:
                self.assertEqual(s.get(QuotaCreation, ("a", "photo")).utilisees, 0)
            with self.sessions() as s:
                p = s.get(Photo, "p")
                p.essais = 2
                s.commit()
            vue = (await self.client.get("/photos/p")).json()
            reprise = await self.client.post("/photos/p/reprendre", json={"cycle_id": vue["cycle_id"]})
            self.assertEqual(reprise.status_code, 200)
            self.assertEqual(reprise.json()["essais_restants"], 1)
            self.assertEqual(self.balance(), 0)

    async def test_jpeg_2k_achete_reste_identique_sans_seconde_generation(self):
        haute_definition = io.BytesIO()
        Image.new("RGB", (2048, 1365), (120, 101, 87)).save(haute_definition, "JPEG")
        self.files["v1"] = haute_definition.getvalue()
        avant = self.balance()
        resultat = await self.download()
        self.assertEqual(resultat.status_code, 200, resultat.text)
        self.assertEqual(resultat.content, self.files["v1"])
        self.assertEqual(self.balance(), avant - 1)
        photos.retouche.retoucher.assert_not_awaited()
        with self.sessions() as s:
            version = s.get(Version, "v")
            self.assertEqual(version.cle_hd, version.cle_pleine)

    async def test_retouche_pilote_reservee_au_proprietaire(self):
        self.update_photo(analyse=None)
        with patch.object(photos.reglages, "IA_PUBLIQUE", False):
            self.assertEqual((await self.client.post("/photos/p/analyser")).status_code, 503)
            self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 503)
            self.assertEqual((await self.download()).status_code, 503)
            photos.retouche.retoucher.assert_not_awaited()
            with self.sessions() as s:
                s.get(Compte, "a").role = "proprietaire"
                s.commit()
            with patch.object(photos.vision, "analyser", new=AsyncMock(return_value={
                "piece": "Salon", "defauts": [], "consigne": "Éclaircir", "question": ""
            })):
                self.assertEqual((await self.client.post("/photos/p/analyser")).status_code, 200)
            self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 200)

    async def test_solde_zero_bloque_nouvelle_retouche_sauf_photo_deja_acquise_ou_offerte(self):
        with self.sessions() as s:
            s.query(MouvementCredit).filter(MouvementCredit.compte_id == "a").delete()
            s.commit()
        refus = await self.client.post("/photos/p/essai", json={"demande": "Éclaircir"})
        self.assertEqual(refus.status_code, 402)
        self.assertIn("solde photo", refus.json()["detail"])
        photos.retouche.retoucher.assert_not_awaited()
        self.assertEqual((await self.client.get("/photos/p")).json()["essais"], 1)
        self.update_photo(offerte=1)
        self.assertEqual((await self.client.post("/photos/p/essai", json={"demande": "Éclaircir"})).status_code, 200)
        self.update_photo(offerte=0, credite_le=self.instant)
        with self.sessions() as s:
            s.get(Photo, "p").essais = 1
            s.commit()
        self.assertEqual((await self.client.post("/photos/p/essai", json={"demande": "Éclaircir"})).status_code, 200)
        self.assertEqual(self.balance(), 0)

    async def test_vue_original_independant_de_la_vignette_sans_debit(self):
        before = self.balance()
        response = await self.client.get("/photos/p")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["original"], "/test/source")
        self.assertTrue(response.json()["cree_le"].endswith("Z"))
        self.assertEqual(self.balance(), before)
        photos.retouche.retoucher.assert_not_awaited()

    async def test_brouillon_retrouvable_sans_debit_et_prive(self):
        before = self.balance()
        texte = "Faire le lit, garder la fenêtre et la porte à leur place."
        saved = await self.client.patch("/photos/p/demande", json={"demande": texte})
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(saved.json()["demande_brouillon"], texte)
        reopened = await self.client.get("/photos/p")
        self.assertEqual(reopened.json()["demande_brouillon"], texte)
        forbidden = await self.client.patch("/photos/autre/demande", json={"demande": "Autre compte"})
        self.assertEqual(forbidden.status_code, 404)
        too_long = await self.client.patch("/photos/p/demande", json={"demande": "a" * 4001})
        self.assertEqual(too_long.status_code, 422)
        self.assertEqual((await self.client.get("/photos/p")).json()["demande_brouillon"], texte)
        self.assertEqual(self.balance(), before)
        photos.retouche.retoucher.assert_not_awaited()

    async def test_premiere_hd_debit_unique_date_utc_et_pas_de_report(self):
        first = await self.download()
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(first.content, self.hd)
        self.assertEqual(first.headers["x-photo-credit-consomme"], "1")
        self.assertEqual(first.headers["x-photo-reprise-jusqu-au"], "2026-09-30T12:00:00Z")
        self.assertEqual(self.balance(), 4)
        self.instant += timedelta(days=2)
        again = await self.download()
        self.assertEqual(again.status_code, 200)
        self.assertEqual(again.headers["x-photo-credit-consomme"], "0")
        self.assertEqual(again.headers["x-photo-reprise-jusqu-au"], first.headers["x-photo-reprise-jusqu-au"])
        self.assertEqual(self.balance(), 4)
        self.assertEqual(photos.retouche.retoucher.await_count, 1)

    async def test_photo_offerte_ne_debite_pas_et_a_sa_propre_limite(self):
        self.update_photo(offerte=1)
        r = await self.download()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers["x-photo-offerte"], "1")
        self.assertEqual(r.headers["x-photo-credit-consomme"], "0")
        self.assertEqual(self.balance(), 5)
        vue = (await self.client.get("/photos/p")).json()
        self.assertEqual(vue["essais_restants"], 1)
        self.assertFalse(vue["reprise_expiree"])

    async def test_echec_ia_et_stockage_ne_consomme_ni_credit_ni_delai(self):
        photos.retouche.retoucher.side_effect = RuntimeError("indisponible")
        self.assertEqual((await self.download()).status_code, 500)
        self.assertEqual(self.balance(), 5)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo, "p").credite_le)
        photos.retouche.retoucher.side_effect = None
        with patch.object(photos.stockage, "ecrire", side_effect=OSError("stockage")):
            self.assertEqual((await self.download()).status_code, 500)
        self.assertEqual(self.balance(), 5)
        self.assertEqual((await self.download()).status_code, 200)
        self.assertEqual(self.balance(), 4)

    async def test_ownership_sur_photo_version_depart_download_et_reprise(self):
        for path, data in [("/photos/autre/essai", {}), ("/photos/p/essai", {"depuis_version_id": "va"}),
                           ("/photos/autre/reprendre", {"cycle_id":"initial"})]:
            self.assertEqual((await self.client.post(path, json=data)).status_code, 404)
        self.assertEqual((await self.download("p", "va")).status_code, 404)
        self.assertEqual((await self.download("autre", "va")).status_code, 404)
        self.assertEqual((await self.client.get("/photos/autre")).status_code, 404)
        self.assertEqual(self.balance(), 5)
        self.assertEqual(photos.retouche.retoucher.await_count, 0)

    async def test_echeance_exacte_et_reprise_conserve_historique(self):
        self.assertEqual((await self.download()).status_code, 200)
        self.instant += timedelta(days=7)
        vue = (await self.client.get("/photos/p")).json()
        self.assertTrue(vue["reprise_expiree"])
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        self.assertEqual((await self.download()).status_code, 200)
        self.assertEqual(self.balance(), 4)
        reprise = await self.client.post("/photos/p/reprendre", json={"cycle_id": "initial"})
        self.assertEqual(reprise.status_code, 200, reprise.text)
        r = reprise.json()
        self.assertFalse(r["reprise_expiree"])
        self.assertEqual(r["essais"], 1)
        self.assertEqual(r["essais_cycle"], 0)
        self.assertEqual(len(r["versions"]), 1)
        self.assertEqual(r["reprise_jusqu_au"], "2026-10-07T12:00:00Z")
        self.assertEqual(self.balance(), 3)
        self.assertEqual((await self.client.post("/photos/p/reprendre", json={"cycle_id":"initial"})).status_code, 409)
        active = await self.client.post("/photos/p/reprendre", json={"cycle_id":r["cycle_id"]})
        self.assertEqual(active.status_code, 200)
        self.assertEqual(self.balance(), 3)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 200)
        self.assertEqual((await self.download()).status_code, 200)
        self.assertEqual(self.balance(), 3)

    async def test_reprises_concurrentes_une_seule_ligne_credit(self):
        self.update_photo(credite_le=self.instant-timedelta(days=8))
        reponses = await asyncio.gather(*[
            self.client.post("/photos/p/reprendre", json={"cycle_id":"initial"}) for _ in range(3)
        ])
        self.assertEqual(sorted(r.status_code for r in reponses), [200,409,409])
        self.assertEqual(self.balance(), 4)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count(ReprisePhoto.id))), 1)
            self.assertEqual(s.scalar(select(func.count(MouvementCredit.id)).where(MouvementCredit.delta == -1)), 1)

    async def test_retouche_possible_juste_avant_echeance_utc(self):
        self.update_photo(credite_le=self.instant-timedelta(days=7)+timedelta(microseconds=1))
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 200)
        vue = (await self.client.get("/photos/p")).json()
        self.assertFalse(vue["reprise_expiree"])
        self.instant += timedelta(microseconds=1)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)

    async def test_fichier_hd_ecrit_mais_non_relisible_aucun_debit(self):
        def inaccessible(key):
            if key.endswith("-hd.jpg"):
                raise OSError("lecture impossible")
            return self.files[key]
        with patch.object(photos.stockage, "lire", side_effect=inaccessible):
            self.assertEqual((await self.download()).status_code, 500)
        self.assertEqual(self.balance(), 5)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo, "p").credite_le)
            self.assertEqual(s.get(Version, "v").cle_hd, "")

    async def test_fausse_image_fournisseur_ne_consomme_pas_de_credit(self):
        photos.retouche.retoucher.return_value = b"ce fichier n'est pas une image"
        refus = await self.download()
        self.assertEqual(refus.status_code, 502, refus.text)
        self.assertEqual(self.balance(), 5)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo, "p").credite_le)
            self.assertEqual(s.get(Version, "v").cle_hd, "")

    async def test_autre_hd_apres_echeance_ne_renouvelle_jamais_seule(self):
        await self.download()
        with self.sessions() as s:
            s.add(Version(id="v2", photo_id="p", numero=2, consigne="Test", cle_apercu="a", cle_pleine="v1"))
            s.commit()
        self.instant += timedelta(days=7)
        self.assertEqual((await self.download("p", "v2")).status_code, 402)
        self.assertEqual(self.balance(), 4)

    async def test_limite_essais_reprise_payee_photo_offerte_avant_hd(self):
        self.update_photo(offerte=1, essais=photos.reglages.ESSAIS_MAX_PHOTO_OFFERTE)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        r = await self.client.post("/photos/p/reprendre", json={"cycle_id":"initial"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["essais_restants"], 1)
        self.assertEqual(self.balance(), 4)
        hd = await self.download()
        self.assertEqual(hd.status_code, 200)
        self.assertEqual(hd.headers["x-photo-credit-consomme"], "0")
        self.assertEqual(self.balance(), 4)

    async def test_solde_insuffisant_ne_cree_pas_de_reprise(self):
        self.update_photo(credite_le=self.instant-timedelta(days=8))
        with self.sessions() as s:
            s.add(MouvementCredit(compte_id="a", delta=-5, motif="Fixture")); s.commit()
        self.assertEqual((await self.client.post("/photos/p/reprendre", json={"cycle_id":"initial"})).status_code, 402)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count(ReprisePhoto.id))), 0)
        self.assertEqual(self.balance(), 0)

    async def test_double_telechargement_pendant_generation_ne_debite_qu_une_fois(self):
        entre, terminer = asyncio.Event(), asyncio.Event()
        async def lent(*args, **kwargs):
            entre.set(); await terminer.wait(); return self.hd
        photos.retouche.retoucher.side_effect = lent
        premier = asyncio.create_task(self.download())
        await asyncio.wait_for(entre.wait(), 5)
        double = await self.download()
        self.assertEqual(double.status_code, 409, double.text)
        self.assertEqual(self.balance(), 5)
        terminer.set()
        self.assertEqual((await premier).status_code, 200)
        self.assertEqual(self.balance(), 4)

    async def test_deux_photos_concurrentes_un_seul_credit_pas_de_decouvert(self):
        with self.sessions() as s:
            s.add(MouvementCredit(compte_id="a", delta=-4, motif="Fixture")); s.commit()
        entrees, terminer = 0, asyncio.Event()
        async def lent(*args, **kwargs):
            nonlocal entrees
            entrees += 1
            if entrees == 2: terminer.set()
            await terminer.wait()
            return self.hd
        photos.retouche.retoucher.side_effect = lent
        reponses = await asyncio.wait_for(asyncio.gather(self.download(), self.download("q", "vq")), 10)
        self.assertEqual(sorted(r.status_code for r in reponses), [200, 402])
        self.assertEqual(self.balance(), 0)

    async def test_limite_journaliere_compte_les_reservations_concurrentes(self):
        entre, terminer = asyncio.Event(), asyncio.Event()
        async def lent(*args, **kwargs):
            entre.set(); await terminer.wait(); return b"retouche"
        photos.retouche.retoucher.side_effect = lent
        with patch.object(photos.reglages, "ESSAIS_MAX_PAR_JOUR", 3):
            premier = asyncio.create_task(self.client.post("/photos/p/essai", json={}))
            await asyncio.wait_for(entre.wait(), 5)
            refus = await self.client.post("/photos/q/essai", json={})
            self.assertEqual(refus.status_code, 429, refus.text)
            terminer.set()
            self.assertEqual((await premier).status_code, 200)

    async def test_limite_photo_double_essai_ne_cree_pas_de_version_en_trop(self):
        self.update_photo(essais=photos.reglages.ESSAIS_MAX_PAR_PHOTO-1)
        entre, terminer = asyncio.Event(), asyncio.Event()
        async def lent(*args, **kwargs):
            entre.set(); await terminer.wait(); return b"retouche"
        photos.retouche.retoucher.side_effect = lent
        premier = asyncio.create_task(self.client.post("/photos/p/essai", json={}))
        await asyncio.wait_for(entre.wait(), 5)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 409)
        terminer.set()
        self.assertEqual((await premier).status_code, 200)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        vue = (await self.client.get("/photos/p")).json()
        self.assertEqual(vue["essais"], photos.reglages.ESSAIS_MAX_PAR_PHOTO)
        self.assertEqual(len(vue["versions"]), 2)

    async def test_expiration_pendant_generation_ne_debite_pas_et_pas_de_version(self):
        self.update_photo(credite_le=self.instant-timedelta(days=7)+timedelta(seconds=1))
        async def lent(*args, **kwargs):
            self.instant += timedelta(seconds=2)
            return b"retouche"
        photos.retouche.retoucher.side_effect = lent
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        vue = (await self.client.get("/photos/p")).json()
        self.assertEqual(len(vue["versions"]), 1)
        self.assertEqual(self.balance(), 5)

    async def test_reservation_expiree_ne_valide_pas_reponse_tardive(self):
        async def lent(*args, **kwargs):
            self.instant += timedelta(minutes=11)
            return self.hd
        photos.retouche.retoucher.side_effect = lent
        self.assertEqual((await self.download()).status_code, 409)
        self.assertEqual(self.balance(), 5)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo, "p").credite_le)

    async def test_offre_gratuite_une_seule_photo_sur_depots_concurrents(self):
        donnees = io.BytesIO()
        Image.new("RGB", (10,10)).save(donnees, format="JPEG")
        async def envoi():
            return await self.client.post("/photos/la", files={"fichier":("photo.jpg", donnees.getvalue(), "image/jpeg")})
        responses = await asyncio.gather(envoi(), envoi())
        self.assertEqual([r.status_code for r in responses], [200,200])
        self.assertEqual(sum(r.json()["offerte"] for r in responses), 1)
        self.assertNotEqual(responses[0].json()["ordre"], responses[1].json()["ordre"])

    async def test_deux_creations_incluses_puis_une_par_credit(self):
        self.update_photo(essais=0)
        for _ in range(2):
            r = await self.client.post("/photos/p/essai", json={})
            self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(self.balance(), 5)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        reprise = await self.client.post("/photos/p/reprendre", json={"cycle_id": "initial"})
        self.assertEqual(reprise.status_code, 200, reprise.text)
        self.assertEqual(reprise.json()["essais_restants"], 1)
        self.assertEqual(self.balance(), 4)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 200)
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        self.assertEqual((await self.download()).status_code, 200)
        self.assertEqual(self.balance(), 4)

    async def test_solde_zero_refuse_nouvel_apercu_et_hd_payante(self):
        with self.sessions() as s:
            s.add(MouvementCredit(compte_id="a", delta=-5, motif="Fixture")); s.commit()
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 402)
        self.assertEqual((await self.download()).status_code, 402)
        self.assertEqual(self.balance(), 0)

    async def test_trentieme_place_reservee_bloque_autre_appareil(self):
        with self.sessions() as s:
            s.add(QuotaCreation(compte_id="a", nature="photo", utilisees=29)); s.commit()
        entre, terminer = asyncio.Event(), asyncio.Event()
        async def lent(*args, **kwargs):
            entre.set(); await terminer.wait(); return self.hd
        photos.retouche.retoucher.side_effect = lent
        premier = asyncio.create_task(self.client.post("/photos/p/essai", json={}))
        await asyncio.wait_for(entre.wait(), 5)
        refus = await self.client.post("/photos/q/essai", json={})
        self.assertEqual(refus.status_code, 429, refus.text)
        terminer.set()
        self.assertEqual((await premier).status_code, 200)
        vue = (await self.client.get("/photos/p")).json()
        self.assertEqual(vue["limites"]["photo"]["utilisees"], 30)
        self.assertTrue(vue["limites"]["photo"]["bloque"])
        self.assertEqual((await self.client.post("/photos/q/essai", json={})).status_code, 429)
        # Acheter une HD reste autorisé à la limite ; cet achat remet les photos à zéro.
        self.assertEqual((await self.download()).status_code, 200)
        self.assertEqual((await self.client.get("/photos/p")).json()["limites"]["photo"]["utilisees"], 0)

    async def test_echec_ne_compte_pas_et_correction_payee_reste_disponible(self):
        self.update_photo(essais=2)
        reprise = await self.client.post("/photos/p/reprendre", json={"cycle_id": "initial"})
        self.assertEqual(reprise.status_code, 200)
        photos.retouche.retoucher.side_effect = RuntimeError("échec simulé")
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 500)
        vue = (await self.client.get("/photos/p")).json()
        self.assertEqual(vue["essais_restants"], 1)
        self.assertEqual(vue["limites"]["photo"]["utilisees"], 0)
        self.assertEqual(vue["limites"]["photo"]["en_cours"], 0)
        self.assertEqual(self.balance(), 4)
        photos.retouche.retoucher.side_effect = None
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 200)
        self.assertEqual(self.balance(), 4)

    async def test_hd_offerte_et_telechargement_repete_ne_remettent_pas_a_zero(self):
        self.update_photo(offerte=1)
        with self.sessions() as s:
            s.add(QuotaCreation(compte_id="a", nature="photo", utilisees=30)); s.commit()
        for _ in range(2):
            self.assertEqual((await self.download()).status_code, 200)
            vue = (await self.client.get("/photos/p")).json()
            self.assertEqual(vue["limites"]["photo"]["utilisees"], 30)
            self.assertTrue(vue["limites"]["photo"]["bloque"])
        self.assertEqual(self.balance(), 5)

    async def test_payant_debloque_apercu_propre_et_ancien_telechargement_ne_reset_pas(self):
        avant = (await self.client.get("/photos/p")).json()
        self.assertTrue(avant["filigrane"])
        self.assertEqual(avant["versions"][0]["apercu"], "/test/a")
        self.assertNotIn("cle_pleine", avant["versions"][0])
        await self.download()
        apres = (await self.client.get("/photos/p")).json()
        self.assertFalse(apres["filigrane"])
        self.assertIn("signature=", apres["versions"][0]["apercu"])
        with self.sessions() as s:
            q = s.get(QuotaCreation, ("a", "photo")); q.utilisees = 30; s.commit()
        await self.download()
        self.assertEqual((await self.client.get("/photos/p")).json()["limites"]["photo"]["utilisees"], 30)

    async def test_suspension_pendant_hd_ne_debite_pas(self):
        async def suspension(*args, **kwargs):
            with self.sessions() as s:
                s.get(Compte, "a").statut = "suspendu"; s.commit()
            return self.hd
        photos.retouche.retoucher.side_effect = suspension
        self.assertEqual((await self.download()).status_code, 403)
        self.assertEqual(self.balance(), 5)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo, "p").credite_le)
            self.assertEqual(s.get(OperationPhoto, "p").statut, "echec")

    async def test_suppression_pendant_essai_ne_consomme_pas_quota(self):
        async def suppression(*args, **kwargs):
            with self.sessions() as s:
                s.get(Compte, "a").statut = "supprime"; s.commit()
            return self.hd
        photos.retouche.retoucher.side_effect = suppression
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code, 403)
        with self.sessions() as s:
            self.assertEqual(s.get(Photo, "p").essais, 1)
            self.assertEqual(limites.vue(s, "a")["photo"]["utilisees"], 0)
            self.assertEqual(limites.vue(s, "a")["photo"]["en_cours"], 0)


if __name__ == "__main__":
    unittest.main()

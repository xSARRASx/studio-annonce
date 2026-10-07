"""Consentement, attribution figée, anti-doublons et aucune mutation des paiements."""
import csv
import asyncio
import io
import tempfile
import unittest
from datetime import timedelta, timezone
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import justificatifs, publicite
from app.db import Base, session
from app.models import AchatCredits, AttributionPublicitaire, Compte, ConversionPublicitaire, Jeton, MouvementCredit, maintenant
from app.routes import admin, compte


class Publicite(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/tracking.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        self.now = maintenant()
        self.month = self.now.strftime("%Y-%m")
        with self.sessions() as s:
            for ident, role in (("a", "client"), ("b", "client"), ("admin", "admin")):
                s.add(Compte(id=ident, email=f"{ident}@example.com", role=role, prenom="Test", nom="Compte", profil_complete_le=self.now, email_verifie_le=self.now))
            s.flush()
            s.add_all([Jeton(valeur=v, compte_id=v) for v in ("a", "b", "admin")])
            s.add(AchatCredits(id="achat", compte_id="a", cle_demande="checkout-key", pack_id="photo10", credits=10, montant_centimes=999,
                reel=1, stripe_session_id="cs_live_test", statut="paye", credite_le=self.now, cree_le=self.now - timedelta(hours=1)))
            s.add(MouvementCredit(compte_id="a", delta=10, motif="Achat", reference="stripe:cs_live_test")); s.commit()
        def sessions():
            with self.sessions() as s: yield s
        app = FastAPI(); app.include_router(compte.routeur); app.include_router(admin.routeur)
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test", headers={"Authorization": "Bearer a"})
        self.consent = {"consentement": True, "date_consentement": self.now.isoformat() + "Z"}
        self.click = {**self.consent, "identifiant": "gclid_first", "type": "gclid", "date_clic": (self.now - timedelta(days=1)).isoformat() + "Z"}

    async def asyncTearDown(self):
        await self.client.aclose(); self.engine.dispose(); self.temp.cleanup()

    async def claim(self, payload=None, headers=None):
        return await self.client.post("/compte/achats/achat/conversion", json=payload or self.consent, headers=headers)

    def untouched(self):
        with self.sessions() as s:
            a = s.get(AchatCredits, "achat")
            self.assertEqual((a.credits, a.montant_centimes, a.cle_demande, a.stripe_session_id), (10, 999, "checkout-key", "cs_live_test"))
            self.assertEqual([m.delta for m in s.scalars(select(MouvementCredit))], [10])

    async def test_consentement_et_propriete_obligatoires(self):
        for body in ({}, {**self.consent, "consentement": False}, {**self.consent, "date_consentement": (self.now - timedelta(days=181)).isoformat()}, {**self.consent, "email": "other@example.com"}):
            r = await self.client.post("/compte/achats/achat/conversion", json=body); self.assertEqual(r.status_code, 422, r.text)
        self.assertEqual((await self.claim(headers={"Authorization": "Bearer b"})).status_code, 404)
        self.assertEqual((await self.claim(headers={"Authorization": ""})).status_code, 401)
        self.untouched()

    async def test_achat_en_attente_test_rembourse_ou_admin_ne_compte_pas(self):
        for values in ({"statut": "en_attente", "credite_le": None}, {"reel": 0}, {"statut": "rembourse"}, {"devise": "usd"}):
            with self.sessions() as s:
                a = s.get(AchatCredits, "achat"); a.statut = "paye"; a.credite_le = self.now; a.reel = 1; a.devise = "eur"
                for k, v in values.items(): setattr(a, k, v)
                s.commit()
            r = await self.claim(); self.assertEqual(r.json(), {"ticket": None})
        with self.sessions() as s:
            a = s.get(AchatCredits, "achat"); a.statut = "paye"; a.devise = "eur"; s.get(Compte, "a").role = "admin"; s.commit()
        self.assertEqual((await self.claim()).json(), {"ticket": None}); self.untouched()

    async def test_reservation_accuse_et_reprise_anti_doublon(self):
        first = (await self.claim()).json(); self.assertEqual(first["value"], 9.99); self.assertEqual(first["valeur_base"], "ca_ttc")
        self.assertEqual(first["user_data"], {"email_address": "a@example.com"})
        self.assertEqual((await self.claim()).json(), {"ticket": None})
        path = "/compte/achats/achat/conversion/confirmer"
        self.assertEqual((await self.client.post(path, json={**self.consent, "ticket": "incorrect"})).status_code, 409)
        with self.sessions() as s:
            s.get(ConversionPublicitaire, "achat").reserve_le = self.now - timedelta(minutes=6); s.commit()
        second = (await self.claim()).json(); self.assertNotEqual(second["ticket"], first["ticket"])
        for _ in range(2): self.assertTrue((await self.client.post(path, json={**self.consent, "ticket": second["ticket"]})).json()["confirme"])
        self.assertEqual((await self.claim()).json(), {"ticket": None}); self.untouched()

    async def test_deux_onglets_ne_reservent_pas_deux_conversions(self):
        results = await asyncio.gather(self.claim(), self.claim())
        self.assertTrue(all(r.status_code == 200 for r in results))
        self.assertEqual(sum(bool(r.json()["ticket"]) for r in results), 1)
        self.untouched()

    async def test_attribution_figee_par_commande_et_retrait_sans_toucher_credits(self):
        self.assertEqual((await self.client.post("/compte/publicite", json={**self.click, "achat_id": "achat"})).status_code, 200)
        await self.client.post("/compte/publicite", json={**self.click, "identifiant": "gclid_second", "achat_id": "achat"})
        with self.sessions() as s:
            self.assertEqual(s.get(AttributionPublicitaire, "a").identifiant, "gclid_second")
            self.assertEqual(s.get(ConversionPublicitaire, "achat").identifiant, "gclid_first")
        self.assertEqual((await self.client.post("/compte/publicite/revoquer")).status_code, 200)
        with self.sessions() as s:
            self.assertIsNone(s.get(AttributionPublicitaire, "a")); self.assertEqual(s.get(ConversionPublicitaire, "achat").identifiant, "")
        self.untouched()

    async def test_csv_admin_uniquement_et_pas_de_donnees_personnelles(self):
        await self.client.post("/compte/publicite", json={**self.click, "achat_id": "achat"})
        path = f"/admin/publicite/ventes_avec_gclid.csv?mois={self.month}"
        self.assertEqual((await self.client.get(path)).status_code, 403)
        r = await self.client.get(path, headers={"Authorization": "Bearer admin"})
        self.assertEqual(r.status_code, 200, r.text); self.assertEqual(r.headers["cache-control"], "no-store")
        rows = list(csv.DictReader(io.StringIO(r.text))); self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]["commande_id"], rows[0]["valeur_eur"], rows[0]["gclid"]), ("achat", "9.99", "gclid_first"))
        self.assertNotIn("@", r.text); self.assertNotIn("cs_live_test", r.text)
        json_path = f"/admin/publicite/ventes_avec_gclid?mois={self.month}"
        self.assertEqual((await self.client.get(json_path)).status_code, 403)
        browser_export = await self.client.get(json_path, headers={"Authorization": "Bearer admin"})
        self.assertEqual(browser_export.status_code, 200)
        self.assertEqual(browser_export.headers["cache-control"], "no-store")
        self.assertEqual(browser_export.json(), {"nom": f"ventes_avec_gclid-{self.month}.csv", "contenu": r.text})
        studio_path = f"/admin/exports/ventes?mois={self.month}"
        self.assertEqual((await self.client.get(studio_path)).status_code, 403)
        studio_export = await self.client.get(studio_path, headers={"Authorization": "Bearer admin"})
        self.assertEqual(studio_export.json(), browser_export.json())
        self.assertEqual(studio_export.headers["cache-control"], "no-store")
        await self.client.post("/compte/publicite/revoquer")
        r = await self.client.get(path, headers={"Authorization": "Bearer admin"}); self.assertEqual(len(list(csv.DictReader(io.StringIO(r.text)))), 0)
        self.untouched()

    async def test_remboursements_stripe_totaux_et_partiels_lecture_seule(self):
        await self.client.post("/compte/publicite", json={**self.click, "achat_id": "achat"})
        for amount, expected, motif in ((200, "7.99", "valeur_apres_remboursement_partiel"), (999, "9.99", "remboursement_total")):
            def read(resource, params):
                if resource == "checkout/sessions":
                    return {"data": [{"id": "cs_live_test", "mode": "payment", "livemode": True, "currency": "eur", "payment_status": "paid", "payment_intent": "pi_real", "amount_total": 999, "client_reference_id": "a", "metadata": {"achat_id": "achat", "compte_id": "a"}}]}
                return {"data": [{"status": "succeeded", "livemode": True, "currency": "eur", "payment_intent": "pi_real", "created": int(self.now.replace(tzinfo=timezone.utc).timestamp()), "amount": amount}]}
            with patch.object(justificatifs, "lire_objet", side_effect=read):
                r = await self.client.get(f"/admin/publicite/remboursements.csv?mois={self.month}", headers={"Authorization": "Bearer admin"})
            self.assertEqual(r.status_code, 200, r.text)
            rows = list(csv.DictReader(io.StringIO(r.text))); self.assertEqual((rows[0]["montant_eur"], rows[0]["motif"]), (expected, motif))
        self.untouched()

    async def test_remboursement_autre_commande_et_pagination_refuses(self):
        await self.client.post("/compte/publicite", json={**self.click, "achat_id": "achat"})
        with patch.object(justificatifs, "lire_objet", return_value={"data": [], "has_more": True}):
            r = await self.client.get(f"/admin/publicite/remboursements.csv?mois={self.month}", headers={"Authorization": "Bearer admin"})
        self.assertEqual(r.status_code, 413); self.untouched()

    async def test_clic_expire_et_commande_d_un_autre_compte_refuses(self):
        for body in ({**self.click, "date_clic": (self.now - timedelta(days=91)).isoformat()}, {**self.click, "identifiant": "id;bad"}):
            self.assertEqual((await self.client.post("/compte/publicite", json=body)).status_code, 422)
        self.assertEqual((await self.client.post("/compte/publicite", json={**self.click, "achat_id": "achat"}, headers={"Authorization": "Bearer b"})).status_code, 404)
        with self.sessions() as s:
            self.assertIsNone(s.get(AttributionPublicitaire, "b"))
        self.untouched()

    async def test_export_de_remboursement_rejette_une_session_d_autrui(self):
        await self.client.post("/compte/publicite", json={**self.click, "achat_id": "achat"})
        def read(resource, params):
            if resource == "checkout/sessions":
                return {"data": [{"id": "cs_live_test", "mode": "payment", "livemode": True, "currency": "eur", "payment_status": "paid", "payment_intent": "pi_real", "amount_total": 999, "client_reference_id": "b", "metadata": {"achat_id": "achat", "compte_id": "a"}}]}
            return {"data": [{"status": "succeeded", "livemode": True, "currency": "eur", "payment_intent": "pi_real", "created": int(self.now.replace(tzinfo=timezone.utc).timestamp()), "amount": 999}]}
        with patch.object(justificatifs, "lire_objet", side_effect=read) as reader:
            r = await self.client.get(f"/admin/publicite/remboursements.csv?mois={self.month}", headers={"Authorization": "Bearer admin"})
        self.assertEqual(r.status_code, 200, r.text); self.assertEqual(len(list(csv.DictReader(io.StringIO(r.text)))), 0)
        self.assertEqual(reader.call_count, 2); self.untouched()

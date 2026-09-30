"""Permissions et cycle de vie des comptes, sans emails ni services externes."""
import asyncio
import tempfile
import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app import limites
from app.db import Base, session
from app.models import (CodeConnexion, Compte, ConnexionCompte, Jeton, JournalAdmin, QuotaCreation,
                        Logement, MouvementCredit, Photo, maintenant)
from app.routes import admin, auth, compte
from scripts.initialiser_admin import initialiser


class AdminTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/admin.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            for ident, role in [("owner", "proprietaire"), ("admin", "admin"), ("client", "client"), ("second", "client")]:
                s.add(Compte(id=ident, email=f"{ident}@example.com", prenom=ident, nom="Test", role=role,
                             profil_complete_le=maintenant(), email_verifie_le=maintenant()))
            s.flush()
            s.add_all([Jeton(valeur=ident, compte_id=ident) for ident in ("owner", "admin", "client", "second")])
            s.commit()
        def sessions():
            with self.sessions() as s:
                yield s
        app = FastAPI()
        for route in (auth, compte, admin):
            app.include_router(route.routeur)
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test", headers={"Authorization": "Bearer owner"})

    async def asyncTearDown(self):
        await self.client.aclose()
        self.engine.dispose()
        self.temp.cleanup()

    async def action(self, action, target="client", revision=0, actor="owner", **extra):
        return await self.client.post(f"/admin/comptes/{target}/actions", headers={"Authorization": f"Bearer {actor}"},
                                      json={"revision": revision, "action": action, "confirmation_email": f"{target}@example.com", **extra})

    async def test_anonyme_et_client_refuses_sur_tous_les_endpoints(self):
        for authorization, expected in [("", 401), ("Bearer client", 403)]:
            for path in ["/admin/vue-ensemble", "/admin/comptes", "/admin/journal", "/admin/alertes", "/admin/comptes/owner"]:
                r = await self.client.get(path, headers={"Authorization": authorization})
                self.assertEqual(r.status_code, expected, r.text)
            for method, path, data in [("POST", "/admin/comptes", {"prenom": "Test", "nom": "Client", "email": "new@example.com"}),
                                      ("PATCH", "/admin/comptes/owner", {"prenom": "Test", "nom": "Client", "revision": 0}),
                                      ("POST", "/admin/comptes/owner/actions", {"action": "suspendre", "revision": 0, "confirmation_email": "owner@example.com"})]:
                self.assertEqual((await self.client.request(method, path, headers={"Authorization": authorization}, json=data)).status_code, expected)

    async def test_creation_client_email_normalise_aucun_envoi_ni_role_injecte(self):
        data = {"prenom": "  Marie ", "nom": " Test ", "email": "NEW@EXAMPLE.COM"}
        self.assertEqual((await self.client.post("/admin/comptes", json={**data, "role": "proprietaire"})).status_code, 422)
        with patch.object(auth, "envoyer_code_connexion") as mail:
            r = await self.client.post("/admin/comptes", json=data)
            mail.assert_not_called()
        self.assertEqual(r.status_code, 201, r.text)
        self.assertEqual((r.json()["email"], r.json()["prenom"], r.json()["role"]), ("new@example.com", "Marie", "client"))
        self.assertIsNone(r.json()["email_verifie_le"])
        self.assertEqual((await self.client.post("/admin/comptes", json=data)).status_code, 409)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count()).select_from(JournalAdmin)), 1)

    async def test_alerte_apres_trentieme_reussite_sans_doublon_ni_suspension(self):
        with self.sessions() as s:
            s.add(QuotaCreation(compte_id="client", nature="photo", utilisees=29)); s.commit()
            limites.reserver(s, "client", "photo", "trentieme"); s.commit()
        self.assertEqual((await self.client.get("/admin/alertes")).json()["total"], 0)
        with self.sessions() as s:
            limites.terminer(s, "trentieme", True); s.commit()
        first = (await self.client.get("/admin/alertes")).json()
        again = (await self.client.get("/admin/alertes", headers={"Authorization": "Bearer admin"})).json()
        self.assertEqual(first, again)
        self.assertEqual(first["total"], 1)
        alert = first["alertes"][0]
        self.assertEqual((alert["nature"], alert["utilisees"], alert["limite"]), ("photo", 30, 30))
        self.assertEqual(alert["compte"]["email"], "client@example.com")
        self.assertIn("fichiers déjà achetés restent accessibles", alert["message"])
        self.assertEqual(alert["compte"]["statut"], "actif")
        self.assertEqual((await self.client.get("/compte", headers={"Authorization": "Bearer client"})).status_code, 200)

    async def test_generation_echouee_ne_declenche_pas_alerte(self):
        with self.sessions() as s:
            s.add(QuotaCreation(compte_id="client", nature="photo", utilisees=29)); s.commit()
            limites.reserver(s, "client", "photo", "echec"); s.commit()
            limites.terminer(s, "echec", False); s.commit()
        self.assertEqual((await self.client.get("/admin/alertes")).json()["total"], 0)

    async def test_deblocage_et_achat_resolvent_alerte_nouvelle_periode_distincte(self):
        with self.sessions() as s:
            s.add(QuotaCreation(compte_id="client", nature="photo", utilisees=30)); s.commit()
        before = (await self.client.get("/admin/alertes")).json()["alertes"][0]["id"]
        self.assertEqual((await self.action("reinitialiser_essais")).status_code, 200)
        self.assertEqual((await self.client.get("/admin/alertes")).json()["total"], 0)
        with self.sessions() as s:
            s.get(QuotaCreation, ("client", "photo")).utilisees = 30; s.commit()
        after = (await self.client.get("/admin/alertes")).json()["alertes"][0]["id"]
        self.assertNotEqual(before, after)
        with self.sessions() as s:
            # Même remise à zéro transactionnelle que le webhook d'achat confirmé.
            limites.reinitialiser(s, "client", "photo"); s.commit()
        self.assertEqual((await self.client.get("/admin/alertes")).json()["total"], 0)

    async def test_alertes_paginees_videos_et_comptes_inactifs(self):
        with self.sessions() as s:
            for i in range(21):
                s.add(Compte(id=f"alerte-{i:02}", email=f"alerte-{i}@example.com"))
            s.flush()
            s.add_all([QuotaCreation(compte_id=f"alerte-{i:02}", nature="photo", utilisees=30) for i in range(21)])
            s.add(QuotaCreation(compte_id="client", nature="video", utilisees=10))
            s.add(QuotaCreation(compte_id="second", nature="photo", utilisees=30))
            s.get(Compte, "second").statut = "supprime"; s.commit()
        one = (await self.client.get("/admin/alertes?page=1")).json()
        two = (await self.client.get("/admin/alertes?page=2")).json()
        self.assertEqual((one["total"], len(one["alertes"]), len(two["alertes"])), (22, 20, 2))
        ids = [a["id"] for a in one["alertes"] + two["alertes"]]
        self.assertEqual(len(set(ids)), 22)
        self.assertEqual((await self.client.get("/admin/alertes?page=0")).status_code, 422)

    async def test_aucune_auto_promotion_par_le_profil_public(self):
        r = await self.client.patch("/compte/profil", headers={"Authorization": "Bearer client"}, json={"prenom": "Client", "nom": "Test", "role": "proprietaire"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["role"], "client")

    async def test_proprietaire_et_soi_meme_proteges(self):
        for action in ("supprimer", "suspendre", "retirer_admin", "nommer_admin", "deconnecter"):
            self.assertEqual((await self.action(action, "owner")).status_code, 403)
            self.assertEqual((await self.action(action, "admin", actor="admin")).status_code, 403)
        self.assertEqual((await self.client.patch("/admin/comptes/owner", json={"prenom": "Autre", "nom": "Nom", "revision": 0})).status_code, 403)

    async def test_admin_ne_peut_promouvoir_ni_gerer_autre_admin(self):
        self.assertEqual((await self.action("nommer_admin", actor="admin")).status_code, 403)
        self.assertEqual((await self.action("nommer_admin", "second")).status_code, 200)
        self.assertEqual((await self.action("suspendre", "second", revision=1, actor="admin")).status_code, 403)
        self.assertEqual((await self.action("suspendre", actor="admin")).status_code, 200)

    async def test_role_attribue_uniquement_email_valide_et_sessions_revoquees(self):
        with self.sessions() as s:
            c = s.get(Compte, "client"); c.email_verifie_le = None; s.commit()
        self.assertEqual((await self.action("nommer_admin")).status_code, 409)
        with self.sessions() as s:
            c = s.get(Compte, "client"); c.email_verifie_le = maintenant(); s.commit()
        self.assertEqual((await self.action("nommer_admin")).status_code, 200)
        self.assertEqual((await self.client.get("/compte", headers={"Authorization": "Bearer client"})).status_code, 401)
        self.assertEqual((await self.action("retirer_admin", revision=1)).status_code, 200)
        with self.sessions() as s:
            self.assertEqual(s.get(Compte, "client").role, "client")
            self.assertEqual(s.scalar(select(func.count()).select_from(JournalAdmin)), 2)

    async def test_suspension_revoque_sessions_codes_et_bloque_reconnexion(self):
        from datetime import timedelta
        with self.sessions() as s:
            s.add(CodeConnexion(email="client@example.com", code="123456", expire_le=maintenant()+timedelta(minutes=10)))
            s.commit()
        self.assertEqual((await self.action("suspendre")).status_code, 200)
        self.assertEqual((await self.client.get("/compte", headers={"Authorization": "Bearer client"})).status_code, 401)
        with patch.object(auth, "email_disponible", return_value=False), patch.object(auth.reglages, "CODE_DANS_LA_REPONSE", True):
            self.assertEqual((await self.client.post("/auth/code", json={"email":"client@example.com"})).json(), {"ok": True})
            self.assertEqual((await self.client.post("/auth/verifier", json={"email":"client@example.com", "code":"123456"})).status_code, 400)
        self.assertEqual((await self.action("reactiver", revision=1)).status_code, 200)
        with self.sessions() as s:
            self.assertEqual(s.get(Compte, "client").statut, "actif")
            self.assertIsNone(s.get(Jeton, "client"))

    async def test_supprimer_restaurer_conserve_photos_credits_offre_et_retire_role_admin(self):
        with self.sessions() as s:
            c = s.get(Compte, "client"); c.role = "admin"; c.photos_offertes_utilisees = 1
            s.add(Logement(id="home", compte_id=c.id)); s.flush()
            s.add(Photo(id="photo", logement_id="home", ordre=0, cle_originale="original"))
            s.add(MouvementCredit(compte_id=c.id, delta=5, motif="Test")); s.commit()
        self.assertEqual((await self.action("supprimer")).status_code, 200)
        duplicate = await self.client.post("/admin/comptes", json={"email":"client@example.com", "prenom":"Client", "nom":"Test"})
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual((await self.action("restaurer", revision=1)).status_code, 200)
        d = (await self.client.get("/admin/comptes/client")).json()
        self.assertEqual((d["photos"], d["solde"], d["photo_offerte_utilisee"], d["role"], d["statut"]), (1, 5, True, "client", "actif"))

    async def test_concurrence_et_confirmation_empechent_action_perimee(self):
        self.assertEqual((await self.action("supprimer", confirmation_email="second@example.com")).status_code, 400)
        responses = await asyncio.gather(self.action("suspendre"), self.action("supprimer"))
        self.assertEqual(sorted(r.status_code for r in responses), [200, 409])
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count()).select_from(JournalAdmin)), 1)

    async def test_recherche_et_filtre_aucun_secret_renvoye(self):
        r = await self.client.get("/admin/comptes?q=OWNER@EXAMPLE.COM")
        self.assertEqual(r.json()["total"], 1)
        self.assertEqual((await self.client.get("/admin/comptes?role=equipe")).json()["total"], 2)
        self.assertEqual((await self.client.get("/admin/comptes?q=%25")).json()["total"], 0)
        self.assertEqual((await self.client.get("/admin/comptes?page=0")).status_code, 422)
        self.assertEqual((await self.client.get("/admin/comptes/absent")).status_code, 404)
        for path in ("/admin/comptes", "/admin/comptes/owner", "/admin/journal", "/admin/vue-ensemble"):
            fields = (await self.client.get(path)).text.lower()
            for forbidden in ('"jeton"', '"code"', '"cle_originale"', '"smtp_password"', '"secret_key"'):
                self.assertNotIn(forbidden, fields)

    async def test_connexion_journalisee_et_deconnexion_reelle(self):
        with patch.object(auth, "email_disponible", return_value=False), patch.object(auth.reglages, "CODE_DANS_LA_REPONSE", True):
            code = (await self.client.post("/auth/code", json={"email":"client@example.com"})).json()["code_demo"]
            r = await self.client.post("/auth/verifier", json={"email":"client@example.com", "code":code})
        self.assertEqual(r.status_code, 200)
        token = r.json()["jeton"]
        self.assertEqual((await self.client.post("/auth/deconnexion", headers={"Authorization":f"Bearer {token}"})).status_code, 200)
        self.assertEqual((await self.client.get("/compte", headers={"Authorization":f"Bearer {token}"})).status_code, 401)
        d = (await self.client.get("/admin/comptes/client")).json()
        self.assertEqual(len(d["connexions"]), 1)
        self.assertIsNotNone(d["derniere_connexion_le"])
        self.assertEqual(sum(d["nombre"] for d in (await self.client.get("/admin/vue-ensemble")).json()["connexions"]), 1)

    async def test_deblocage_compteurs_restreint_trace_sans_revoquer_connexion(self):
        with self.sessions() as s:
            s.add_all([QuotaCreation(compte_id="client", nature="photo", utilisees=30),
                       QuotaCreation(compte_id="client", nature="video", utilisees=10)]); s.commit()
        self.assertEqual((await self.action("reinitialiser_essais", actor="client")).status_code, 403)
        self.assertEqual((await self.action("reinitialiser_essais")).status_code, 200)
        d = (await self.client.get("/admin/comptes/client")).json()
        self.assertEqual(d["limites"]["photo"]["utilisees"], 0)
        self.assertEqual(d["limites"]["video"]["utilisees"], 0)
        self.assertEqual(d["sessions"], 1)
        self.assertEqual((await self.action("reinitialiser_essais")).status_code, 409)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(JournalAdmin.action)), "reinitialiser_essais")

    async def test_bootstrap_ne_cree_ni_ne_remplace_proprietaire(self):
        with self.sessions() as s:
            self.assertFalse(initialiser(s, "owner@example.com"))
            with self.assertRaises(ValueError):
                initialiser(s, "client@example.com")
        with self.sessions() as s:
            c = s.get(Compte,"owner"); c.role="client"; s.commit()
            with self.assertRaises(ValueError):
                initialiser(s,"absent@example.com")
            s.rollback()
            self.assertTrue(initialiser(s,"owner@example.com"))
            self.assertEqual(s.get(Compte,"owner").role,"proprietaire")

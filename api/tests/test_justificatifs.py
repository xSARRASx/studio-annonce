"""Documents privés : propriété de la commande, cohérence Stripe et aucune écriture."""
import copy
import tempfile
import unittest
from datetime import datetime
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import justificatifs
from app.db import Base, session
from app.models import AchatCredits, Compte, Jeton, MouvementCredit
from app.routes import compte


class Justificatifs(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/test.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            s.add_all([Compte(id="a", email="a@example.com"), Compte(id="b", email="b@example.com")]); s.flush()
            s.add_all([Jeton(valeur="a", compte_id="a"), Jeton(valeur="b", compte_id="b")])
            s.add(AchatCredits(id="achat", compte_id="a", cle_demande="demande", pack_id="photo10-999", credits=10,
                              montant_centimes=999, reel=1, stripe_session_id="cs_live_recette", statut="paye",
                              credite_le=datetime(2026, 10, 7)))
            s.add(MouvementCredit(compte_id="a", delta=10, motif="Achat", reference="stripe:cs_live_recette"))
            s.commit()
        def sessions():
            with self.sessions() as s:
                yield s
        app = FastAPI(); app.include_router(compte.routeur); app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test",
                                        headers={"Authorization": "Bearer a"})
        self.key = patch.object(justificatifs.reglages, "STRIPE_SECRET_KEY", "sk_live_recette_uniquement"); self.key.start()
        self.objet = {"id": "cs_live_recette", "mode": "payment", "payment_status": "paid", "livemode": True,
                      "amount_total": 999, "currency": "eur", "client_reference_id": "a",
                      "metadata": {"achat_id": "achat", "compte_id": "a"},
                      "payment_intent": {"latest_charge": {"receipt_url": "https://pay.stripe.com/receipts/recette"}}}

    async def asyncTearDown(self):
        await self.client.aclose(); self.key.stop(); self.engine.dispose(); self.temp.cleanup()

    async def ouvrir(self, objet=None):
        with patch.object(justificatifs, "lire_session", return_value=objet or self.objet) as lire:
            reponse = await self.client.get("/compte/achats/achat/documents")
        return reponse, lire

    async def test_recu_sans_modifier_le_paiement_ni_les_credits(self):
        reponse, lire = await self.ouvrir()
        self.assertEqual(reponse.status_code, 200, reponse.text)
        self.assertEqual(reponse.json()["documents"], [{"type": "recu", "libelle": "Ouvrir le reçu Stripe",
                                                       "url": "https://pay.stripe.com/receipts/recette"}])
        lire.assert_called_once_with("cs_live_recette")
        with self.sessions() as s:
            self.assertEqual(s.get(AchatCredits, "achat").statut, "paye")
            self.assertEqual([m.delta for m in s.scalars(select(MouvementCredit))], [10])

    async def test_facture_pdf_en_priorite_et_recu_conserve(self):
        objet = {**self.objet, "invoice": {"invoice_pdf": "https://pay.stripe.com/invoice/recette/pdf",
                                           "hosted_invoice_url": "https://invoice.stripe.com/i/recette"}}
        reponse, _ = await self.ouvrir(objet)
        self.assertEqual([d["type"] for d in reponse.json()["documents"]], ["facture_pdf", "facture", "recu"])

    async def test_document_apres_remboursement_sans_recrediter(self):
        with self.sessions() as s:
            s.get(AchatCredits, "achat").statut = "rembourse"; s.commit()
        reponse, _ = await self.ouvrir()
        self.assertEqual(reponse.status_code, 200)
        with self.sessions() as s:
            self.assertEqual(s.get(AchatCredits, "achat").statut, "rembourse")

    async def test_commande_autre_compte_et_anonyme_inaccessibles(self):
        with patch.object(justificatifs, "lire_session") as lire:
            autre = await self.client.get("/compte/achats/achat/documents", headers={"Authorization": "Bearer b"})
            anonyme = await self.client.get("/compte/achats/achat/documents", headers={"Authorization": ""})
            inconnue = await self.client.get("/compte/achats/inconnue/documents")
        self.assertEqual((autre.status_code, anonyme.status_code, inconnue.status_code), (404, 401, 404))
        lire.assert_not_called()

    async def test_aucune_lecture_stripe_avant_confirmation(self):
        with self.sessions() as s:
            achat = s.get(AchatCredits, "achat"); achat.statut = "en_attente"; achat.credite_le = None; s.commit()
        reponse, lire = await self.ouvrir()
        self.assertEqual(reponse.json()["documents"], [])
        lire.assert_not_called()

    async def test_refus_des_documents_qui_ne_correspondent_pas(self):
        champs = {"id": "cs_live_autre", "mode": "subscription", "amount_total": 1000, "livemode": False,
                  "payment_status": "unpaid", "currency": "usd", "client_reference_id": "b",
                  "metadata": {"achat_id": "achat", "compte_id": "b"}}
        for champ, valeur in champs.items():
            with self.subTest(champ=champ):
                objet = copy.deepcopy(self.objet); objet[champ] = valeur
                reponse, _ = await self.ouvrir(objet)
                self.assertEqual(reponse.status_code, 502)
                self.assertNotIn("receipts", reponse.text)
        reponse, _ = await self.ouvrir({**self.objet, "metadata": ["invalide"]})
        self.assertEqual(reponse.status_code, 502)

    async def test_pas_de_redirection_vers_un_autre_site(self):
        for adresse in ("http://pay.stripe.com/a", "https://stripe.com.example.com/a", "https://stripe.com@evil.test/a",
                        "javascript:alert(1)", "https://pay.stripe.com:8443/a", "https://pay.stripe.com/a\n"):
            with self.subTest(adresse=adresse):
                objet = copy.deepcopy(self.objet); objet["payment_intent"]["latest_charge"]["receipt_url"] = adresse
                reponse, _ = await self.ouvrir(objet)
                self.assertEqual(reponse.json()["documents"], [])

    def test_service_ne_fait_qu_un_get_borne_en_temps(self):
        with patch("app.justificatifs.httpx.Client") as client:
            transport = client.return_value.__enter__.return_value
            transport.get.return_value.json.return_value = self.objet
            self.assertEqual(justificatifs.lire_session("cs_live_recette"), self.objet)
        self.assertFalse(client.call_args.kwargs["follow_redirects"])
        self.assertEqual(client.call_args.kwargs["timeout"].read, 8)
        transport.get.assert_called_once()
        transport.post.assert_not_called()
        transport.delete.assert_not_called()

    def test_erreur_reseau_n_expose_pas_la_cle(self):
        with patch("app.justificatifs.httpx.Client") as client:
            client.return_value.__enter__.return_value.get.side_effect = httpx.ReadTimeout("sk_live_ne_pas_afficher")
            with self.assertRaises(Exception) as erreur:
                justificatifs.lire_session("cs_live_recette")
        self.assertEqual(erreur.exception.status_code, 502)
        self.assertNotIn("sk_live", erreur.exception.detail)

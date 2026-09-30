"""Recette du profil et du paiement avec signatures Stripe, sans réseau ni encaissement."""
import asyncio
import hashlib
import hmac
import json
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import httpx
import stripe
from fastapi import FastAPI
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import sessionmaker

from app.db import Base, session
from app.migrations import migrer
from app.models import AchatCredits, Compte, Jeton, MouvementCredit, QuotaCreation, maintenant
from app.routes import auth, compte, paiements, photos


class ParcoursComptePaiement(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f"sqlite:///{self.temp.name}/test.db", connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            s.add_all([Compte(id="a", email="a@example.com"), Compte(id="b", email="b@example.com")]); s.flush()
            s.add_all([Jeton(valeur="a", compte_id="a"), Jeton(valeur="b", compte_id="b")]); s.commit()
        def sessions():
            with self.sessions() as s:
                yield s
        app = FastAPI()
        for route in (auth, compte, paiements, photos):
            app.include_router(route.routeur)
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test", headers={"Authorization":"Bearer a"})
        self.secret = "whsec_recette_uniquement"
        self.patches = [patch.object(paiements.reglages, "STRIPE_WEBHOOK_SECRET", self.secret),
                        patch.object(paiements.reglages, "STRIPE_SECRET_KEY", "sk_test_recette_uniquement"),
                        patch.object(paiements, "disponible", return_value=True)]
        for p in self.patches: p.start()

    async def asyncTearDown(self):
        await self.client.aclose()
        for p in self.patches: p.stop()
        self.engine.dispose(); self.temp.cleanup()

    async def profil(self):
        return await self.client.patch("/compte/profil", json={"prenom":"  Martin ", "nom":" Moré "})

    def commande(self):
        with self.sessions() as s:
            a = AchatCredits(id="achat", compte_id="a", cle_demande=str(uuid4()), pack_id="p5", credits=5, montant_centimes=890,
                            stripe_session_id="cs_test_recette")
            s.add(a); s.commit()
        return {"id":"cs_test_recette", "object":"checkout.session", "mode":"payment", "payment_status":"paid",
                "amount_total":890, "currency":"eur", "livemode":False, "client_reference_id":"a",
                "metadata":{"achat_id":"achat", "compte_id":"a"}}

    async def evenement(self, objet, genre="checkout.session.completed", signe=True):
        corps = json.dumps({"id":"evt_recette", "object":"event", "type":genre, "data":{"object":objet}}).encode()
        stamp = str(int(time.time()))
        sig = hmac.new(self.secret.encode(), stamp.encode()+b"."+corps, hashlib.sha256).hexdigest()
        return await self.client.post("/paiements/webhook", content=corps,
            headers={"Stripe-Signature":f"t={stamp},v1={sig if signe else 'invalide'}"})

    def solde(self):
        with self.sessions() as s:
            return s.scalar(select(func.coalesce(func.sum(MouvementCredit.delta),0)))

    async def test_profil_valide_persiste_et_ne_change_pas_email(self):
        self.assertFalse((await self.client.get("/compte")).json()["profil_complet"])
        self.assertEqual((await self.client.patch("/compte/profil", json={"prenom":" ", "nom":"Test"})).status_code,422)
        r = await self.profil(); self.assertEqual(r.status_code,200)
        self.assertEqual((r.json()["prenom"], r.json()["nom"], r.json()["email"]), ("Martin","Moré","a@example.com"))
        self.assertTrue((await self.client.get("/compte")).json()["profil_complet"])

    async def test_photo_et_achat_refuses_avant_profil(self):
        self.assertEqual((await self.client.post("/photos/p/essai", json={})).status_code,403)
        self.assertEqual((await self.client.post("/paiements/checkout", json={"pack_id":"p5", "cle_demande":str(uuid4())})).status_code,403)

    async def test_checkout_prix_serveur_et_double_clic_meme_session(self):
        await self.profil()
        d = {"pack_id":"photo10-999", "cle_demande":str(uuid4())}
        with patch.object(stripe.checkout.Session, "create", return_value=stripe.StripeObject.construct_from({
                "id":"cs_test_recette", "url":"https://checkout.stripe.com/c/pay/cs_test_recette"}, None)) as creer:
            first = await self.client.post("/paiements/checkout", json=d)
            again = await self.client.post("/paiements/checkout", json=d)
            self.assertEqual(first.status_code,200,first.text); self.assertEqual(first.json(),again.json())
            self.assertEqual(creer.call_count,1)
            self.assertEqual(creer.call_args.kwargs["line_items"][0]["price_data"]["unit_amount"],999)
            self.assertEqual((await self.client.post("/paiements/checkout",json={**d,"prix_centimes":1})).status_code,422)
            self.assertEqual((await self.client.post("/paiements/checkout",json={**d,"pack_id":"p10"})).status_code,400)
            self.assertEqual(self.solde(),0)

    async def test_paiement_ferme_et_session_privee(self):
        await self.profil(); self.commande()
        with patch.object(paiements,"disponible",return_value=False):
            self.assertEqual((await self.client.post("/paiements/checkout",json={"pack_id":"p5","cle_demande":str(uuid4())})).status_code,503)
        self.assertEqual((await self.client.get("/paiements/achat",headers={"Authorization":"Bearer b"})).status_code,404)

    async def test_pack_unique_999_et_confirmation_dix_credits(self):
        await self.profil()
        packs = (await self.client.get("/compte")).json()["packs"]
        self.assertEqual(packs, [{"id": "photo10-999", "credits": 10, "prix_centimes": 999, "libelle": "10 crédits photo"}])
        with patch.object(stripe.checkout.Session, "create", return_value=stripe.StripeObject.construct_from({
                "id": "cs_test_nouveau", "url": "https://checkout.stripe.com/c/pay/cs_test_nouveau"}, None)):
            response = await self.client.post("/paiements/checkout", json={"pack_id": packs[0]["id"], "cle_demande": str(uuid4())})
        self.assertEqual(response.status_code, 200, response.text)
        objet = {"id": "cs_test_nouveau", "object": "checkout.session", "mode": "payment", "payment_status": "paid",
                 "amount_total": 999, "currency": "eur", "livemode": False, "client_reference_id": "a",
                 "metadata": {"achat_id": response.json()["achat_id"], "compte_id": "a"}}
        self.assertEqual((await self.evenement({**objet, "amount_total": 1490})).status_code, 400)
        self.assertEqual(self.solde(), 0)
        self.assertEqual((await self.evenement(objet)).status_code, 200)
        self.assertEqual((await self.evenement(objet)).status_code, 200)
        self.assertEqual(self.solde(), 10)

    async def test_ancienne_commande_garde_prix_et_cle_ne_change_pas_de_pack(self):
        await self.profil()
        objet = self.commande()
        with self.sessions() as s:
            cle = s.get(AchatCredits, "achat").cle_demande
        with patch.object(stripe.checkout.Session, "create") as creer:
            response = await self.client.post("/paiements/checkout", json={"pack_id": "photo10-999", "cle_demande": cle})
        self.assertEqual(response.status_code, 409)
        creer.assert_not_called()
        self.assertEqual((await self.evenement(objet)).status_code, 200)
        self.assertEqual(self.solde(), 5)  # Ancien achat à 8,90 €, jamais converti au nouveau tarif.

    async def test_webhook_invalide_ou_impaye_ne_credite_jamais(self):
        objet = self.commande()
        self.assertEqual((await self.evenement(objet,signe=False)).status_code,400)
        self.assertEqual((await self.evenement({**objet,"payment_status":"unpaid"})).status_code,200)
        for correction in [{"amount_total":1}, {"currency":"usd"}, {"livemode":True}, {"client_reference_id":"b"}, {"id":"cs_etranger"}]:
            self.assertEqual((await self.evenement({**objet,**correction})).status_code,400)
        self.assertEqual(self.solde(),0)

    async def test_evenements_repetes_et_concurrents_creditent_une_fois(self):
        objet=self.commande()
        rs=await asyncio.gather(*[self.evenement(objet) for _ in range(4)])
        self.assertTrue(all(r.status_code==200 for r in rs))
        self.assertEqual(self.solde(),5)
        await self.evenement(objet,"checkout.session.async_payment_succeeded")
        await self.evenement(objet,"checkout.session.expired")
        self.assertEqual(self.solde(),5)
        self.assertEqual((await self.client.get("/paiements/achat")).json()["statut"],"paye")

    async def test_connexion_meme_email_pas_deux_photos_offertes(self):
        with patch.object(auth, "email_disponible", return_value=False), patch.object(auth.reglages,"CODE_DANS_LA_REPONSE",True):
            for adresse in ["a@example.com","A@EXAMPLE.COM"]:
                r=await self.client.post("/auth/code",json={"email":adresse})
                v=await self.client.post("/auth/verifier",json={"email":adresse,"code":r.json()["code_demo"]})
                self.assertEqual(v.status_code,200)
                self.assertEqual(v.json()["compte_id"],"a")
                self.assertEqual((await self.client.post("/auth/verifier",json={"email":adresse,"code":r.json()["code_demo"]})).status_code,400)
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count(Compte.id))),2)

    async def test_seul_paiement_confirme_remet_photo_a_zero_et_doublon_ne_reset_pas(self):
        with self.sessions() as s:
            s.add_all([QuotaCreation(compte_id="a", nature="photo", utilisees=30),
                       QuotaCreation(compte_id="a", nature="video", utilisees=10)]); s.commit()
        objet = self.commande()
        await self.evenement({**objet, "payment_status": "unpaid"})
        self.assertEqual((await self.client.get("/compte")).json()["limites"]["photo"]["utilisees"], 30)
        await self.evenement(objet)
        etat = (await self.client.get("/compte")).json()["limites"]
        self.assertEqual(etat["photo"]["utilisees"], 0)
        self.assertEqual(etat["video"]["utilisees"], 10)
        with self.sessions() as s:
            s.get(QuotaCreation, ("a", "photo")).utilisees = 3; s.commit()
        await self.evenement(objet)
        self.assertEqual((await self.client.get("/compte")).json()["limites"]["photo"]["utilisees"], 3)


class Migration(unittest.TestCase):
    def test_ancienne_base_conserve_comptes_et_migration_rejouable(self):
        with tempfile.TemporaryDirectory() as t:
            engine=create_engine(f"sqlite:///{Path(t)/'old.db'}")
            with engine.begin() as c:
                c.execute(text("CREATE TABLE comptes (id VARCHAR PRIMARY KEY, email VARCHAR UNIQUE, cree_le TIMESTAMP, photos_offertes_utilisees INTEGER)"))
                c.execute(text("INSERT INTO comptes VALUES ('existant','existant@example.com',CURRENT_TIMESTAMP,1)"))
            migrer(engine); migrer(engine)
            with engine.connect() as c:
                r=c.execute(text("SELECT email,prenom,nom,photos_offertes_utilisees FROM comptes")).one()
                self.assertEqual(tuple(r),('existant@example.com','','',1))
            engine.dispose()

    def test_migration_admin_aucun_droit_implicite_et_validation_par_session_seulement(self):
        with tempfile.TemporaryDirectory() as t:
            engine = create_engine(f"sqlite:///{Path(t)/'old-admin.db'}")
            with engine.begin() as c:
                c.execute(text("CREATE TABLE comptes (id VARCHAR PRIMARY KEY, email VARCHAR UNIQUE, cree_le TIMESTAMP, photos_offertes_utilisees INTEGER)"))
                c.execute(text("INSERT INTO comptes VALUES ('valide','valide@example.com',CURRENT_TIMESTAMP,1), ('sans_session','autre@example.com',CURRENT_TIMESTAMP,0)"))
                c.execute(text("CREATE TABLE jetons (valeur VARCHAR PRIMARY KEY, compte_id VARCHAR, cree_le TIMESTAMP)"))
                c.execute(text("INSERT INTO jetons VALUES ('session-test-1','valide','2026-09-27 10:00:00'), ('session-test-2','valide','2026-09-28 12:00:00')"))
            migrer(engine)
            migrer(engine)
            with engine.connect() as c:
                comptes = c.execute(text("SELECT id,role,statut,revision_admin,email_verifie_le,derniere_connexion_le FROM comptes ORDER BY id")).all()
                self.assertEqual(tuple(comptes[0]), ('sans_session', 'client', 'actif', 0, None, None))
                self.assertEqual(tuple(comptes[1]), ('valide', 'client', 'actif', 0, '2026-09-27 10:00:00', '2026-09-28 12:00:00'))
                self.assertEqual(c.execute(text("SELECT count(*) FROM connexions_comptes")).scalar(), 0)
            engine.dispose()

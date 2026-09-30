"""Contrat commun photo/vidéo : compte, réservations et changement de période."""
import unittest
from datetime import timedelta
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app import limites
from app.db import Base
from app.models import Compte, QuotaCreation, ReservationCreation, maintenant


class LimitesTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.s = Session(self.engine)
        self.s.add_all([Compte(id="a", email="a@example.test"), Compte(id="b", email="b@example.test")])
        self.s.commit()

    def tearDown(self):
        self.s.close(); self.engine.dispose()

    def test_video_dix_resultats_puis_refus_sans_toucher_photo_ni_autre_compte(self):
        for i in range(10):
            limites.reserver(self.s, "a", "video", f"video-{i}"); self.s.flush()
            limites.terminer(self.s, f"video-{i}", True); self.s.commit()
        with self.assertRaises(HTTPException) as refus:
            limites.reserver(self.s, "a", "video", "video-11")
        self.assertEqual(refus.exception.status_code, 429)
        self.assertEqual(limites.vue(self.s, "a")["photo"]["restantes"], 30)
        self.assertEqual(limites.vue(self.s, "b")["video"]["restantes"], 10)

    def test_reservation_comptee_et_echec_libere_la_place(self):
        self.s.add(QuotaCreation(compte_id="a", nature="photo", utilisees=29)); self.s.commit()
        limites.reserver(self.s, "a", "photo", "reservation"); self.s.commit()
        self.assertTrue(limites.vue(self.s, "a")["photo"]["bloque"])
        limites.terminer(self.s, "reservation", False); self.s.commit()
        self.assertEqual(limites.vue(self.s, "a")["photo"]["restantes"], 1)
        limites.terminer(self.s, "reservation", True); self.s.commit()
        self.assertEqual(limites.vue(self.s, "a")["photo"]["utilisees"], 29)

    def test_achat_pendant_generation_n_impute_pas_ancienne_reservation(self):
        limites.reserver(self.s, "a", "photo", "avant-achat"); self.s.commit()
        limites.reinitialiser(self.s, "a", "photo"); self.s.commit()
        limites.terminer(self.s, "avant-achat", True); self.s.commit()
        self.assertEqual(limites.vue(self.s, "a")["photo"]["utilisees"], 0)
        limites.reserver(self.s, "a", "photo", "apres-achat"); self.s.commit()
        limites.terminer(self.s, "apres-achat", True); self.s.commit()
        self.assertEqual(limites.vue(self.s, "a")["photo"]["utilisees"], 1)

    def test_reservation_expiree_ne_valide_pas_resultat(self):
        instant = maintenant()
        with patch.object(limites, "maintenant", return_value=instant):
            limites.reserver(self.s, "a", "photo", "expiree"); self.s.commit()
        with patch.object(limites, "maintenant", return_value=instant + timedelta(minutes=10)):
            self.assertFalse(limites.vue(self.s, "a")["photo"]["bloque"])
            with self.assertRaises(HTTPException): limites.terminer(self.s, "expiree", True)
        self.assertEqual(self.s.get(QuotaCreation, ("a", "photo")).utilisees, 0)

    def test_compteur_fourni_par_client_inutile_et_type_inconnu_refuse(self):
        with self.assertRaises(ValueError): limites.reserver(self.s, "a", "autre", "inconnu")
        self.assertIsNone(self.s.get(ReservationCreation, "inconnu"))

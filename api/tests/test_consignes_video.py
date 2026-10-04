import unittest
from unittest.mock import AsyncMock, patch

import httpx

from app import higgsfield_video
from app.consignes_video import preparer_consigne


class DirectionCamera(unittest.TestCase):
    def test_varie_les_plans_et_conserve_la_demande(self):
        demande = "Contourne la table du salon, puis montre la chambre."
        plans = [preparer_consigne(demande, index=i, total=3) for i in range(3)]
        self.assertEqual(len(set(plans)), 3)
        for index, prompt in enumerate(plans):
            self.assertIn(f"shot {index + 1}/3", prompt)
            self.assertTrue(prompt.endswith(demande))
            self.assertIn("CLIENT REQUEST below controls", prompt)
            self.assertIn("parallax", prompt)
            self.assertNotIn("Mouvement de caméra doux", prompt)

    def test_calme_explicite_et_orbite_sans_inventer_de_piece(self):
        calme = preparer_consigne("Un plan très lent", "calme")
        self.assertIn("calm, even pace", calme)
        self.assertNotIn("energetic spatial", calme)
        orbite = preparer_consigne("Autour de l’îlot", "orbite")
        self.assertIn("45–70 degree partial orbit", orbite)
        self.assertIn("Never complete a 360", orbite)
        self.assertIn("no digital zoom", orbite.lower())

    def test_schemas_fournisseur_distincts_sans_parametres_inventes(self):
        args = ("https://files.example.test/photo.jpg", preparer_consigne("Visite dynamique"), 5)
        seedance = higgsfield_video.parametres(*args)
        kling = higgsfield_video.parametres(*args, higgsfield_video.MODELE_KLING)
        self.assertEqual(seedance["resolution"], "720p")
        self.assertFalse(seedance["generate_audio"])
        self.assertEqual(kling["sound"], "off")
        self.assertFalse(kling["multi_shots"])
        self.assertNotIn("resolution", kling)
        self.assertNotIn("generate_audio", kling)
        for modele, duration in [("autre", 5), (higgsfield_video.MODELE_KLING, 30)]:
            with self.assertRaises(ValueError):
                higgsfield_video.parametres(args[0], args[1], duration, modele)


class ContratFournisseur(unittest.IsolatedAsyncioTestCase):
    async def test_adresse_modele_corps_et_idempotence(self):
        mock = AsyncMock()
        mock.post.return_value = httpx.Response(200, request=httpx.Request("POST", "https://api.higgsfield.ai/test"),
            json={"request_id": "recu", "status_url": "https://api.higgsfield.ai/requests/recu/status"})
        with patch.object(higgsfield_video.httpx, "AsyncClient") as client, patch.object(higgsfield_video, "_entetes", return_value={"Authorization": "Key test:test"}):
            client.return_value.__aenter__.return_value = mock
            await higgsfield_video.soumettre("https://files.example.test/photo.jpg", "Camera travel", 5, "confirmation-test", higgsfield_video.MODELE_KLING)
        call = mock.post.call_args
        self.assertEqual(call.args[0], "https://api.higgsfield.ai/" + higgsfield_video.MODELE_KLING)
        self.assertEqual(call.kwargs["headers"]["Idempotency-Key"], "confirmation-test")
        self.assertEqual(call.kwargs["json"]["sound"], "off")

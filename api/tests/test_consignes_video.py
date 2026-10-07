import unittest
from unittest.mock import AsyncMock, patch

import httpx

from app import higgsfield_video
from app.consignes_video import identifier_piece, preparer_consigne, preparer_visite_continue


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

    def test_visite_multiphoto_decrit_chaque_mouvement(self):
        demande = "Contourne la table, puis montre la chambre."
        prompt = preparer_visite_continue(demande, ["traversee", "orbite", "calme"], 15)
        self.assertIn("Reference image 1 — unidentified room — traversee: A lively indoor FPV-style", prompt)
        self.assertIn("Reference image 2 — unidentified room — orbite: A decisive curved camera move", prompt)
        self.assertIn("Reference image 3 — unidentified room — calme: An unhurried architectural", prompt)
        self.assertIn("45–70 degree partial orbit", prompt)
        self.assertTrue(prompt.endswith(demande))

    def test_visite_respecte_identite_des_pieces_et_passages_prouves(self):
        pieces = [identifier_piece({"piece": "Salon"}), identifier_piece({"piece": "Cuisine"}),
                  identifier_piece({"piece": "Chambre"})]
        prompt = preparer_visite_continue("Visite façon drone", ["traversee", "orbite", "calme"], 15,
                                          pieces, "La porte à droite du salon mène à la cuisine. La chambre est au bout du couloir.")
        self.assertIn("Reference image 1 — living room", prompt)
        self.assertIn("Reference image 2 — kitchen", prompt)
        self.assertIn("Reference image 3 — bedroom", prompt)
        self.assertIn("La chambre est au bout du couloir", prompt)
        self.assertIn("Never swap room identities", prompt)
        self.assertIn("use a clean cinematic cut", prompt)
        self.assertIn("never swap their destinations", prompt)
        self.assertIn("A route marked uncertain or 'cut' overrides", prompt)
        self.assertEqual(identifier_piece({"piece": "Pièce non identifiée"}), "unidentified room")

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

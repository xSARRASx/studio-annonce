"""Contrats des fournisseurs photo sans crédit ni requête réseau."""
import io
import json
import base64
import unittest
from unittest.mock import AsyncMock, Mock, patch

from PIL import Image

from app import gemini, openai_images, openai_vision, retouche, vision
from app.consignes_photo import REGLE_RETOUCHE


def photo(largeur: int, hauteur: int) -> bytes:
    fichier = io.BytesIO()
    Image.new("RGB", (largeur, hauteur), "white").save(fichier, "JPEG")
    return fichier.getvalue()


class TaillesOpenAI(unittest.TestCase):
    def test_apercu_vertical_respecte_le_minimum_de_pixels(self):
        largeur, hauteur = map(int, openai_images._taille_sortie(photo(900, 1600), 1024).split("x"))
        self.assertGreaterEqual(largeur * hauteur, 655_360)
        self.assertLess(largeur, hauteur)
        self.assertLess(abs(largeur / hauteur - 900 / 1600), 0.02)

    def test_hd_horizontal_reste_dans_les_limites(self):
        largeur, hauteur = map(int, openai_images._taille_sortie(photo(1600, 900), 2048).split("x"))
        self.assertGreaterEqual(largeur, 2048)
        self.assertLessEqual(largeur, 3840)
        self.assertLessEqual(largeur * hauteur, 8_294_400)

    def test_panorama_extreme_est_refuse(self):
        with self.assertRaises(ValueError):
            openai_images._taille_sortie(photo(4000, 500), 1024)


class VisionOpenAI(unittest.IsolatedAsyncioTestCase):
    async def test_analyse_recupere_le_json_structure(self):
        resultat = {"piece": "salon", "defauts": ["câble"], "consigne": "Retirer le câble.", "question": ""}
        with patch.object(openai_vision, "_appel", new_callable=AsyncMock, return_value=json.dumps(resultat)) as appel:
            self.assertEqual(await openai_vision.analyser(photo(100, 100)), resultat)
        corps = appel.call_args.args[0]
        self.assertEqual(corps["text"]["format"]["type"], "json_schema")
        self.assertTrue(corps["input"][0]["content"][1]["image_url"].startswith("data:image/jpeg;base64,"))

    async def test_cle_openai_suffit_pour_analyse_et_retouche(self):
        with patch.object(vision.reglages, "IA_ACTIVE", True), patch.object(vision.reglages, "OPENAI_API_KEY", "cle-test"), patch.object(
            vision.reglages, "GEMINI_API_KEY", ""
        ), patch.object(retouche.reglages, "FOURNISSEUR_IMAGE", "openai"), patch.object(
            openai_vision, "analyser", new_callable=AsyncMock, return_value={"piece": "salon"}
        ) as analyser:
            self.assertTrue(vision.disponible())
            self.assertTrue(retouche.disponible())
            self.assertEqual(await vision.analyser(b"image"), {"piece": "salon"})
            analyser.assert_awaited_once_with(b"image")

    async def test_ia_desactivee_meme_avec_une_cle_configuree(self):
        with patch.object(vision.reglages, "IA_ACTIVE", False), patch.object(
            vision.reglages, "OPENAI_API_KEY", "cle-test"
        ), patch.object(retouche.reglages, "FOURNISSEUR_IMAGE", "openai"):
            self.assertFalse(vision.disponible())
            self.assertFalse(retouche.disponible())

    async def test_mode_gemini_ignore_la_cle_openai_sans_credit(self):
        analyse = {"piece": "salon"}
        with patch.object(vision.reglages, "IA_ACTIVE", True), patch.object(
            vision.reglages, "OPENAI_API_KEY", "cle-openai-epuisee"
        ), patch.object(vision.reglages, "GEMINI_API_KEY", "cle-gemini"), patch.object(
            vision.reglages, "FOURNISSEUR_IMAGE", "gemini"
        ), patch.object(gemini, "analyser", new_callable=AsyncMock, return_value=analyse) as analyser, patch.object(
            gemini, "reformuler_demande", new_callable=AsyncMock, return_value="Consigne Gemini"
        ) as reformuler, patch.object(openai_vision, "analyser", new_callable=AsyncMock) as analyse_openai, patch.object(
            openai_vision, "reformuler_demande", new_callable=AsyncMock
        ) as reformulation_openai:
            self.assertTrue(vision.disponible())
            self.assertTrue(retouche.disponible())
            self.assertEqual(await vision.analyser(b"image"), analyse)
            self.assertEqual(await vision.reformuler_demande(analyse, [], "Plus de lumière"), "Consigne Gemini")
            analyser.assert_awaited_once_with(b"image")
            reformuler.assert_awaited_once_with(analyse, [], "Plus de lumière")
            analyse_openai.assert_not_awaited()
            reformulation_openai.assert_not_awaited()

    async def test_mode_gemini_ne_souvre_pas_sans_sa_cle(self):
        with patch.object(vision.reglages, "IA_ACTIVE", True), patch.object(
            vision.reglages, "OPENAI_API_KEY", "cle-openai"
        ), patch.object(vision.reglages, "GEMINI_API_KEY", ""), patch.object(
            vision.reglages, "FOURNISSEUR_IMAGE", "gemini"
        ):
            self.assertFalse(vision.disponible())
            self.assertFalse(retouche.disponible())


class ConsignesFournisseurs(unittest.IsolatedAsyncioTestCase):
    async def test_demande_detaillee_preservee_si_openai_oublie_des_choix(self):
        demande = "Peins en bleu pétrole. Garde le radiateur. Remplace le carrelage par du parquet chêne."
        with patch.object(openai_vision, "_appel", new=AsyncMock(return_value="Rends la pièce plus belle.")) as appel:
            consigne = await openai_vision.reformuler_demande({"piece": "salon"}, ["Murs blancs"], demande)
        self.assertIn(demande, consigne)
        self.assertIn(REGLE_RETOUCHE, appel.call_args.args[0]["input"][0]["content"])

    async def test_reformulation_longue_non_tronquee(self):
        precision = "Conserve exactement le radiateur sous la fenêtre de gauche."
        with patch.object(openai_vision, "_appel", new=AsyncMock(return_value="Choix précis. " * 350 + precision)):
            consigne = await openai_vision.reformuler_demande(None, [], "Refais la décoration.")
        self.assertIn(precision, consigne)

    async def test_gemini_preserve_aussi_la_demande_et_les_reperes(self):
        demande = "Refais tout le mobilier, murs terracotta, sol en parquet ; garde les fenêtres."
        reponse = {"candidates": [{"content": {"parts": [{"text": "Améliore la décoration."}]}}]}
        with patch.object(gemini, "_appel", new=AsyncMock(return_value=reponse)) as appel:
            consigne = await gemini.reformuler_demande(None, [], demande)
        self.assertIn(demande, consigne)
        self.assertIn(REGLE_RETOUCHE, appel.call_args.args[1]["contents"][0]["parts"][0]["text"])

    async def test_regles_et_demande_atteignent_la_retouche_openai(self):
        resultat = photo(100, 100)
        rep = Mock(status_code=200, headers={})
        rep.json.return_value = {"data": [{"b64_json": base64.b64encode(resultat).decode()}]}
        client = AsyncMock()
        client.post.return_value = rep
        demande = "Remplace le sol par du parquet, conserve le radiateur."
        with patch.object(openai_images.httpx, "AsyncClient") as constructeur, patch.object(
            openai_images, "_cle", return_value="cle-test"
        ), patch.object(openai_images, "enregistrer"):
            constructeur.return_value.__aenter__.return_value = client
            self.assertEqual(await openai_images.retoucher(photo(1024, 768), demande), resultat)
        self.assertEqual(client.post.call_args.kwargs["data"]["prompt"], REGLE_RETOUCHE + demande)

    async def test_regles_et_demande_atteignent_la_retouche_gemini(self):
        resultat = photo(100, 100)
        reponse = {"candidates": [{"content": {"parts": [{"inlineData": {
            "data": base64.b64encode(resultat).decode()
        }}]}}]}
        demande = "Change le mobilier et la peinture, garde les portes."
        with patch.object(gemini, "_appel", new=AsyncMock(return_value=reponse)) as appel:
            self.assertEqual(await gemini.retoucher(photo(1024, 768), demande), resultat)
        self.assertEqual(appel.call_args.args[1]["contents"][0]["parts"][0]["text"], REGLE_RETOUCHE + demande)


if __name__ == "__main__":
    unittest.main()

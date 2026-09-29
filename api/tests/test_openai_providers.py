"""Contrats des fournisseurs photo sans crédit ni requête réseau."""
import io
import json
import unittest
from unittest.mock import AsyncMock, patch

from PIL import Image

from app import openai_images, openai_vision, retouche, vision


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


if __name__ == "__main__":
    unittest.main()

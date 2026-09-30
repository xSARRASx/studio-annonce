import io
import tempfile
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import AsyncMock, patch

from PIL import Image

from app.openai_images import RetoucheMesuree
from scripts import recette_retouche_openai


def photo(format_image: str = "PNG") -> bytes:
    fichier = io.BytesIO()
    Image.new("RGB", (1200, 800), "white").save(fichier, format_image)
    return fichier.getvalue()


class RecetteRetoucheOpenAI(unittest.IsolatedAsyncioTestCase):
    async def test_ecrit_une_image_validee_et_rend_le_cout(self):
        usage = {
            "input_tokens_details": {"image_tokens": 1500, "text_tokens": 300},
            "output_tokens": 2000,
        }
        mesure = RetoucheMesuree(photo("JPEG"), "gpt-image-2.5-sunburst", "apercu", usage, "req-test")
        with tempfile.TemporaryDirectory() as dossier, patch.object(
            recette_retouche_openai.openai_images,
            "retoucher_avec_mesure",
            new_callable=AsyncMock,
            return_value=mesure,
        ) as retoucher:
            source = Path(dossier) / "source.png"
            sortie = Path(dossier) / "resultat.jpg"
            source.write_bytes(photo())

            bilan = await recette_retouche_openai.executer(source, sortie, " Ranger la pièce. ")

            self.assertEqual(bilan.cout_usd, Decimal("0.0735"))
            self.assertEqual((bilan.largeur, bilan.hauteur), (1200, 800))
            self.assertEqual(sortie.read_bytes(), mesure.image)
            image_envoyee, consigne, hd = retoucher.await_args.args
            self.assertEqual(consigne, "Ranger la pièce.")
            self.assertFalse(hd)
            with Image.open(io.BytesIO(image_envoyee)) as envoyee:
                self.assertEqual(envoyee.format, "JPEG")

    async def test_refuse_une_sortie_existante_avant_appel_payant(self):
        with tempfile.TemporaryDirectory() as dossier, patch.object(
            recette_retouche_openai.openai_images,
            "retoucher_avec_mesure",
            new_callable=AsyncMock,
        ) as retoucher:
            source = Path(dossier) / "source.jpg"
            sortie = Path(dossier) / "resultat.jpg"
            source.write_bytes(photo("JPEG"))
            sortie.write_bytes(b"a conserver")

            with self.assertRaises(FileExistsError):
                await recette_retouche_openai.executer(source, sortie, "Ranger la pièce.")

            self.assertEqual(sortie.read_bytes(), b"a conserver")
            retoucher.assert_not_awaited()

    async def test_supprime_la_reservation_si_le_fournisseur_echoue(self):
        with tempfile.TemporaryDirectory() as dossier, patch.object(
            recette_retouche_openai.openai_images,
            "retoucher_avec_mesure",
            new_callable=AsyncMock,
            side_effect=RuntimeError("solde épuisé"),
        ):
            source = Path(dossier) / "source.jpg"
            sortie = Path(dossier) / "resultat.jpg"
            source.write_bytes(photo("JPEG"))

            with self.assertRaisesRegex(RuntimeError, "solde épuisé"):
                await recette_retouche_openai.executer(source, sortie, "Ranger la pièce.")

            self.assertFalse(sortie.exists())

    async def test_refuse_une_fausse_image_avant_appel_payant(self):
        with tempfile.TemporaryDirectory() as dossier, patch.object(
            recette_retouche_openai.openai_images,
            "retoucher_avec_mesure",
            new_callable=AsyncMock,
        ) as retoucher:
            source = Path(dossier) / "source.jpg"
            source.write_bytes(b"pas une image")

            with self.assertRaises(Exception):
                await recette_retouche_openai.executer(source, Path(dossier) / "resultat.jpg", "Ranger.")

            retoucher.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()

"""La photo importée doit rester exploitable sans saturer le stockage."""
import io
import unittest

from PIL import Image, ImageChops

from app.images import apercu_filigrane, hd_deja_prete, preparer_envoi_ia


class TestPhotoSource(unittest.TestCase):
    def test_apercu_garde_les_details_2k_et_hd_reutilise_la_version_finale(self):
        source = io.BytesIO()
        Image.new("RGB", (2048, 1365), (155, 132, 110)).save(source, "JPEG")
        self.assertTrue(hd_deja_prete(source.getvalue()))
        with Image.open(io.BytesIO(apercu_filigrane(source.getvalue()))) as apercu:
            self.assertEqual(apercu.size, (2048, 1365))
            self.assertEqual(apercu.format, "WEBP")
        petit = io.BytesIO()
        Image.new("RGB", (1024, 683), "white").save(petit, "JPEG")
        self.assertFalse(hd_deja_prete(petit.getvalue()))

    def test_portrait_tres_haut_reste_dans_la_limite_et_lisible(self):
        source = Image.new("RGB", (1800, 4200), (155, 132, 110))
        flux = io.BytesIO()
        source.save(flux, "PNG")

        resultat = preparer_envoi_ia(flux.getvalue())

        with Image.open(io.BytesIO(resultat)) as photo:
            self.assertEqual(photo.format, "JPEG")
            self.assertLessEqual(max(photo.size), 2048)
            self.assertAlmostEqual(photo.width / photo.height, 1800 / 4200, delta=0.001)
            photo.verify()
        self.assertLess(len(resultat), 200_000)

    def test_filigrane_reste_visible_sur_fond_clair_et_fonce(self):
        for couleur in ((230, 230, 220), (30, 35, 35)):
            with self.subTest(couleur=couleur):
                original = Image.new("RGB", (800, 560), couleur)
                source = io.BytesIO()
                original.save(source, "JPEG")
                with Image.open(io.BytesIO(apercu_filigrane(source.getvalue()))) as fichier:
                    apercu = fichier.convert("RGB")
                difference = ImageChops.difference(original, apercu)
                pixels_marques = sum(1 for pixel in difference.getdata() if max(pixel) > 40)
                proportion = pixels_marques / (original.width * original.height)
                self.assertGreater(proportion, 0.02)
                self.assertLess(proportion, 0.08)


if __name__ == "__main__":
    unittest.main()

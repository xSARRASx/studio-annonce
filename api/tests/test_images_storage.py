"""La photo importée doit rester exploitable sans saturer le stockage."""
import io
import unittest

from PIL import Image

from app.images import preparer_envoi_ia


class TestPhotoSource(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()

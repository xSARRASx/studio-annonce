"""Le fichier final garde l'ordre confirmé et reste lisible après assemblage."""
from pathlib import Path
import subprocess
import tempfile
import unittest

import imageio_ffmpeg

from app.video_montage import assembler


class MontageTest(unittest.TestCase):
    def test_deux_plans_dans_l_ordre_dix_secondes_et_decodables(self):
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        with tempfile.TemporaryDirectory() as dossier:
            clips = []
            for index, couleur in enumerate(("red", "blue")):
                chemin = Path(dossier) / f"source-{index}.mp4"
                subprocess.run([exe, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "lavfi", "-i", f"color=c={couleur}:s=96x64:r=24:d=5",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", str(chemin)],
                    check=True, timeout=15, capture_output=True)
                clips.append(chemin.read_bytes())
            resultat = Path(dossier) / "resultat.mp4"
            resultat.write_bytes(assembler(clips))
            lecteur = imageio_ffmpeg.read_frames(str(resultat))
            try:
                infos = next(lecteur)
                self.assertEqual(infos["size"], (1280, 720))
                self.assertAlmostEqual(infos["duration"], 10, delta=.15)
            finally:
                lecteur.close()
            for seconde, canal in ((1, 0), (6, 2)):
                lecteur = imageio_ffmpeg.read_frames(str(resultat), input_params=["-ss", str(seconde)])
                try:
                    next(lecteur)
                    frame = next(lecteur)
                    centre = (360 * 1280 + 640) * 3
                    pixel = frame[centre:centre + 3]
                    self.assertGreater(pixel[canal], 200)
                    self.assertLess(pixel[2 if canal == 0 else 0], 30)
                finally:
                    lecteur.close()
            subprocess.run([exe, "-nostdin", "-v", "error", "-i", str(resultat), "-f", "null", "-"],
                check=True, timeout=30, capture_output=True)

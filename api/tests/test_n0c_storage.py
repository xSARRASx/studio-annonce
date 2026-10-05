"""Les fichiers clients sur N0C Storage restent dans Private et gardent leurs clés logiques."""
import unittest
from unittest.mock import MagicMock, patch
from urllib.parse import urlsplit

from fastapi.testclient import TestClient

from app import stockage
from app.main import app


class TestN0CStorage(unittest.TestCase):
    def test_prefixe_prive_obligatoire_et_cles_saines(self):
        with patch.multiple(stockage.reglages, S3_ENDPOINT_URL="https://ht2-storage.n0c.com:5443",
                            S3_KEY_PREFIX="Private/studio-annonce"):
            self.assertEqual(stockage._cle_s3("compte/photo/original.jpg"),
                             "Private/studio-annonce/compte/photo/original.jpg")
            for cle in ("../original.jpg", "/original.jpg", "compte//original.jpg"):
                with self.subTest(cle=cle), self.assertRaises(ValueError):
                    stockage._cle_s3(cle)
        with patch.multiple(stockage.reglages, S3_ENDPOINT_URL="https://ht2-storage.n0c.com:5443",
                            S3_KEY_PREFIX="Public/studio-annonce"):
            with self.assertRaises(RuntimeError):
                stockage._cle_s3("original.jpg")

    def test_lecture_ecriture_liens_et_suppression_utilisent_private(self):
        client = MagicMock()
        client.get_object.return_value = {"Body": MagicMock(read=lambda: b"photo")}
        with patch.multiple(stockage.reglages, S3_ACCESS_KEY_ID="id", S3_SECRET_ACCESS_KEY="secret",
                            S3_BUCKET="compte", S3_ENDPOINT_URL="https://ht2-storage.n0c.com:5443",
                            S3_KEY_PREFIX="Private/studio-annonce", AWS_REGION="ht2-storage"), \
             patch.object(stockage, "_s3", return_value=client):
            self.assertEqual(stockage.ecrire("photo/original.jpg", b"photo", "image/jpeg"), "photo/original.jpg")
            self.assertEqual(stockage.lire("photo/original.jpg"), b"photo")
            public = stockage.url_publique("photo/original.jpg")
            prive = stockage.url_privee("photo/original.jpg")
            stockage.supprimer("photo/original.jpg")

        cle = "Private/studio-annonce/photo/original.jpg"
        self.assertEqual(client.put_object.call_args.kwargs["Key"], cle)
        self.assertEqual(client.get_object.call_args.kwargs["Key"], cle)
        self.assertIn("/fichiers/photo/original.jpg?", public)
        self.assertIn("/fichiers/photo/original.jpg?", prive)
        client.generate_presigned_url.assert_not_called()
        self.assertEqual(client.delete_object.call_args.kwargs["Key"], cle)

    def test_site_sert_photo_privee_et_video_par_plages(self):
        contenu = b"video-test"
        flux = MagicMock()
        flux.iter_chunks.return_value = iter([contenu])
        objet = {"Body": flux, "ContentType": "video/mp4", "ContentLength": len(contenu)}
        with patch.multiple(stockage.reglages, S3_ACCESS_KEY_ID="id", S3_SECRET_ACCESS_KEY="secret",
                            S3_BUCKET="compte", S3_ENDPOINT_URL="https://ht2-storage.n0c.com:5443",
                            S3_KEY_PREFIX="Private/studio-annonce", AWS_REGION="ht2-storage",
                            URL_PUBLIQUE_API="http://testserver"), \
             patch.object(stockage, "ouvrir_flux_s3", return_value=objet) as ouvrir:
            adresse = stockage.url_privee("video/clip.mp4")
            chemin = urlsplit(adresse).path + "?" + urlsplit(adresse).query
            with TestClient(app) as client:
                reponse = client.get(chemin)
                self.assertEqual(reponse.status_code, 200)
                self.assertEqual(reponse.content, contenu)
                self.assertEqual(reponse.headers["content-type"], "video/mp4")
                self.assertEqual(reponse.headers["accept-ranges"], "bytes")
                self.assertEqual(reponse.headers["cache-control"], "private, no-store")

                flux.iter_chunks.return_value = iter([b"vide"])
                objet["ContentRange"] = "bytes 0-3/10"
                objet["ContentLength"] = 4
                reponse = client.get(chemin, headers={"Range": "bytes=0-3"})
                self.assertEqual(reponse.status_code, 206)
                self.assertEqual(reponse.content, b"vide")
                self.assertEqual(reponse.headers["content-range"], "bytes 0-3/10")
                ouvrir.assert_called_with("video/clip.mp4", "bytes=0-3")

                self.assertEqual(client.get(chemin + "a").status_code, 404)
                self.assertEqual(client.get(chemin, headers={"Range": "bytes=0-1,4-5"}).status_code, 416)


if __name__ == "__main__":
    unittest.main()

"""Les fichiers clients sur N0C Storage restent dans Private et gardent leurs clés logiques."""
import unittest
from unittest.mock import MagicMock, patch

from app import stockage


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
            stockage.url_publique("photo/original.jpg")
            stockage.url_privee("photo/original.jpg")
            stockage.supprimer("photo/original.jpg")

        cle = "Private/studio-annonce/photo/original.jpg"
        self.assertEqual(client.put_object.call_args.kwargs["Key"], cle)
        self.assertEqual(client.get_object.call_args.kwargs["Key"], cle)
        for appel in client.generate_presigned_url.call_args_list:
            self.assertEqual(appel.kwargs["Params"]["Key"], cle)
        self.assertEqual(client.delete_object.call_args.kwargs["Key"], cle)


if __name__ == "__main__":
    unittest.main()

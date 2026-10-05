"""Copie vérifiée des fichiers locaux vers le stockage privé S3, sans supprimer la source.

À lancer depuis api/ après avoir configuré les variables S3 dans .env :
    python scripts/migrer_stockage_n0c.py             # inventaire seulement
    python scripts/migrer_stockage_n0c.py --appliquer # copie et relecture de chaque fichier
"""
from __future__ import annotations

import argparse
import hashlib
import mimetypes
import sys
from pathlib import Path
from botocore.exceptions import ClientError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import stockage  # noqa: E402
from app.config import reglages  # noqa: E402


def migrer(appliquer: bool) -> tuple[int, int]:
    if not stockage.utilise_s3():
        raise RuntimeError("Configurer S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT_URL et AWS_REGION.")
    if not reglages.S3_ENDPOINT_URL or not reglages.S3_ENDPOINT_URL.startswith("https://"):
        raise RuntimeError("Configurer l'hôte HTTPS N0C Storage avant la migration.")
    if not reglages.S3_KEY_PREFIX.startswith("Private/"):
        raise RuntimeError("Le stockage N0C doit viser Private/studio-annonce, jamais Public.")
    racine = stockage.DOSSIER_LOCAL.resolve()
    fichiers = [p for p in racine.rglob("*") if p.is_file()]
    if any(p.is_symlink() or not p.resolve().is_relative_to(racine) for p in fichiers):
        raise RuntimeError("Un lien symbolique ou un chemin externe interdit la migration.")
    total = sum(p.stat().st_size for p in fichiers)
    print(f"Inventaire : {len(fichiers)} fichiers, {total} octets. Source locale conservée.")
    if not appliquer:
        return len(fichiers), total

    client = stockage._s3()
    verifies = 0
    for chemin in fichiers:
        cle = chemin.relative_to(racine).as_posix()
        contenu = chemin.read_bytes()
        cle_s3 = stockage._cle_s3(cle)
        identique = False
        try:
            distant = client.get_object(Bucket=reglages.S3_BUCKET, Key=cle_s3)["Body"].read()
            identique = hashlib.sha256(distant).digest() == hashlib.sha256(contenu).digest()
        except ClientError as erreur:
            if erreur.response.get("Error", {}).get("Code") not in ("404", "NoSuchKey", "NotFound"):
                raise
        if not identique:
            mime = mimetypes.guess_type(cle)[0] or "application/octet-stream"
            client.put_object(Bucket=reglages.S3_BUCKET, Key=cle_s3, Body=contenu, ContentType=mime)
            distant = client.get_object(Bucket=reglages.S3_BUCKET, Key=cle_s3)["Body"].read()
            if hashlib.sha256(distant).digest() != hashlib.sha256(contenu).digest():
                raise RuntimeError(f"Échec de vérification : {cle}")
        verifies += 1
    print(f"Copie terminée : {verifies}/{len(fichiers)} fichiers relus et identiques. Source locale conservée.")
    return verifies, total


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--appliquer", action="store_true", help="copier les fichiers après inventaire")
    arguments = analyseur.parse_args()
    migrer(arguments.appliquer)

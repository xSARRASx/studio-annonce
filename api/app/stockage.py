"""Stockage des fichiers : Amazon S3 ou Cloudflare R2 en production, un dossier local sinon.
Le serveur ne garde jamais un fichier lourd chez lui : tout part au stockage, on ne manipule que des clés."""
from __future__ import annotations

import os
from pathlib import Path

from .config import reglages

DOSSIER_LOCAL = Path(__file__).resolve().parent.parent / "stockage-local"


def _s3():
    import boto3
    commun = dict(aws_access_key_id=reglages.S3_ACCESS_KEY_ID, aws_secret_access_key=reglages.S3_SECRET_ACCESS_KEY)
    if reglages.R2_ACCOUNT_ID:
        return boto3.client("s3", endpoint_url=f"https://{reglages.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                            region_name="auto", **commun)
    return boto3.client("s3", region_name=reglages.AWS_REGION, **commun)


def utilise_s3() -> bool:
    return bool(reglages.S3_ACCESS_KEY_ID and (reglages.AWS_REGION or reglages.R2_ACCOUNT_ID))


def ecrire(cle: str, donnees: bytes, type_mime: str) -> str:
    if utilise_s3():
        _s3().put_object(Bucket=reglages.S3_BUCKET, Key=cle, Body=donnees, ContentType=type_mime)
    else:
        chemin = DOSSIER_LOCAL / cle
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_bytes(donnees)
    return cle


def lire(cle: str) -> bytes:
    if utilise_s3():
        return _s3().get_object(Bucket=reglages.S3_BUCKET, Key=cle)["Body"].read()
    return (DOSSIER_LOCAL / cle).read_bytes()


def url_publique(cle: str) -> str:
    """Adresse que le site ou l'appli affiche. En prod : le stockage ou son CDN, jamais notre serveur."""
    if not cle:
        return ""
    if utilise_s3() and reglages.S3_PUBLIC_URL:
        return f"{reglages.S3_PUBLIC_URL.rstrip('/')}/{cle}"
    if utilise_s3() and reglages.AWS_REGION:
        return f"https://{reglages.S3_BUCKET}.s3.{reglages.AWS_REGION}.amazonaws.com/{cle}"
    return f"{reglages.URL_PUBLIQUE_API}/fichiers/{cle}"


def supprimer(cle: str) -> None:
    if utilise_s3():
        _s3().delete_object(Bucket=reglages.S3_BUCKET, Key=cle)
    else:
        try:
            os.remove(DOSSIER_LOCAL / cle)
        except FileNotFoundError:
            pass

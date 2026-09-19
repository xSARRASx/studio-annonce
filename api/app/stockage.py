"""Stockage des fichiers : Cloudflare R2 en production, un dossier local sinon.
Le serveur ne garde jamais un fichier lourd chez lui : tout part au stockage, on ne manipule que des clés."""
from __future__ import annotations

import os
from pathlib import Path

from .config import reglages

DOSSIER_LOCAL = Path(__file__).resolve().parent.parent / "stockage-local"


def _r2():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=f"https://{reglages.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=reglages.R2_ACCESS_KEY_ID,
        aws_secret_access_key=reglages.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def utilise_r2() -> bool:
    return bool(reglages.R2_ACCOUNT_ID and reglages.R2_ACCESS_KEY_ID)


def ecrire(cle: str, donnees: bytes, type_mime: str) -> str:
    if utilise_r2():
        _r2().put_object(Bucket=reglages.R2_BUCKET, Key=cle, Body=donnees, ContentType=type_mime)
    else:
        chemin = DOSSIER_LOCAL / cle
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_bytes(donnees)
    return cle


def lire(cle: str) -> bytes:
    if utilise_r2():
        return _r2().get_object(Bucket=reglages.R2_BUCKET, Key=cle)["Body"].read()
    return (DOSSIER_LOCAL / cle).read_bytes()


def url_publique(cle: str) -> str:
    """Adresse que le site ou l'appli affiche. En prod : le CDN Cloudflare, jamais notre serveur."""
    if not cle:
        return ""
    if utilise_r2() and reglages.R2_PUBLIC_URL:
        return f"{reglages.R2_PUBLIC_URL.rstrip('/')}/{cle}"
    return f"{reglages.URL_PUBLIQUE_API}/fichiers/{cle}"


def supprimer(cle: str) -> None:
    if utilise_r2():
        _r2().delete_object(Bucket=reglages.R2_BUCKET, Key=cle)
    else:
        try:
            os.remove(DOSSIER_LOCAL / cle)
        except FileNotFoundError:
            pass

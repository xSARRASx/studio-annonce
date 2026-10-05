"""Stockage privé S3 compatible ou dossier local, sans exposition publique des originaux."""
from __future__ import annotations

import os
import hashlib
import hmac
import time
from pathlib import Path
from urllib.parse import urlsplit

from .config import reglages

DOSSIER_LOCAL = Path(__file__).resolve().parent.parent / "stockage-local"
DELAI_LIEN_LOCAL = 3600


def _s3():
    if reglages.S3_PUBLIC_URL:
        raise RuntimeError("Les photos nécessitent un stockage privé. Désactivez le domaine public du bucket avant de configurer les liens signés.")
    import boto3
    from botocore.config import Config
    commun = dict(aws_access_key_id=reglages.S3_ACCESS_KEY_ID, aws_secret_access_key=reglages.S3_SECRET_ACCESS_KEY)
    if reglages.S3_ENDPOINT_URL:
        adresse = urlsplit(reglages.S3_ENDPOINT_URL)
        if adresse.scheme != "https" or not adresse.hostname or adresse.username or adresse.password or adresse.path not in ("", "/") or adresse.query or adresse.fragment:
            raise RuntimeError("L'adresse du stockage privé doit être un hôte HTTPS sans identifiants ni chemin.")
        return boto3.client("s3", endpoint_url=reglages.S3_ENDPOINT_URL.rstrip("/"),
                            region_name=reglages.AWS_REGION or "us-east-1",
                            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}), **commun)
    if reglages.R2_ACCOUNT_ID:
        return boto3.client("s3", endpoint_url=f"https://{reglages.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                            region_name="auto", **commun)
    return boto3.client("s3", region_name=reglages.AWS_REGION, **commun)


def utilise_s3() -> bool:
    return bool(reglages.S3_ACCESS_KEY_ID and reglages.S3_SECRET_ACCESS_KEY and reglages.S3_BUCKET
                and (reglages.S3_ENDPOINT_URL or reglages.AWS_REGION or reglages.R2_ACCOUNT_ID))


def _cle_s3(cle: str) -> str:
    morceaux = cle.split("/")
    if not cle or cle.startswith("/") or any(m in ("", ".", "..") for m in morceaux):
        raise ValueError("Clé de fichier invalide.")
    prefixe = reglages.S3_KEY_PREFIX.strip("/")
    if prefixe and any(m in ("", ".", "..") for m in prefixe.split("/")):
        raise ValueError("Préfixe de stockage invalide.")
    hote = urlsplit(reglages.S3_ENDPOINT_URL).hostname if reglages.S3_ENDPOINT_URL else ""
    if hote and hote.endswith(".n0c.com"):
        if not prefixe.startswith("Private/"):
            raise RuntimeError("N0C Storage doit utiliser un dossier Private/ pour les créations des clients.")
    return f"{prefixe}/{cle}" if prefixe else cle


def ecrire(cle: str, donnees: bytes, type_mime: str) -> str:
    if utilise_s3():
        _s3().put_object(Bucket=reglages.S3_BUCKET, Key=_cle_s3(cle), Body=donnees, ContentType=type_mime)
    else:
        chemin = DOSSIER_LOCAL / cle
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_bytes(donnees)
    return cle


def lire(cle: str) -> bytes:
    if utilise_s3():
        return _s3().get_object(Bucket=reglages.S3_BUCKET, Key=_cle_s3(cle))["Body"].read()
    return (DOSSIER_LOCAL / cle).read_bytes()


def url_publique(cle: str) -> str:
    """Adresse temporaire du site : le navigateur n'accède jamais directement au stockage privé."""
    if not cle:
        return ""
    return _url_fichier_signe(cle, DELAI_LIEN_LOCAL)


def signer_lien_local(cle: str, expiration: int) -> str:
    message = f"{expiration}:{cle}".encode()
    return hmac.new(reglages.SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()


def url_privee(cle: str) -> str:
    """À appeler seulement après contrôle du compte et du droit au fichier propre."""
    return _url_fichier_signe(cle, 300)


def _url_fichier_signe(cle: str, duree: int) -> str:
    if not cle:
        return ""
    _cle_s3(cle)  # refuse les chemins ambigus avant de signer un lien
    expiration = int(time.time()) + duree
    return f"{reglages.URL_PUBLIQUE_API}/fichiers/{cle}?expiration={expiration}&signature={signer_lien_local(cle, expiration)}"


def lien_signe_valide(cle: str, expiration: int, signature: str) -> bool:
    try:
        _cle_s3(cle)
    except (ValueError, RuntimeError):
        return False
    return expiration >= int(time.time()) and hmac.compare_digest(signer_lien_local(cle, expiration), signature)


def ouvrir_flux_s3(cle: str, plage: str | None = None):
    """Ouvre un objet privé pour l'envoi progressif, sans charger une vidéo entière en mémoire."""
    arguments = {"Bucket": reglages.S3_BUCKET, "Key": _cle_s3(cle)}
    if plage:
        arguments["Range"] = plage
    return _s3().get_object(**arguments)


def chemin_local_signe(cle: str, expiration: int, signature: str) -> Path | None:
    if not lien_signe_valide(cle, expiration, signature):
        return None
    chemin = (DOSSIER_LOCAL / cle).resolve()
    if not chemin.is_relative_to(DOSSIER_LOCAL.resolve()):
        return None
    return chemin


def supprimer(cle: str) -> None:
    if utilise_s3():
        _s3().delete_object(Bucket=reglages.S3_BUCKET, Key=_cle_s3(cle))
    else:
        try:
            os.remove(DOSSIER_LOCAL / cle)
        except FileNotFoundError:
            pass

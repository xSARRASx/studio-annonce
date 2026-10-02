"""Client serveur Higgsfield pour une courte animation à partir d'une photo."""
from __future__ import annotations

from urllib.parse import urlsplit

import httpx

from .config import reglages

API = "https://api.higgsfield.ai"
MODELE = "bytedance/seedance-2.5/image-to-video"


def disponible() -> bool:
    return bool(reglages.VIDEO_ACTIVE and reglages.HF_KEY and ":" in reglages.HF_KEY)


def _entetes() -> dict[str, str]:
    if not reglages.HF_KEY or ":" not in reglages.HF_KEY:
        raise RuntimeError("La connexion vidéo n'est pas configurée.")
    return {"Authorization": f"Key {reglages.HF_KEY}"}


def _url_https(url: str) -> str:
    u = urlsplit(url)
    if u.scheme != "https" or not u.hostname or u.username or u.password or u.port not in (None, 443):
        raise RuntimeError("Adresse de fichier vidéo invalide.")
    return url


def _url_statut(url: str) -> str:
    u = urlsplit(_url_https(url))
    if u.hostname not in {"api.higgsfield.ai", "platform.higgsfield.ai"} or not u.path.startswith("/requests/") or not u.path.endswith("/status") or u.query or u.fragment:
        raise RuntimeError("Adresse de suivi vidéo invalide.")
    return url


async def demarrer(image_jpeg: bytes, demande: str, duree: int, cle_idempotence: str) -> dict:
    """Recette isolée : prépare la photo puis soumet la génération."""
    image_url = await preparer_image(image_jpeg)
    return await soumettre(image_url, demande, duree, cle_idempotence)


async def preparer_image(image_jpeg: bytes) -> str:
    """Charge la source sur le stockage du fournisseur, sans génération payante."""
    if not image_jpeg or len(image_jpeg) > 10 * 1024 * 1024:
        raise ValueError("La photo est trop lourde pour une vidéo.")
    async with httpx.AsyncClient(timeout=35, follow_redirects=False) as client:
        upload = await client.post(f"{API}/files/generate-upload-url", headers=_entetes(), json={"content_type": "image/jpeg"})
        upload.raise_for_status()
        lien = upload.json()
        destination = _url_https(lien["upload_url"])
        image_url = _url_https(lien["public_url"])
        # L'URL présignée porte ses propres droits : ne jamais y envoyer la clé API.
        entetes_upload = lien.get("upload_headers", {})
        if not isinstance(entetes_upload, dict) or any(k.lower() == "authorization" for k in entetes_upload):
            raise RuntimeError("En-têtes d'envoi image invalides.")
        envoi = await client.put(destination, content=image_jpeg, headers=entetes_upload)
        envoi.raise_for_status()
    return image_url


async def soumettre(image_url: str, demande: str, duree: int, cle_idempotence: str) -> dict:
    """Répéter exactement cet appel avec la même clé ne crée pas un second clip."""
    if duree not in (5, 10, 20, 30):
        raise ValueError("Durée vidéo non proposée.")
    if not demande.strip() or len(demande) > 4000:
        raise ValueError("Décrivez votre vidéo en 4 000 caractères maximum.")
    _url_https(image_url)
    async with httpx.AsyncClient(timeout=35, follow_redirects=False) as client:
        reponse = await client.post(f"{API}/{MODELE}", headers={**_entetes(), "Idempotency-Key": cle_idempotence}, json={
            "image_url": image_url, "prompt": demande.strip(), "duration": duree,
            "resolution": "720p", "output_format": "mp4", "generate_audio": False,
        })
        reponse.raise_for_status()
    resultat = reponse.json()
    if not resultat.get("request_id") or not resultat.get("status_url"):
        raise RuntimeError("Higgsfield n'a pas renvoyé de suivi pour la vidéo.")
    # Conserver d'abord le reçu. Une URL de suivi inattendue doit pouvoir être
    # diagnostiquée sans perdre l'identifiant d'une génération déjà facturée.
    return {"request_id": resultat["request_id"], "status_url": resultat["status_url"]}


async def etat(status_url: str) -> dict:
    async with httpx.AsyncClient(timeout=25, follow_redirects=False) as client:
        reponse = await client.get(_url_statut(status_url), headers=_entetes())
        reponse.raise_for_status()
    resultat = reponse.json()
    if resultat.get("status") not in {"queued", "in_progress", "completed", "failed", "nsfw", "canceled"}:
        raise RuntimeError("État vidéo inconnu.")
    return resultat


async def fichier_resultat(url: str) -> bytes:
    """Copie le MP4 achevé vers le stockage privé avant expiration du fournisseur."""
    adresse = _url_https(url)
    hote = urlsplit(adresse).hostname or ""
    if hote not in {"d3u0tzju9qaucj.cloudfront.net"}:
        raise RuntimeError("Adresse vidéo invalide.")
    contenu = bytearray()
    async with httpx.AsyncClient(timeout=90, follow_redirects=False) as client:
        async with client.stream("GET", adresse) as reponse:
            reponse.raise_for_status()
            if reponse.headers.get("content-type", "").split(";", 1)[0].strip().lower() not in {"video/mp4", "application/octet-stream"}:
                raise RuntimeError("Higgsfield n'a pas fourni un MP4.")
            async for bloc in reponse.aiter_bytes():
                contenu.extend(bloc)
                if len(contenu) > 100 * 1024 * 1024:
                    raise RuntimeError("La vidéo dépasse la taille autorisée.")
    if not contenu or contenu[4:8] != b"ftyp":
        raise RuntimeError("Le résultat vidéo est illisible.")
    return bytes(contenu)

"""Retouche d'image par OpenAI (GPT Image). Même contrat que gemini.retoucher : une photo entre, une photo sort."""
from __future__ import annotations

import base64
import io
import math

import httpx
from PIL import Image

from .config import reglages
from .usage import enregistrer
from .gemini import REGLE_RETOUCHE

API = "https://api.openai.com/v1/images/edits"


def _cle() -> str:
    if not reglages.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY manquante dans le .env")
    return reglages.OPENAI_API_KEY


def _taille_sortie(image_jpeg: bytes, bord_max: int) -> str:
    """Conserver le ratio et respecter le minimum de pixels exigé par GPT Image 2.5."""
    with Image.open(io.BytesIO(image_jpeg)) as im:
        l, h = im.size
    ratio = l / h
    if not 1 / 3 <= ratio <= 3:
        raise ValueError("Le cadrage de cette photo est trop panoramique pour la retouche IA.")
    grand = max(l, h)
    petit = min(l, h)
    cible = max(bord_max, math.ceil(math.sqrt(655_360 * grand / petit) / 16) * 16)
    while True:
        autre = max(math.ceil(cible / 3 / 16) * 16, round((cible * petit / grand) / 16) * 16)
        if cible * autre >= 655_360:
            break
        cible += 16
    if cible > 3840 or cible * autre > 8_294_400:
        raise ValueError("Le format de cette photo dépasse les limites de retouche IA.")
    return f"{cible}x{autre}" if l >= h else f"{autre}x{cible}"


async def retoucher(image_jpeg: bytes, consigne: str, hd: bool = False) -> bytes:
    champs = {
        "model": reglages.MODELE_OPENAI_IMAGE,
        "prompt": REGLE_RETOUCHE + consigne,
        "quality": reglages.QUALITE_OPENAI_HD if hd else reglages.QUALITE_OPENAI_APERCU,
        "size": _taille_sortie(image_jpeg, 2048 if hd else 1024),
        "output_format": "jpeg",
        "output_compression": "92",
    }
    async with httpx.AsyncClient(timeout=240) as client:
        rep = await client.post(API, headers={"Authorization": f"Bearer {_cle()}"}, data=champs,
                                files=[("image[]", ("photo.jpg", image_jpeg, "image/jpeg"))])
    donnees = rep.json()
    if rep.status_code != 200:
        raise RuntimeError(donnees.get("error", {}).get("message", rep.text[:200]))
    enregistrer(reglages.MODELE_OPENAI_IMAGE, "hd" if hd else "apercu", donnees.get("usage"), rep.headers.get("x-request-id"))
    try:
        return base64.b64decode(donnees["data"][0]["b64_json"])
    except (KeyError, IndexError):
        raise RuntimeError("OpenAI n'a pas renvoyé d'image.")

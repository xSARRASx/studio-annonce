"""Retouche d'image par OpenAI (GPT Image). Même contrat que gemini.retoucher : une photo entre, une photo sort."""
from __future__ import annotations

import base64
import io

import httpx
from PIL import Image

from .config import reglages
from .gemini import REGLE_RETOUCHE

API = "https://api.openai.com/v1/images/edits"


def _cle() -> str:
    if not reglages.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY manquante dans le .env")
    return reglages.OPENAI_API_KEY


def _taille_sortie(image_jpeg: bytes, bord_max: int) -> str:
    """Même cadrage que l'original : on garde son ratio, le grand côté vaut bord_max, multiples de 16."""
    with Image.open(io.BytesIO(image_jpeg)) as im:
        l, h = im.size
    echelle = bord_max / max(l, h)
    arrondi = lambda v: max(16, int(round(v * echelle / 16)) * 16)
    return f"{arrondi(l)}x{arrondi(h)}"


async def retoucher(image_jpeg: bytes, consigne: str, hd: bool = False) -> bytes:
    champs = {
        "model": reglages.MODELE_OPENAI_IMAGE,
        "prompt": REGLE_RETOUCHE + consigne,
        "input_fidelity": "high",          # garde la pièce, les matières et les détails de la photo d'origine
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
    try:
        return base64.b64decode(donnees["data"][0]["b64_json"])
    except (KeyError, IndexError):
        raise RuntimeError("OpenAI n'a pas renvoyé d'image.")

"""Retouche d'image par OpenAI (GPT Image). Même contrat que gemini.retoucher : une photo entre, une photo sort."""
from __future__ import annotations

import base64
import io
import math
from dataclasses import dataclass

import httpx
from PIL import Image

from .config import reglages
from .usage import enregistrer
from .consignes_photo import REGLE_RETOUCHE

API = "https://api.openai.com/v1/images/edits"


@dataclass(frozen=True)
class RetoucheMesuree:
    image: bytes
    modele: str
    operation: str
    usage: dict
    requete_id: str | None


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


async def retoucher_avec_mesure(image_jpeg: bytes, consigne: str, hd: bool = False) -> RetoucheMesuree:
    """Effectue une retouche, la journalise et rend aussi sa consommation au contrôle privé."""
    operation = "hd" if hd else "apercu"
    champs = {
        "model": reglages.MODELE_OPENAI_IMAGE,
        "prompt": REGLE_RETOUCHE + consigne,
        "quality": reglages.QUALITE_OPENAI_HD if hd else reglages.QUALITE_OPENAI_APERCU,
        "size": _taille_sortie(image_jpeg, 2048),
        "output_format": "jpeg",
        "output_compression": "92",
    }
    async with httpx.AsyncClient(timeout=240) as client:
        rep = await client.post(API, headers={"Authorization": f"Bearer {_cle()}"}, data=champs,
                                files=[("image[]", ("photo.jpg", image_jpeg, "image/jpeg"))])
    donnees = rep.json()
    if rep.status_code != 200:
        raise RuntimeError(donnees.get("error", {}).get("message", rep.text[:200]))
    usage = donnees.get("usage") if isinstance(donnees.get("usage"), dict) else {}
    requete_id = rep.headers.get("x-request-id")
    enregistrer(reglages.MODELE_OPENAI_IMAGE, operation, usage, requete_id)
    try:
        image = base64.b64decode(donnees["data"][0]["b64_json"], validate=True)
    except (KeyError, IndexError, ValueError):
        raise RuntimeError("OpenAI n'a pas renvoyé d'image.")
    return RetoucheMesuree(image, reglages.MODELE_OPENAI_IMAGE, operation, usage, requete_id)


async def retoucher(image_jpeg: bytes, consigne: str, hd: bool = False) -> bytes:
    return (await retoucher_avec_mesure(image_jpeg, consigne, hd)).image

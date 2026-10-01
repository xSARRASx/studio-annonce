"""Tout ce qui parle à Gemini : l'analyse d'une photo, la retouche, le réalisateur automatique."""
from __future__ import annotations

import base64
import json

import httpx

from .config import reglages
from .consignes_photo import CONSIGNE_ANALYSE, REGLE_RETOUCHE, consigne_complete, contexte_reformulation

API = "https://generativelanguage.googleapis.com/v1beta/models/"

def _cle() -> str:
    if not reglages.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY manquante dans le .env")
    return reglages.GEMINI_API_KEY


async def _appel(modele: str, corps: dict, delai: float = 120) -> dict:
    async with httpx.AsyncClient(timeout=delai) as client:
        rep = await client.post(f"{API}{modele}:generateContent", json=corps,
                                headers={"x-goog-api-key": _cle(), "Content-Type": "application/json"})
    donnees = rep.json()
    if rep.status_code != 200:
        raise RuntimeError(donnees.get("error", {}).get("message", rep.text[:200]))
    return donnees


async def analyser(image_jpeg: bytes) -> dict:
    corps = {
        "contents": [{"parts": [
            {"text": CONSIGNE_ANALYSE},
            {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(image_jpeg).decode()}},
        ]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    rep = await _appel(reglages.MODELE_ANALYSE, corps)
    texte = "".join(p.get("text", "") for p in rep["candidates"][0]["content"]["parts"])
    return json.loads(texte)


async def retoucher(image_jpeg: bytes, consigne: str, hd: bool = False) -> bytes:
    modele = reglages.MODELE_HD if hd else reglages.MODELE_APERCU
    corps = {
        "contents": [{"parts": [
            {"text": REGLE_RETOUCHE + consigne},
            {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(image_jpeg).decode()}},
        ]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"],
                             **({"imageConfig": {"imageSize": "2K"}} if hd else {})},
    }
    rep = await _appel(modele, corps, delai=180)
    parts = rep.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    img = next((p for p in parts if "inlineData" in p), None)
    if not img:
        texte = " ".join(p.get("text", "") for p in parts)
        raise RuntimeError("Le modèle n'a pas renvoyé d'image. " + texte[:200])
    return base64.b64decode(img["inlineData"]["data"])


async def reformuler_demande(analyse: dict | None, historique: list[str], demande: str) -> str:
    """Le client écrit « enlève le vélo là » ; on en fait une consigne précise pour le modèle d'image."""
    corps = {
        "contents": [{"parts": [{"text": contexte_reformulation(analyse, historique, demande)}]}],
    }
    rep = await _appel(reglages.MODELE_ANALYSE, corps)
    texte = "".join(p.get("text", "") for p in rep["candidates"][0]["content"]["parts"]).strip()
    return consigne_complete(demande, texte)

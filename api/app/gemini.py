"""Tout ce qui parle à Gemini : l'analyse d'une photo, la retouche, le réalisateur automatique."""
from __future__ import annotations

import base64
import json

import httpx

from .config import reglages

API = "https://generativelanguage.googleapis.com/v1beta/models/"

REGLE_RETOUCHE = (
    "Tu es un retoucheur photo immobilier professionnel. La géométrie de la pièce ne change jamais "
    "(murs, sol, fenêtres, portes, meubles fixes, perspective, cadrage identique). Le résultat doit rester "
    "une vraie photo, photoréaliste, sans aucun aspect artificiel. Applique uniquement la consigne suivante : "
)

CONSIGNE_ANALYSE = """Tu es le retoucheur photo d'un service pour bailleurs et hôtes qui veulent une annonce parfaite.
Regarde cette photo prise au téléphone et réponds UNIQUEMENT en JSON avec ces clés :
- "piece" : la pièce en 2 ou 3 mots ;
- "defauts" : liste courte de ce qui gêne pour une annonce (désordre, objets personnels, parties du corps, cadrage penché, contre-jour, pièce sombre...) ;
- "consigne" : la consigne de retouche complète, en français, pour obtenir la version « annonce » : lumière de photographe pro, verticales redressées, désordre et objets personnels retirés (pieds, mains, valises, vêtements, câbles), lit fait s'il y en a un, surfaces propres. Interdit : changer le cadrage, déplacer ou modifier murs, sol, fenêtres, portes, meubles fixes, dimensions ;
- "question" : UNE question courte et optionnelle au client s'il y a un vrai choix à faire (sinon chaîne vide)."""


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
    contexte = json.dumps(analyse or {}, ensure_ascii=False)
    corps = {
        "contents": [{"parts": [{"text": (
            "Tu es l'assistant d'un retoucheur photo immobilier. Voici ce que l'IA a vu sur la photo : " + contexte +
            "\nRetouches déjà appliquées, dans l'ordre : " + (" | ".join(historique) or "aucune") +
            "\nLe client demande maintenant : « " + demande + " »\n"
            "Écris UNIQUEMENT la consigne de retouche, en français, précise et complète, destinée à un modèle d'image, "
            "qui applique cette demande en gardant tout le reste identique. Une à trois phrases, sans commentaire.")}]}],
    }
    rep = await _appel(reglages.MODELE_ANALYSE, corps)
    return "".join(p.get("text", "") for p in rep["candidates"][0]["content"]["parts"]).strip()

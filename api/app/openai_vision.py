"""Analyse et reformulation des demandes photo avec un modèle texte/vision OpenAI."""
from __future__ import annotations

import base64
import json

import httpx

from .config import reglages
from .gemini import CONSIGNE_ANALYSE

API = "https://api.openai.com/v1/responses"

ANALYSE_SCHEMA = {
    "type": "object",
    "properties": {
        "piece": {"type": "string"},
        "defauts": {"type": "array", "items": {"type": "string"}},
        "consigne": {"type": "string"},
        "question": {"type": "string"},
    },
    "required": ["piece", "defauts", "consigne", "question"],
    "additionalProperties": False,
}


def _texte(reponse: dict) -> str:
    """L'API HTTP renvoie des items ; output_text est surtout un confort des SDK."""
    if reponse.get("status") != "completed":
        raise RuntimeError("L'analyse photo n'a pas été terminée.")
    morceaux = [contenu.get("text", "")
                for item in reponse.get("output", []) if item.get("type") == "message"
                for contenu in item.get("content", []) if contenu.get("type") == "output_text"]
    texte = "".join(morceaux).strip()
    if not texte:
        raise RuntimeError("L'analyse photo n'a pas renvoyé de texte.")
    return texte


async def _appel(corps: dict) -> str:
    if not reglages.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY manquante dans le .env")
    async with httpx.AsyncClient(timeout=90) as client:
        rep = await client.post(API, json={"model": reglages.MODELE_OPENAI_ANALYSE, "store": False, **corps},
                                headers={"Authorization": f"Bearer {reglages.OPENAI_API_KEY}"})
    try:
        donnees = rep.json()
    except ValueError as erreur:
        raise RuntimeError("Le service d'analyse photo a renvoyé une réponse illisible.") from erreur
    if rep.status_code != 200:
        raise RuntimeError(donnees.get("error", {}).get("message", "L'analyse photo est indisponible."))
    return _texte(donnees)


async def analyser(image_jpeg: bytes) -> dict:
    image = "data:image/jpeg;base64," + base64.b64encode(image_jpeg).decode("ascii")
    texte = await _appel({
        "input": [{"role": "user", "content": [
            {"type": "input_text", "text": CONSIGNE_ANALYSE},
            {"type": "input_image", "image_url": image, "detail": "high"},
        ]}],
        "text": {"format": {"type": "json_schema", "name": "analyse_photo_immobiliere",
                            "strict": True, "schema": ANALYSE_SCHEMA}},
    })
    resultat = json.loads(texte)
    if not isinstance(resultat, dict) or not all(cle in resultat for cle in ANALYSE_SCHEMA["required"]):
        raise RuntimeError("L'analyse photo est incomplète.")
    return resultat


async def reformuler_demande(analyse: dict | None, historique: list[str], demande: str) -> str:
    contexte = json.dumps(analyse or {}, ensure_ascii=False)
    texte = await _appel({"input": [{"role": "user", "content": (
        "Tu es un retoucheur photo immobilier. Décris en français, en une à trois phrases, "
        "la retouche demandée pour un modèle d'image. Préserve la géométrie, les portes, "
        "fenêtres et équipements fixes. Ne réponds que par la consigne.\n"
        f"Analyse : {contexte}\nHistorique : {' | '.join(historique) or 'aucun'}\n"
        f"Nouvelle demande : {demande}"
    )}]})
    return texte[:4000]

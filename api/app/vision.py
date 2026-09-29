"""Choix du fournisseur pour comprendre une photo et ses demandes."""
from __future__ import annotations

from . import gemini, openai_vision
from .config import reglages


def disponible() -> bool:
    return reglages.IA_ACTIVE and bool(reglages.OPENAI_API_KEY or reglages.GEMINI_API_KEY)


async def analyser(image_jpeg: bytes) -> dict:
    if reglages.OPENAI_API_KEY:
        return await openai_vision.analyser(image_jpeg)
    return await gemini.analyser(image_jpeg)


async def reformuler_demande(analyse: dict | None, historique: list[str], demande: str) -> str:
    if reglages.OPENAI_API_KEY:
        return await openai_vision.reformuler_demande(analyse, historique, demande)
    return await gemini.reformuler_demande(analyse, historique, demande)

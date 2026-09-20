"""Choisit qui retouche : OpenAI (GPT Image) par défaut, Gemini en secours. L'analyse reste chez Gemini."""
from .config import reglages
from . import gemini, openai_images


async def retoucher(image_jpeg: bytes, consigne: str, hd: bool = False) -> bytes:
    if reglages.FOURNISSEUR_IMAGE == "openai":
        return await openai_images.retoucher(image_jpeg, consigne, hd)
    return await gemini.retoucher(image_jpeg, consigne, hd)

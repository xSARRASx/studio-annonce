"""Choisit le fournisseur de retouche configuré."""
from .config import reglages
from . import gemini, openai_images


def disponible() -> bool:
    return reglages.IA_ACTIVE and bool(reglages.OPENAI_API_KEY if reglages.FOURNISSEUR_IMAGE == "openai" else reglages.GEMINI_API_KEY)


async def retoucher(image_jpeg: bytes, consigne: str, hd: bool = False) -> bytes:
    if reglages.FOURNISSEUR_IMAGE == "openai":
        return await openai_images.retoucher(image_jpeg, consigne, hd)
    return await gemini.retoucher(image_jpeg, consigne, hd)

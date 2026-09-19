"""Tailles, formats et filigrane. Trois tailles par photo : vignette, aperçu, HD.
L'aperçu que le client voit avant de payer est réduit ET filigrané en travers : une capture ne sert à rien."""
from __future__ import annotations

import io

from PIL import Image, ImageDraw, ImageFont, ImageOps

from .config import reglages

POLICE = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def ouvrir(donnees: bytes) -> Image.Image:
    im = Image.open(io.BytesIO(donnees))
    im = ImageOps.exif_transpose(im)  # une photo de téléphone porte son orientation dans ses métadonnées
    return im.convert("RGB")


def reduire(im: Image.Image, largeur_max: int) -> Image.Image:
    if im.width <= largeur_max:
        return im.copy()
    h = round(im.height * largeur_max / im.width)
    return im.resize((largeur_max, h), Image.LANCZOS)


def en_jpeg(im: Image.Image, qualite: int = 90) -> bytes:
    sortie = io.BytesIO()
    im.save(sortie, "JPEG", quality=qualite, optimize=True)
    return sortie.getvalue()


def en_webp(im: Image.Image, qualite: int = 82) -> bytes:
    sortie = io.BytesIO()
    im.save(sortie, "WEBP", quality=qualite, method=4)
    return sortie.getvalue()


def filigraner(im: Image.Image, texte: str = "STUDIO ANNONCE · APERÇU") -> Image.Image:
    """Motif répété en diagonale, semi-transparent, sur toute l'image : impossible à rogner."""
    base = im.convert("RGBA")
    calque = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    taille = max(18, base.width // 22)
    try:
        police = ImageFont.truetype(POLICE, taille)
    except OSError:
        police = ImageFont.load_default()
    pas_x, pas_y = taille * 9, taille * 4
    for y in range(-base.height, base.height * 2, pas_y):
        for x in range(-base.width, base.width * 2, pas_x):
            d.text((x, y), texte, font=police, fill=(255, 255, 255, 70))
    calque = calque.rotate(30, resample=Image.BICUBIC, expand=False)
    return Image.alpha_composite(base, calque).convert("RGB")


def preparer_envoi_ia(donnees: bytes) -> bytes:
    """Ce qu'on envoie au modèle : au plus 2048 px de large. Assez pour lui, quatre fois plus rapide à envoyer."""
    return en_jpeg(reduire(ouvrir(donnees), reglages.LARGEUR_ENVOI_IA), 92)


def vignette(donnees: bytes) -> bytes:
    return en_webp(reduire(ouvrir(donnees), reglages.LARGEUR_VIGNETTE))


def apercu_filigrane(donnees: bytes) -> bytes:
    return en_webp(filigraner(reduire(ouvrir(donnees), reglages.LARGEUR_APERCU)))

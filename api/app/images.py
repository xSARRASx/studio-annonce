"""Tailles, formats et filigrane. Trois tailles par photo : vignette, aperçu, HD.
L'aperçu protégé est un dérivé distinct, produit après l'IA. L'original propre est conservé au privé.
Le motif dissuade la récupération ; aucune protection ne peut interdire toutes les captures."""
from __future__ import annotations

import io

from PIL import Image, ImageDraw, ImageFont, ImageOps

from .config import reglages

POLICES = (
    "/usr/share/fonts/urw-base35/NimbusSans-Bold.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Verdana Bold.ttf",
)


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
    im.save(sortie, "JPEG", quality=qualite, optimize=True, progressive=True)
    return sortie.getvalue()


def en_webp(im: Image.Image, qualite: int = 82) -> bytes:
    sortie = io.BytesIO()
    im.save(sortie, "WEBP", quality=qualite, method=4)
    return sortie.getvalue()


def filigraner(im: Image.Image, texte: str = "STUDIO ANNONCE") -> Image.Image:
    """Marquage lisible sans masquer les détails de l'aperçu ; la HD reste intacte."""
    base = im.convert("RGBA")
    base = Image.alpha_composite(base, Image.new("RGBA", base.size, (29, 38, 30, 10)))
    calque = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    taille = max(20, min(46, base.width // 42))
    police = None
    for chemin in POLICES:
        try:
            police = ImageFont.truetype(chemin, taille)
            break
        except (OSError, ImportError):
            continue
    if police is None:
        police = ImageFont.load_default(size=taille)
    largeur_texte = d.textbbox((0, 0), texte, font=police)[2]
    pas_x, pas_y = largeur_texte + taille * 3, round(taille * 5.5)
    marge = max(base.width, base.height)
    for numero, y in enumerate(range(-marge, base.height + marge, pas_y)):
        decalage = pas_x // 2 if numero % 2 else 0
        for x in range(-marge - pas_x, base.width + marge, pas_x):
            d.text((x + decalage, y), texte, font=police,
                   fill=(255, 255, 255, 120),
                   stroke_width=max(1, taille // 32), stroke_fill=(24, 34, 24, 100))
    calque = calque.rotate(25, resample=Image.Resampling.BICUBIC, expand=False)
    return Image.alpha_composite(base, calque).convert("RGB")


def preparer_envoi_ia(donnees: bytes) -> bytes:
    """Photo source privée : bord long borné, orientation corrigée et JPEG compact."""
    im = ouvrir(donnees)
    im.thumbnail((reglages.LARGEUR_ENVOI_IA, reglages.LARGEUR_ENVOI_IA), Image.LANCZOS)
    return en_jpeg(im, 88)


def vignette(donnees: bytes) -> bytes:
    return en_webp(reduire(ouvrir(donnees), reglages.LARGEUR_VIGNETTE))


def apercu_filigrane(donnees: bytes) -> bytes:
    image = ouvrir(donnees)
    image.thumbnail((reglages.LARGEUR_APERCU, reglages.LARGEUR_APERCU), Image.LANCZOS)
    return en_webp(filigraner(image), 92)


def hd_deja_prete(donnees: bytes) -> bool:
    """Une retouche JPEG déjà produite en 2K ne doit pas être recréée à l'achat."""
    try:
        with Image.open(io.BytesIO(donnees)) as image:
            return image.format == "JPEG" and max(image.size) >= 2048
    except (OSError, ValueError):
        return False

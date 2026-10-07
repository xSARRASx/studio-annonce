"""Repérage facultatif d'un logement à partir d'images extraites sur l'appareil.

Le fichier vidéo n'arrive jamais ici. Les planches temporaires ne sont pas stockées
et ne sont transmises qu'au modèle d'analyse, jamais au moteur vidéo Higgsfield.
"""
from __future__ import annotations

import base64
import binascii
import io

from PIL import Image, ImageDraw, ImageOps, UnidentifiedImageError


def planche(images: list[bytes], colonnes: int = 2) -> bytes:
    largeur, hauteur = 480, 300
    lignes = (len(images) + colonnes - 1) // colonnes
    sortie = Image.new("RGB", (colonnes * largeur, lignes * hauteur), "#f3f4ee")
    dessin = ImageDraw.Draw(sortie)
    for index, contenu in enumerate(images):
        try:
            with Image.open(io.BytesIO(contenu)) as brut:
                if brut.width * brut.height > 20_000_000:
                    raise ValueError("Image de repérage trop grande.")
                photo = ImageOps.exif_transpose(brut).convert("RGB")
                photo.thumbnail((largeur, hauteur - 28), Image.Resampling.LANCZOS)
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as erreur:
            raise ValueError("Une image de repérage n'est pas lisible.") from erreur
        x, y = (index % colonnes) * largeur, (index // colonnes) * hauteur
        sortie.paste(photo, (x + (largeur - photo.width) // 2, y + 28 + (hauteur - 28 - photo.height) // 2))
        dessin.rectangle((x, y, x + largeur, y + 27), fill="#263323")
        dessin.text((x + 10, y + 7), f"Image {index + 1}", fill="white")
    memoire = io.BytesIO()
    sortie.save(memoire, "JPEG", quality=78, optimize=True)
    return memoire.getvalue()


def decoder_image(texte: str) -> bytes:
    if not isinstance(texte, str) or len(texte) > 320_000:
        raise ValueError("Une image du repérage est trop lourde.")
    try:
        donnees = base64.b64decode(texte, validate=True)
    except (binascii.Error, ValueError) as erreur:
        raise ValueError("Une image du repérage est incomplète.") from erreur
    if len(donnees) > 240_000 or not donnees.startswith(b"\xff\xd8"):
        raise ValueError("Les images du repérage doivent être des JPEG légers.")
    return donnees


def proposition(analyse: dict) -> dict:
    pieces = [v.strip()[:55] for v in analyse.get("pieces", [])[:10] if isinstance(v, str) and v.strip()]
    passages = []
    for v in analyse.get("passages", [])[:10]:
        if not isinstance(v, dict):
            continue
        depart, arrivee, porte = (str(v.get(cle, "")).strip()[:70] for cle in ("depart", "arrivee", "porte"))
        if not depart or not arrivee:
            continue
        passages.append({"depart": depart, "arrivee": arrivee, "porte": porte,
                         "preuve": "visible" if v.get("preuve") == "visible" else "incertain"})
    confirme = [f"{p['depart']} vers {p['arrivee']} par {p['porte'] or 'le passage visible'}" for p in passages if p["preuve"] == "visible"]
    incertain = [f"{p['depart']} vers {p['arrivee']}" for p in passages if p["preuve"] != "visible"]
    lignes = ["Ordre des pièces aperçu dans la vidéo : " + " → ".join(pieces) + "." if pieces else "Ordre des pièces non établi."]
    lignes.append("Passages visibles à vérifier : " + (" ; ".join(confirme) if confirme else "aucun passage confirmé" ) + ".")
    lignes.append("Faire une coupe entre les pièces sans passage confirmé" + (" : " + " ; ".join(incertain) if incertain else "") + ".")
    return {"pieces": pieces, "passages": passages, "avertissement": str(analyse.get("avertissement", ""))[:350],
            "agencement": "\n".join(lignes)[:1200]}

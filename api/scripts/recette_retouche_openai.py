"""Recette privée d'une retouche OpenAI, sans ouvrir le service aux clients.

Depuis le dossier api :
python -m scripts.recette_retouche_openai --source photo.jpg --sortie recette.jpg --consigne "..."
"""
from __future__ import annotations

import argparse
import asyncio
import io
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path

from PIL import Image

from app import images, openai_images
from app.couts import montant_usd


@dataclass(frozen=True)
class BilanRecette:
    sortie: Path
    largeur: int
    hauteur: int
    octets: int
    cout_usd: Decimal | None


async def executer(source: Path, sortie: Path, consigne: str, hd: bool = False) -> BilanRecette:
    if not consigne.strip():
        raise ValueError("La consigne de retouche est obligatoire.")
    if sortie.suffix.lower() not in {".jpg", ".jpeg"}:
        raise ValueError("La sortie de recette doit se terminer par .jpg ou .jpeg.")

    # Valider et normaliser la source avant tout appel payant.
    source_jpeg = images.preparer_envoi_ia(source.read_bytes())
    sortie.parent.mkdir(parents=True, exist_ok=True)

    # La réservation atomique empêche deux recettes simultanées de payer pour le même fichier.
    try:
        with sortie.open("xb"):
            pass
    except FileExistsError:
        raise FileExistsError(f"La sortie existe déjà : {sortie}") from None

    try:
        mesure = await openai_images.retoucher_avec_mesure(source_jpeg, consigne.strip(), hd)
        with Image.open(io.BytesIO(mesure.image)) as resultat:
            resultat.load()
            largeur, hauteur = resultat.size
        sortie.write_bytes(mesure.image)
    except BaseException:
        sortie.unlink(missing_ok=True)
        raise

    return BilanRecette(
        sortie=sortie.resolve(),
        largeur=largeur,
        hauteur=hauteur,
        octets=len(mesure.image),
        cout_usd=montant_usd(mesure.modele, mesure.usage),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Tester une seule retouche OpenAI sans activer Studio Annonce.")
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--sortie", type=Path, required=True)
    parser.add_argument("--consigne", required=True)
    parser.add_argument("--hd", action="store_true", help="Utiliser la qualité HD, plus coûteuse.")
    args = parser.parse_args()

    bilan = asyncio.run(executer(args.source, args.sortie, args.consigne, args.hd))
    cout = f"{bilan.cout_usd:.6f} USD" if bilan.cout_usd is not None else "non chiffrable par le fournisseur"
    print(f"Image validée : {bilan.sortie}")
    print(f"Dimensions : {bilan.largeur} x {bilan.hauteur} | {bilan.octets} octets")
    print(f"Coût estimé de cet appel : {cout}")


if __name__ == "__main__":
    main()

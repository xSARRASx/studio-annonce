"""Recette privée Higgsfield, hors compte client et hors dossier public.

La trace est écrite dès l'acceptation, pour reprendre le suivi sans relancer
une génération facturée si le processus s'interrompt.
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from app import higgsfield_video, images
from app.routes.videos import CONSIGNE_FIDELITE


async def executer(source: Path, sortie: Path, suivi: Path, consigne: str) -> None:
    if sortie.exists():
        raise FileExistsError("Le MP4 existe déjà ; aucun nouvel essai n'a été lancé.")
    if suivi.exists():
        requete = json.loads(suivi.read_text())
    else:
        donnees = images.preparer_envoi_ia(source.read_bytes())
        requete = await higgsfield_video.demarrer(donnees, CONSIGNE_FIDELITE + consigne, 5, suivi.stem)
        suivi.write_text(json.dumps(requete))
        print("Requête acceptée :", requete["request_id"], flush=True)
    for _ in range(90):
        resultat = await higgsfield_video.etat(requete["status_url"])
        statut = resultat["status"]
        print("État :", statut, flush=True)
        if statut == "completed":
            url = (resultat.get("video") or {}).get("url")
            if not url:
                raise RuntimeError("Aucune URL vidéo dans le résultat Higgsfield.")
            contenu = await higgsfield_video.fichier_resultat(url)
            sortie.write_bytes(contenu)
            print("MP4 validé :", sortie.resolve(), len(contenu), "octets", flush=True)
            return
        if statut in {"failed", "nsfw", "canceled"}:
            raise RuntimeError(f"Création vidéo terminée sans résultat : {statut}")
        await asyncio.sleep(5)
    raise TimeoutError("Vidéo encore en traitement ; relancer le script reprend la même requête.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--sortie", type=Path, required=True)
    parser.add_argument("--suivi", type=Path, required=True)
    parser.add_argument("--consigne", required=True)
    args = parser.parse_args()
    asyncio.run(executer(args.source, args.sortie, args.suivi, args.consigne))


if __name__ == "__main__":
    main()

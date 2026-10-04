"""Prépare un essai caméra hors compte client. Aucun réseau sans --executer.

Un lancement explicite = un clip de 5 secondes. Le reçu et l'intention sont
conservés avant l'appel payant ; une réponse perdue réutilise la même clé.
"""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import uuid

from app import higgsfield_video, images
from app.consignes_video import VERSION, preparer_consigne


def sauvegarder(path: Path, value: dict) -> None:
    tmp = path.with_suffix(".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


async def executer(source: Path, dossier: Path, modele: str, mouvement: str, demande: str, payer: bool) -> None:
    prompt = preparer_consigne(demande, mouvement)
    intention = {"modele": modele, "mouvement": mouvement, "direction_version": VERSION,
                 "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "prompt": prompt, "duree": 5}
    # Le schéma est vérifié localement ; cette adresse factice n'est jamais envoyée.
    higgsfield_video.parametres("https://example.test/source.jpg", prompt, 5, modele)
    if not payer:
        print(json.dumps({**intention, "generation_lancee": False}, ensure_ascii=False, indent=2))
        return
    dossier.mkdir(parents=True, exist_ok=True, mode=0o700)
    trace = dossier / "suivi.json"
    sortie = dossier / "resultat.mp4"
    if sortie.exists():
        raise RuntimeError("Un résultat existe déjà dans ce dossier. Aucun appel lancé.")
    if trace.exists():
        state = json.loads(trace.read_text())
        if state["intention"] != intention:
            raise RuntimeError("Ce dossier correspond à un autre essai. Reprise refusée.")
        if state.get("termine_sans_resultat"):
            raise RuntimeError("Cet essai est terminé sans résultat. Aucun nouvel appel lancé.")
    else:
        state = {"intention": intention, "idempotence": str(uuid.uuid4())}
        sauvegarder(trace, state)
    if not state.get("image_url"):
        state["image_url"] = await higgsfield_video.preparer_image(images.preparer_envoi_ia(source.read_bytes()))
        sauvegarder(trace, state)
    if not state.get("request_id"):
        state.update(await higgsfield_video.soumettre(state["image_url"], prompt, 5, state["idempotence"], modele))
        sauvegarder(trace, state)
    for _ in range(90):
        result = await higgsfield_video.etat(state["status_url"])
        print("État :", result["status"], flush=True)
        if result["status"] == "completed":
            url = (result.get("video") or {}).get("url")
            if not url:
                raise RuntimeError("Résultat sans vidéo ; reçu conservé, ne pas recréer l'essai.")
            data = await higgsfield_video.fichier_resultat(url)
            with sortie.open("xb") as f:
                f.write(data)
            print("MP4 conservé :", sortie)
            return
        if result["status"] in {"failed", "nsfw", "canceled"}:
            state["termine_sans_resultat"] = result["status"]
            sauvegarder(trace, state)
            raise RuntimeError("Essai terminé sans vidéo ; aucun nouvel appel automatique.")
        await asyncio.sleep(5)
    raise TimeoutError("Suivi conservé : reprendre le même dossier, sans nouvelle génération.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--dossier", type=Path, required=True)
    parser.add_argument("--modele", choices=higgsfield_video.MODELES, default=higgsfield_video.MODELE_KLING)
    parser.add_argument("--mouvement", choices=("traversee", "orbite", "revelation", "calme"), default="traversee")
    parser.add_argument("--demande", default="Une visite façon drone intérieur, dynamique et fidèle au logement.")
    parser.add_argument("--executer", action="store_true", help="Autorise un seul clip facturé de 5 secondes.")
    args = parser.parse_args()
    asyncio.run(executer(args.source, args.dossier, args.modele, args.mouvement, args.demande, args.executer))


if __name__ == "__main__":
    main()

"""Essai privé et reprenable du parcours Higgsfield multi-photo.

N'ajoute rien au compte client. Le reçu est enregistré avant de suivre la
génération, et une reprise utilise toujours la même clé d'idempotence.
"""
from __future__ import annotations

import argparse
import asyncio
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import uuid

from app import higgsfield_video, images
from app.consignes_video import preparer_visite_continue


# Tarif public indicatif Higgsfield du 06/10/2026 : 16:9, 720p, sans vidéo en entrée.
TARIF_PAR_SECONDE = Decimal("0.46224")
MOUVEMENTS = ["traversee", "orbite", "revelation"]


def sauvegarder(chemin: Path, etat: dict) -> None:
    temporaire = chemin.with_suffix(".tmp")
    temporaire.write_text(json.dumps(etat, ensure_ascii=False, indent=2))
    temporaire.chmod(0o600)
    temporaire.replace(chemin)


async def executer(photos: list[Path], demande: str, duree: int, plafond: Decimal,
                   dossier: Path, preflight: bool) -> None:
    cout_estime = TARIF_PAR_SECONDE * duree
    if duree not in (5, 10, 15, 20, 25, 30) or not 1 <= len(photos) <= min(6, duree // 5 * 2):
        raise ValueError("Durée ou nombre de photos incompatible avec le modèle.")
    if cout_estime > plafond:
        raise ValueError(f"Coût indicatif {cout_estime:.4f} $ supérieur au plafond {plafond} $.")
    mouvements = [MOUVEMENTS[index % len(MOUVEMENTS)] for index in range(len(photos))]
    prompt = preparer_visite_continue(demande, mouvements, duree)
    if len(prompt) > 10000:
        raise ValueError("Le prompt dépasse la limite du modèle.")
    empreintes = [hashlib.sha256(photo.read_bytes()).hexdigest() for photo in photos]
    print(f"Préflight : {len(photos)} photos, {duree} s, 720p, coût indicatif {cout_estime:.4f} $ / plafond {plafond} $.", flush=True)
    if preflight:
        print(f"Prompt : {len(prompt)} caractères. Aucun appel fournisseur.", flush=True)
        return

    dossier.mkdir(parents=True, exist_ok=True)
    etat_fichier = dossier / "etat.json"
    sortie = dossier / "rendu.mp4"
    if sortie.exists():
        print(f"Résultat déjà présent : {sortie}", flush=True)
        return
    if etat_fichier.exists():
        etat = json.loads(etat_fichier.read_text())
        if etat.get("empreintes") != empreintes or etat.get("prompt_sha256") != hashlib.sha256(prompt.encode()).hexdigest() or etat.get("duree") != duree:
            raise ValueError("Le reçu existant correspond à un autre essai ; arrêt sans soumission.")
        if etat.get("statut") in {"failed", "nsfw", "canceled"}:
            raise RuntimeError("Cet essai est terminé sans résultat ; aucune nouvelle génération n'est lancée.")
    else:
        etat = {
            "duree": duree,
            "empreintes": empreintes,
            "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
            "idempotence": "studio-essai-" + uuid.uuid4().hex,
            "image_urls": [],
        }
        sauvegarder(etat_fichier, etat)

    for photo in photos[len(etat["image_urls"]):]:
        jpeg = images.preparer_envoi_ia(photo.read_bytes())
        etat["image_urls"].append(await higgsfield_video.preparer_image(jpeg))
        sauvegarder(etat_fichier, etat)
        print(f"Source préparée : {len(etat['image_urls'])}/{len(photos)}", flush=True)

    if not etat.get("recu"):
        # En cas de réponse perdue, la reprise soumet la même intention avec la
        # même clé d'idempotence ; elle ne choisit jamais une nouvelle clé.
        etat["soumission_tentee"] = True
        sauvegarder(etat_fichier, etat)
        etat["recu"] = await higgsfield_video.soumettre_references(
            etat["image_urls"], prompt, duree, etat["idempotence"])
        sauvegarder(etat_fichier, etat)
        print("Génération acceptée :", etat["recu"]["request_id"], flush=True)
    else:
        print("Reprise du suivi :", etat["recu"]["request_id"], flush=True)

    dernier_statut = None
    for _ in range(180):
        resultat = await higgsfield_video.etat(etat["recu"]["status_url"])
        statut = resultat["status"]
        if statut != dernier_statut:
            print("État fournisseur :", statut, flush=True)
            dernier_statut = statut
        if statut == "completed":
            url = (resultat.get("video") or {}).get("url")
            if not url:
                raise RuntimeError("Résultat terminé sans URL vidéo.")
            etat["result_url"] = url
            sauvegarder(etat_fichier, etat)
            sortie.write_bytes(await higgsfield_video.fichier_resultat(url))
            etat["statut"] = "completed"
            sauvegarder(etat_fichier, etat)
            print(f"MP4 sauvegardé : {sortie} ({sortie.stat().st_size} octets)", flush=True)
            return
        if statut in {"failed", "nsfw", "canceled"}:
            etat["statut"] = statut
            sauvegarder(etat_fichier, etat)
            raise RuntimeError(f"Génération terminée sans vidéo : {statut}")
        await asyncio.sleep(10)
    raise TimeoutError("Toujours en cours : relancer reprend le même reçu sans nouvelle génération.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--photos", type=Path, nargs="+", required=True)
    parser.add_argument("--demande-fichier", type=Path, required=True)
    parser.add_argument("--duree", type=int, required=True)
    parser.add_argument("--plafond-usd", type=Decimal, required=True)
    parser.add_argument("--dossier", type=Path, required=True)
    parser.add_argument("--preflight", action="store_true")
    args = parser.parse_args()
    asyncio.run(executer(args.photos, args.demande_fichier.read_text().strip(),
                         args.duree, args.plafond_usd, args.dossier, args.preflight))


if __name__ == "__main__":
    main()

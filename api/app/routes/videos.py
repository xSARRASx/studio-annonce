"""Pilote vidéo privé : même photo du compte, création offerte au propriétaire."""
from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from .. import acces_ia, higgsfield_video, images, stockage
from ..db import session
from ..models import Compte, Logement, Photo, Video, maintenant
from .auth import compte_complet

routeur = APIRouter(prefix="/videos", tags=["videos"])

CONSIGNE_FIDELITE = (
    "Vidéo immobilière photoréaliste. Respecte exactement la pièce de la photo : "
    "positions des portes, fenêtres, murs, radiateurs et volumes. "
    "Mouvement de caméra doux, sans franchir un mur ni inventer une autre pièce. "
)


class DemandeVideo(BaseModel):
    demande: str = Field(min_length=3, max_length=3000)


def _photo(s: Session, compte: Compte, photo_id: str) -> Photo:
    p = s.get(Photo, photo_id)
    if not p or p.logement.compte_id != compte.id:
        raise HTTPException(404, "Photo introuvable.")
    return p


def _video(s: Session, compte: Compte, video_id: str) -> Video:
    v = s.get(Video, video_id)
    logement = s.get(Logement, v.logement_id) if v else None
    if not logement or logement.compte_id != compte.id:
        raise HTTPException(404, "Vidéo introuvable.")
    return v


def _vue(v: Video) -> dict:
    return {"id": v.id, "statut": v.statut, "duree": (v.plan or {}).get("duree", 5),
            "erreur": v.erreur, "url": stockage.url_privee(v.cle_video) if v.cle_video else ""}


@routeur.post("/photos/{photo_id}")
async def creer(photo_id: str, d: DemandeVideo, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    if not acces_ia.gratuit_proprietaire(compte) or not higgsfield_video.disponible():
        raise HTTPException(503, "La création vidéo n'est pas encore ouverte sur ce compte.")
    # Le compte est verrouillé avant de réserver la demande ; deux clics ne
    # démarrent pas deux appels facturés à Higgsfield.
    s.rollback()
    s.execute(update(Compte).where(Compte.id == compte.id).values(photos_offertes_utilisees=Compte.photos_offertes_utilisees))
    s.expire_all()
    compte = s.get(Compte, compte.id)
    p = _photo(s, compte, photo_id)
    en_cours = s.scalar(select(Video).where(Video.logement_id == p.logement_id,
        Video.statut.in_(["preparation", "en_attente", "clips", "montage"])))
    if (en_cours and en_cours.statut == "preparation" and not (en_cours.requetes or {}).get("image_url")
            and en_cours.cree_le < maintenant() - timedelta(minutes=5)):
        # Le processus a pu s'arrêter avant l'envoi de l'image, donc avant
        # toute soumission facturée. Libérer cet essai orphelin.
        en_cours.statut = "echec"
        en_cours.erreur = "La préparation a été interrompue. Vous pouvez réessayer."
        s.flush()
        en_cours = None
    if en_cours:
        raise HTTPException(409, "Une vidéo de ce logement est déjà en cours. Attendez son résultat.")
    debut = maintenant() - timedelta(days=1)
    nb = s.scalar(select(func.count(Video.id)).where(Video.logement_id == p.logement_id, Video.cree_le >= debut)) or 0
    if nb >= 5:
        raise HTTPException(429, "Limite de cinq essais vidéo par logement et par jour atteinte.")
    version = next((v for v in p.versions if v.id == p.version_gardee_id), None)
    source = stockage.lire(version.cle_pleine if version else p.cle_originale)
    v = Video(logement_id=p.logement_id, statut="preparation",
              plan={"photo_id": p.id, "duree": 5, "demande": d.demande.strip()}, requetes={})
    s.add(v)
    s.commit()
    try:
        image_url = await higgsfield_video.preparer_image(images.preparer_envoi_ia(source))
    except Exception:
        v.statut = "echec"
        v.erreur = "La photo n'a pas pu être préparée pour la vidéo. Réessayez plus tard."
        s.commit()
        raise HTTPException(502, v.erreur)
    # Conserver exactement les paramètres et la clé d'idempotence AVANT la
    # soumission payante. Un incident réseau pourra reprendre sans double coût.
    v.requetes = {"image_url": image_url}
    s.commit()
    try:
        resultat = await higgsfield_video.soumettre(image_url, CONSIGNE_FIDELITE + d.demande.strip(), 5, v.id)
        v.requetes = {**v.requetes, **resultat}
        v.statut = "en_attente"
        s.commit()
        return _vue(v)
    except Exception:
        s.rollback()
        raise HTTPException(502, "Le démarrage de la vidéo est à vérifier. Ouvrez cette photo dans un instant pour reprendre son suivi.")


@routeur.get("/{video_id}")
async def voir(video_id: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    v = _video(s, compte, video_id)
    if v.statut in {"prete", "echec"}:
        return _vue(v)
    if (v.statut == "preparation" and not (v.requetes or {}).get("image_url")
            and v.cree_le < maintenant() - timedelta(minutes=5)):
        v.statut = "echec"
        v.erreur = "La préparation a été interrompue. Vous pouvez réessayer."
        s.commit()
        return _vue(v)
    if v.statut == "preparation" and (v.requetes or {}).get("image_url"):
        try:
            demande = (v.plan or {}).get("demande", "")
            resultat = await higgsfield_video.soumettre(v.requetes["image_url"], CONSIGNE_FIDELITE + demande, 5, v.id)
            v.requetes = {**v.requetes, **resultat}
            v.statut = "en_attente"
            s.commit()
        except Exception:
            s.rollback()
            raise HTTPException(502, "Le suivi vidéo est momentanément indisponible. Réessayez dans un instant.")
    if not v.requetes or not v.requetes.get("status_url"):
        return _vue(v)
    try:
        resultat = await higgsfield_video.etat(v.requetes["status_url"])
        statut = resultat["status"]
        if statut == "completed":
            url = (resultat.get("video") or {}).get("url")
            if not url:
                raise RuntimeError("Aucune vidéo dans le résultat.")
            contenu = await higgsfield_video.fichier_resultat(url)
            v.cle_video = stockage.ecrire(f"prive/videos/{v.id}.mp4", contenu, "video/mp4")
            v.statut = "prete"
        elif statut in {"failed", "nsfw", "canceled"}:
            v.statut = "echec"
            v.erreur = "La création vidéo n'a pas abouti. Aucun crédit n'a été utilisé."
        else:
            v.statut = "clips" if statut == "in_progress" else "en_attente"
        s.commit()
        return _vue(v)
    except Exception:
        # Un incident de suivi ou de téléchargement peut être réessayé sans
        # demander une seconde génération payante.
        s.rollback()
        raise HTTPException(502, "La vidéo est toujours en traitement. Réessayez dans un instant.")


@routeur.get("/photos/{photo_id}/derniere")
def derniere(photo_id: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    p = _photo(s, compte, photo_id)
    videos = s.scalars(select(Video).where(Video.logement_id == p.logement_id)
                       .order_by(Video.cree_le.desc(), Video.id.desc())).all()
    v = next((item for item in videos if (item.plan or {}).get("photo_id") == p.id), None)
    return _vue(v) if v else None

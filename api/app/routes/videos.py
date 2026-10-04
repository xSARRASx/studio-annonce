"""Vidéo propriétaire : intention explicite, suivi rapide et reprise idempotente."""
from __future__ import annotations

import asyncio
import httpx
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, sessionmaker

from .. import acces_ia, higgsfield_video, images, stockage, video_montage
from ..db import session
from ..models import Compte, Logement, Photo, Video, identifiant, maintenant
from .auth import compte_complet

routeur = APIRouter(prefix="/videos", tags=["videos"])
EN_COURS = ("preparation", "en_attente", "clips", "montage")
CONSIGNE_FIDELITE = (
    "Vidéo immobilière photoréaliste. Respecte exactement la pièce de la photo : "
    "positions des portes, fenêtres, murs, radiateurs et volumes. "
    "Mouvement de caméra doux dans cette seule pièce, sans franchir un mur ni inventer une autre pièce. "
    "Conserve les matières, couleurs et équipements de la source. "
)
# Aucun appel au fournisseur ne retient la réponse de navigation. Le bail SQL
# protège également les traitements entre les différents processus Passenger.
_ouvriers = ThreadPoolExecutor(max_workers=2, thread_name_prefix="studio-video")
_planifies: set[tuple[str, str]] = set()
_verrou = Lock()


class DemandeVideo(BaseModel):
    demande: str = Field(min_length=3, max_length=3000)

    @field_validator("demande")
    @classmethod
    def texte_reel(cls, value: str) -> str:
        if len(value.strip()) < 3:
            raise ValueError("Décrivez le mouvement souhaité.")
        return value.strip()


class SourceVideo(BaseModel):
    photo_id: str = Field(min_length=1, max_length=24)
    version_id: str | None = Field(default=None, max_length=24)


class DemandeVisite(DemandeVideo):
    photos: list[SourceVideo] = Field(min_length=1, max_length=6)
    cle_demande: str = Field(pattern=r"^[a-fA-F0-9-]{36}$")


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
    plans = (v.requetes or {}).get("clips", [])
    return {"id": v.id, "statut": v.statut, "duree": (v.plan or {}).get("duree", 5),
            "erreur": v.erreur, "url": stockage.url_privee(v.cle_video) if v.cle_video else "",
            "plans_prets": sum(bool(p.get("cle_clip")) for p in plans),
            "plans_total": len((v.plan or {}).get("sources", [])) or 1,
            "clips": [{"photo_id": p["photo_id"], "url": stockage.url_privee(p["cle_clip"])}
                      for p in plans if p.get("cle_clip")]}


def _reserver(s: Session, compte: Compte, sources: list[SourceVideo], demande: str, cle: str | None) -> Video:
    if not acces_ia.gratuit_proprietaire(compte) or not higgsfield_video.disponible():
        raise HTTPException(503, "La création vidéo n'est pas encore ouverte sur ce compte.")
    compte_id = compte.id
    s.rollback()
    s.execute(update(Compte).where(Compte.id == compte_id).values(photos_offertes_utilisees=Compte.photos_offertes_utilisees))
    s.expire_all()
    compte = s.get(Compte, compte_id)
    if not compte or compte.statut != "actif":
        raise HTTPException(403, "Ce compte n'est plus actif.")
    if cle:
        deja = s.scalar(select(Video).where(Video.cle_demande == cle))
        if deja:
            _video(s, compte, deja.id)
            if (deja.plan or {}).get("demande") != demande or (deja.plan or {}).get("selection") != [p.model_dump() for p in sources]:
                raise HTTPException(409, "Cette confirmation correspond à une autre demande vidéo.")
            s.commit()
            return deja
    photos = [_photo(s, compte, p.photo_id) for p in sources]
    if len(set(p.id for p in photos)) != len(photos):
        raise HTTPException(400, "Choisissez chaque photo une seule fois.")
    if len(set(p.logement_id for p in photos)) != 1:
        raise HTTPException(400, "Choisissez les photos d'un même logement pour cette vidéo.")
    if any(p.archive_le for p in photos):
        raise HTTPException(400, "Restaurez les photos archivées avant de les utiliser.")
    logement_id = photos[0].logement_id
    en_cours = s.scalar(select(Video).where(Video.logement_id == logement_id, Video.statut.in_(EN_COURS)))
    if en_cours:
        # Un vieux démarrage interrompu avant tout appel facturé peut être libéré.
        if en_cours.statut == "preparation" and not en_cours.requetes and en_cours.cree_le < maintenant() - timedelta(minutes=5):
            en_cours.statut, en_cours.erreur = "echec", "La préparation a été interrompue."
            s.flush()
        else:
            raise HTTPException(409, "Une vidéo de ce logement est déjà en cours. Retrouvez son suivi avant de recommencer.")
    debut = maintenant() - timedelta(days=1)
    nb = s.scalar(select(func.count(Video.id)).where(Video.logement_id == logement_id, Video.cree_le >= debut)) or 0
    if nb >= 5:
        raise HTTPException(429, "Limite de cinq projets vidéo par logement et par jour atteinte.")
    plans = []
    for source, photo in zip(sources, photos):
        version = None
        if source.version_id:
            version = next((p for p in photo.versions if p.id == source.version_id), None)
            if not version:
                raise HTTPException(400, "La version choisie ne fait pas partie de cette photo.")
        elif source.version_id is None:
            version = next((p for p in photo.versions if p.id == photo.version_gardee_id), None)
        plans.append({"photo_id": photo.id, "version_id": version.id if version else None,
                      "cle_source": version.cle_pleine if version else photo.cle_originale})
    v = Video(logement_id=logement_id, cle_demande=cle, statut="preparation",
              plan={"schema": 2, "photo_id": photos[0].id, "duree": 5 * len(plans), "demande": demande,
                    "selection": [p.model_dump() for p in sources], "sources": plans}, requetes={"clips": []})
    s.add(v)
    s.commit()
    return v


def _planifier(s: Session, v: Video) -> None:
    if v.statut not in EN_COURS:
        return
    moteur = s.get_bind()
    cle = (str(moteur.url), v.id)
    with _verrou:
        if cle in _planifies:
            return
        _planifies.add(cle)
    fabrique = sessionmaker(bind=moteur, expire_on_commit=False)
    video_id = v.id
    def travail():
        try:
            asyncio.run(_avancer(fabrique, video_id))
        finally:
            with _verrou:
                _planifies.discard(cle)
    _ouvriers.submit(travail)


@routeur.post("/visites")
def creer_visite(d: DemandeVisite, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    v = _reserver(s, compte, d.photos, d.demande, d.cle_demande)
    vue = _vue(v)
    _planifier(s, v)
    return vue


@routeur.post("/photos/{photo_id}")
def creer(photo_id: str, d: DemandeVideo, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    p = _photo(s, compte, photo_id)
    v = _reserver(s, compte, [SourceVideo(photo_id=photo_id, version_id=p.version_gardee_id)], d.demande, None)
    vue = _vue(v)
    _planifier(s, v)
    return vue


async def _avancer(fabrique, video_id: str) -> None:
    """Une étape bornée, reprise au contrôle suivant, sans maintenir de verrou SQL."""
    jeton = identifiant()
    with fabrique() as s:
        resultat = s.execute(update(Video).where(Video.id == video_id, Video.statut.in_(EN_COURS),
            or_(Video.traitement_jusqu_au.is_(None), Video.traitement_jusqu_au < maintenant()))
            .values(traitement_jeton=jeton, traitement_jusqu_au=maintenant() + timedelta(minutes=5)))
        s.commit()
        if resultat.rowcount != 1:
            return
        v = s.get(Video, video_id)
        logement = s.get(Logement, v.logement_id)
        compte = s.get(Compte, logement.compte_id)
        if not compte or compte.statut != "actif" or not acces_ia.gratuit_proprietaire(compte) or not higgsfield_video.disponible():
            v.statut, v.erreur = "echec", "La création vidéo n'est plus disponible sur ce compte."
            v.traitement_jusqu_au = None
            s.commit()
            return
        # Les anciens clips conservent exactement leur reçu et leur idempotence.
        if (v.plan or {}).get("schema") != 2:
            if v.statut == "preparation" and not (v.requetes or {}).get("image_url") and v.cree_le < maintenant() - timedelta(minutes=5):
                v.statut, v.erreur = "echec", "La préparation a été interrompue. Vous pouvez réessayer."
                v.traitement_jusqu_au = None
                s.commit()
                return
            photo = s.get(Photo, (v.plan or {}).get("photo_id"))
            v.plan = {**(v.plan or {}), "schema": 2, "sources": [{"photo_id": photo.id, "cle_source": photo.cle_originale}]}
            v.requetes = {"clips": [{"photo_id": photo.id, "idempotence": v.id, **(v.requetes or {})}]}
            s.commit()
        plans = [dict(p) for p in (v.requetes or {}).get("clips", [])]
        sources = v.plan["sources"]
        while len(plans) < len(sources):
            index = len(plans)
            plans.append({"photo_id": sources[index]["photo_id"], "idempotence": f"{v.id}-{index}"})
        def sauver(minutes=5):
            resultat = s.execute(update(Video).where(Video.id == video_id, Video.traitement_jeton == jeton)
                .values(traitement_jusqu_au=maintenant() + timedelta(minutes=minutes)))
            if resultat.rowcount != 1:
                s.rollback()
                raise RuntimeError("Le traitement a été repris par un autre processus.")
            v.requetes = {"clips": [dict(p) for p in plans]}
            s.commit()
        try:
            for index, plan in enumerate(plans):
                if plan.get("request_id") or plan.get("cle_clip"):
                    continue
                if not plan.get("image_url"):
                    source = stockage.lire(sources[index]["cle_source"])
                    plan["image_url"] = await higgsfield_video.preparer_image(images.preparer_envoi_ia(source))
                    sauver()
                s.expire(compte)
                if compte.statut != "actif":
                    raise RuntimeError("Compte inactif.")
                plan.update(await higgsfield_video.soumettre(plan["image_url"], CONSIGNE_FIDELITE + v.plan.get("demande", ""), 5, plan["idempotence"]))
                v.statut, v.erreur = "en_attente", ""
                sauver()
                return
            for index, plan in enumerate(plans):
                if plan.get("cle_clip"):
                    continue
                resultat = await higgsfield_video.etat(plan["status_url"])
                if resultat["status"] == "completed":
                    url = (resultat.get("video") or {}).get("url")
                    if not url:
                        raise RuntimeError("Aucun fichier dans le résultat.")
                    contenu = await higgsfield_video.fichier_resultat(url)
                    plan["cle_clip"] = stockage.ecrire(f"prive/videos/{v.id}/plan-{index}.mp4", contenu, "video/mp4")
                    sauver()
                elif resultat["status"] in {"failed", "nsfw", "canceled"}:
                    v.statut, v.erreur = "echec", "Un plan n'a pas abouti. Les clips terminés restent disponibles. Aucun plan n'est relancé automatiquement."
                    sauver()
                    return
                else:
                    v.statut = "clips"
            if all(p.get("cle_clip") for p in plans):
                if len(plans) == 1:
                    v.cle_video = plans[0]["cle_clip"]
                else:
                    v.statut = "montage"
                    sauver(minutes=15)
                    contenu = video_montage.assembler([stockage.lire(p["cle_clip"]) for p in plans])
                    v.cle_video = stockage.ecrire(f"prive/videos/{v.id}/video.mp4", contenu, "video/mp4")
                v.statut, v.erreur = "prete", ""
            sauver()
        except Exception as erreur:
            s.rollback()
            v = s.get(Video, video_id)
            if v.traitement_jeton == jeton:
                if isinstance(erreur, httpx.HTTPStatusError) and erreur.response.status_code in {400, 401, 403, 404, 422}:
                    v.statut, v.erreur = "echec", "Le fournisseur n'a pas accepté un plan. Les clips déjà prêts restent disponibles. Vérifiez la connexion et le solde du service avant un nouvel essai."
                else:
                    v.erreur = "Le suivi est momentanément interrompu. Revenez sur cette vidéo : le même projet sera vérifié sans recréer les plans terminés."
                s.commit()
        finally:
            s.execute(update(Video).where(Video.id == video_id, Video.traitement_jeton == jeton)
                      .values(traitement_jusqu_au=None))
            s.commit()


@routeur.get("/{video_id}")
def voir(video_id: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    v = _video(s, compte, video_id)
    vue = _vue(v)
    _planifier(s, v)
    return vue


@routeur.get("/photos/{photo_id}/derniere")
def derniere(photo_id: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    p = _photo(s, compte, photo_id)
    videos = s.scalars(select(Video).where(Video.logement_id == p.logement_id)
                       .order_by(Video.cree_le.desc(), Video.id.desc())).all()
    v = next((item for item in videos if (item.plan or {}).get("photo_id") == p.id or
              any(source.get("photo_id") == p.id for source in (item.plan or {}).get("sources", []))), None)
    if v:
        vue = _vue(v)
        _planifier(s, v)
        return vue
    return None

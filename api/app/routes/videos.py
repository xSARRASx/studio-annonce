"""Création vidéo : intention explicite, crédit par durée et reprise idempotente."""
from __future__ import annotations

import asyncio
import httpx
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Lock
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, sessionmaker

from .. import acces_ia, credits_video, higgsfield_video, images, limites, openai_vision, stockage, video_montage, video_reperage
from ..config import reglages
from ..consignes_video import Mouvement, VERSION, identifier_piece, mouvement_du_plan, preparer_consigne, preparer_visite_continue
from ..db import session
from ..models import Brouillon, Compte, Logement, MouvementCreditVideo, Photo, Video, identifiant, maintenant
from ..paiements import video_disponible as vente_video_disponible
from .auth import compte_complet

routeur = APIRouter(prefix="/videos", tags=["videos"])
EN_COURS = ("preparation", "en_attente", "clips", "montage")
CONSIGNE_FIDELITE = (  # Legacy uniquement : conserver les requêtes déjà acceptées, même après une mise à jour.
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
    demande: str = Field(min_length=3, max_length=6000)

    @field_validator("demande")
    @classmethod
    def texte_reel(cls, value: str) -> str:
        if len(value.strip()) < 3:
            raise ValueError("Décrivez le mouvement souhaité.")
        return value.strip()


class SourceVideo(BaseModel):
    photo_id: str = Field(min_length=1, max_length=24)
    version_id: str | None = Field(default=None, max_length=24)
    mouvement: Mouvement = "auto"


def _selection(sources: list[SourceVideo]) -> list[dict]:
    # Même signature que les anciennes confirmations sans mouvement explicite.
    return [p.model_dump(exclude={"mouvement"} if p.mouvement == "auto" else set()) for p in sources]


class DemandeVisite(DemandeVideo):
    brouillon_id: str | None = Field(default=None, max_length=36)
    duree: int | None = Field(default=None, ge=5, le=30, strict=True)
    photos: list[SourceVideo] = Field(min_length=1, max_length=6)
    agencement: str = Field(default="", max_length=1200)
    liaisons: list[Literal["coupe", "meme", "gauche", "centre", "droite"]] = Field(default_factory=list, max_length=5)
    montage: Literal["montage", "continue"] = "montage"
    qualite: Literal["720p", "1080p"] = "720p"
    cle_demande: str = Field(pattern=r"^[a-fA-F0-9-]{36}$")


class DemandeReperage(BaseModel):
    photos: list[str] = Field(min_length=1, max_length=6)
    images: list[str] = Field(min_length=3, max_length=10)


@routeur.post("/reperage")
async def reperer(request: Request, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    """Analyse de vues prélevées sur l'appareil ; aucun octet vidéo ne va à Higgsfield."""
    if not (acces_ia.gratuit_proprietaire(compte) or vente_video_disponible()):
        raise HTTPException(503, "La préparation vidéo n'est pas encore ouverte sur ce compte.")
    if not reglages.OPENAI_API_KEY:
        raise HTTPException(503, "L'analyse du repérage n'est pas encore disponible.")
    if not acces_ia.gratuit_proprietaire(compte):
        limites.verifier(s, compte.id, "video")
        if credits_video.solde(s, compte.id) < 1:
            raise HTTPException(402, "Ajoutez des crédits vidéo avant de préparer cette visite.")
    contenu = bytearray()
    async for morceau in request.stream():
        contenu.extend(morceau)
        if len(contenu) > 3_300_000:
            raise HTTPException(413, "Les images extraites de la vidéo sont trop lourdes.")
    try:
        demande = DemandeReperage.model_validate(json.loads(contenu))
        vues = [video_reperage.decoder_image(image) for image in demande.images]
        planche_video = video_reperage.planche(vues)
    except (ValueError, TypeError) as erreur:
        raise HTTPException(400, str(erreur)) from erreur
    if len(set(demande.photos)) != len(demande.photos):
        raise HTTPException(400, "Choisissez chaque photo une seule fois.")
    photos = [_photo(s, compte, ident) for ident in demande.photos]
    if len({photo.logement_id for photo in photos}) != 1:
        raise HTTPException(400, "Les photos doivent venir du même logement.")
    try:
        planche_photos = video_reperage.planche([stockage.lire(p.cle_originale) for p in photos], colonnes=3)
        analyse = await openai_vision.analyser_reperage(planche_video, planche_photos)
    except Exception as erreur:
        logging.getLogger(__name__).warning("Repérage vidéo indisponible : %s", type(erreur).__name__)
        raise HTTPException(503, "Le repérage n'a pas abouti. Vous pouvez décrire les pièces vous-même, sans lancer de vidéo.") from erreur
    return video_reperage.proposition(analyse)


def _photo(s: Session, compte: Compte, photo_id: str) -> Photo:
    p = s.get(Photo, photo_id)
    if not p or p.logement.compte_id != compte.id or p.supprime_le:
        raise HTTPException(404, "Photo introuvable.")
    return p


def _video(s: Session, compte: Compte, video_id: str) -> Video:
    v = s.get(Video, video_id)
    logement = s.get(Logement, v.logement_id) if v else None
    if not logement or logement.compte_id != compte.id or v.supprime_le:
        raise HTTPException(404, "Vidéo introuvable.")
    return v


def _vue(v: Video) -> dict:
    plans = (v.requetes or {}).get("clips", [])
    return {"id": v.id, "statut": v.statut, "duree": (v.plan or {}).get("duree", 5),
            "qualite": (v.plan or {}).get("qualite", "720p"), "montage": (v.plan or {}).get("montage", "montage"),
            "erreur": v.erreur, "url": stockage.url_privee(v.cle_video) if v.cle_video else "",
            "plans_prets": sum(bool(p.get("cle_clip")) for p in plans),
            "plans_total": 1 if (v.plan or {}).get("schema") == 3 else len((v.plan or {}).get("sources", [])) or 1,
            "clips": [{"photo_id": p["photo_id"], "url": stockage.url_privee(p["cle_clip"])}
                      for p in plans if p.get("cle_clip")]}


def _rembourser_echec(s: Session, v: Video, compte: Compte) -> None:
    reserves = int((v.plan or {}).get("credits_reserves") or 0)
    if not reserves:
        return
    reference = f"video:{v.id}:remboursement"
    deja = s.scalar(select(MouvementCreditVideo.id).where(
        MouvementCreditVideo.compte_id == compte.id, MouvementCreditVideo.reference == reference))
    if not deja:
        credits_video.mouvement(s, compte, reserves, "Remboursement d'une vidéo en échec", reference)


def _reserver(s: Session, compte: Compte, sources: list[SourceVideo], demande: str, cle: str | None, duree: int | None = None,
             agencement: str = "", liaisons: list[str] | None = None, montage: str = "montage", qualite: str = "720p") -> Video:
    proprietaire = acces_ia.gratuit_proprietaire(compte)
    if not (proprietaire or vente_video_disponible()) or not higgsfield_video.disponible():
        raise HTTPException(503, "La création vidéo n'est pas encore ouverte sur ce compte.")
    duree = duree if duree is not None else len(sources) * 5
    if duree not in (5, 10, 15, 20, 25, 30):
        raise HTTPException(422, "Choisissez 5, 10, 15, 20, 25 ou 30 secondes.")
    references = reglages.VIDEO_MODELE == higgsfield_video.MODELE_REFERENCE
    if qualite == "1080p" and not references:
        raise HTTPException(503, "La qualité 1080p demande le moteur de visite actuellement indisponible.")
    liaisons = liaisons or []
    if liaisons and len(liaisons) != len(sources) - 1:
        raise HTTPException(422, "Indiquez un passage pour chaque paire de photos consécutives.")
    if montage == "continue" and len(sources) > 1 and (len(liaisons) != len(sources) - 1 or "coupe" in liaisons):
        raise HTTPException(422, "Pour demander une visite fluide, confirmez d’abord le passage réel entre chaque pièce.")
    if references and len(sources) > 2 * (duree // 5):
        raise HTTPException(422, f"Choisissez au plus {2 * (duree // 5)} photos pour {duree} secondes.")
    duree_source = duree if references else next(n for n in (5, 10, 20, 30) if n * len(sources) >= duree)
    if reglages.VIDEO_MODELE == higgsfield_video.MODELE_KLING and duree_source > 10:
        raise HTTPException(422, "Ajoutez des photos : ce moteur accepte jusqu’à 10 secondes par plan.")
    compte_id = compte.id
    s.rollback()
    s.execute(update(Compte).where(Compte.id == compte_id).values(photos_offertes_utilisees=Compte.photos_offertes_utilisees))
    s.expire_all()
    compte = s.get(Compte, compte_id)
    if not compte or compte.statut != "actif":
        raise HTTPException(403, "Ce compte n'est plus actif.")
    proprietaire = acces_ia.gratuit_proprietaire(compte)
    if not (proprietaire or vente_video_disponible()):
        raise HTTPException(503, "La création vidéo n'est pas encore ouverte sur ce compte.")
    if cle:
        deja = s.scalar(select(Video).where(Video.cle_demande == cle))
        if deja:
            _video(s, compte, deja.id)
            if ((deja.plan or {}).get("duree") != duree or (deja.plan or {}).get("demande") != demande
                    or (deja.plan or {}).get("selection") != _selection(sources)
                    or (deja.plan or {}).get("agencement", "") != agencement
                    or (deja.plan or {}).get("liaisons", []) != liaisons
                    or (deja.plan or {}).get("montage", "montage") != montage
                    or (deja.plan or {}).get("qualite", "720p") != qualite):
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
            _rembourser_echec(s, en_cours, compte)
            s.flush()
        else:
            raise HTTPException(409, "Une vidéo de ce logement est déjà en cours. Retrouvez son suivi avant de recommencer.")
    debut = maintenant() - timedelta(days=1)
    nb = s.scalar(select(func.count(Video.id)).where(Video.logement_id == logement_id, Video.cree_le >= debut)) or 0
    if nb >= 5 and not proprietaire:
        raise HTTPException(429, "Limite de cinq projets vidéo par logement et par jour atteinte.")
    plans = []
    if reglages.VIDEO_MODELE not in higgsfield_video.MODELES:
        raise HTTPException(503, "Le moteur vidéo doit être vérifié avant un nouvel essai.")
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
    portes = {"coupe": "unconfirmed passage: use a cut", "meme": "same room; stay in this space",
              "gauche": "confirmed left doorway", "centre": "confirmed opening straight ahead", "droite": "confirmed right doorway"}
    carte = " ".join(f"Reference image {i + 1} to {i + 2}: {portes[choix]}." for i, choix in enumerate(liaisons))
    disposition = f"{carte}\n{agencement}".strip()
    prompt_continu = (preparer_visite_continue(demande, [p.mouvement for p in sources], duree,
                      [identifier_piece(p.analyse) for p in photos], disposition, montage) if references else None)
    if prompt_continu and len(prompt_continu) > 10000:
        raise HTTPException(422, "Votre demande vidéo est trop longue. Raccourcissez le texte avant de confirmer.")
    reserves = 0 if proprietaire else duree // 5 * (2 if qualite == "1080p" else 1)
    if reserves and credits_video.solde(s, compte.id) < reserves:
        raise HTTPException(402, f"Cette vidéo de {duree} secondes en {qualite} utilise {reserves} crédits vidéo. Votre solde reste disponible pour une durée ou une qualité inférieure.")
    v = Video(logement_id=logement_id, cle_demande=cle, statut="preparation",
              plan={"schema": 3 if references else 2, "photo_id": photos[0].id, "duree": duree, "duree_source": duree_source, "montage_exact": True, "demande": demande,
                    "agencement": agencement, "liaisons": liaisons, "montage": montage, "qualite": qualite,
                    "credits_reserves": reserves,
                    "selection": _selection(sources), "sources": plans,
                    "modele": reglages.VIDEO_MODELE, "direction_version": VERSION,
                    "prompt_continu": prompt_continu,
                    "directions": [{"mouvement": mouvement_du_plan(p.mouvement, i),
                                    "prompt": preparer_consigne(demande, p.mouvement, i, len(sources), duree_source)}
                                   for i, p in enumerate(sources)]}, requetes={"clips": []})
    s.add(v)
    s.flush()
    if reserves:
        credits_video.mouvement(s, compte, -reserves, f"Essai vidéo de {duree} secondes", f"video:{v.id}:reservation")
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
            asyncio.run(_poursuivre(fabrique, video_id))
        finally:
            with _verrou:
                _planifies.discard(cle)
    _ouvriers.submit(travail)


@routeur.post("/visites")
def creer_visite(d: DemandeVisite, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    brouillon = None
    if d.brouillon_id:
        brouillon = s.get(Brouillon, d.brouillon_id)
        if not brouillon or brouillon.compte_id != compte.id:
            raise HTTPException(404, "Brouillon introuvable.")
        if brouillon.video_id:
            deja = _video(s, compte, brouillon.video_id)
            if deja.cle_demande != d.cle_demande:
                raise HTTPException(409, "Cette préparation a déjà été lancée. Retrouvez-la dans Mes créations.")
    v = _reserver(s, compte, d.photos, d.demande, d.cle_demande, d.duree, d.agencement.strip(), d.liaisons, d.montage, d.qualite)
    if brouillon:
        brouillon.video_id = v.id
        s.commit()
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


async def _poursuivre(fabrique, video_id: str, pause: float = 5, tours: int = 360) -> None:
    echecs = 0
    for _ in range(tours):
        await _avancer(fabrique, video_id)
        with fabrique() as s:
            v = s.get(Video, video_id)
            if not v or v.statut not in EN_COURS:
                return
            echecs = echecs + 1 if v.erreur else 0
            if echecs >= 3:
                return  # Reprise ultérieure bornée, même intention fournisseur.
        await asyncio.sleep(pause)


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
        if not compte or compte.statut != "actif" or not (acces_ia.gratuit_proprietaire(compte) or int((v.plan or {}).get("credits_reserves") or 0) > 0) or not higgsfield_video.disponible():
            v.statut, v.erreur = "echec", "La création vidéo n'est plus disponible sur ce compte."
            v.traitement_jusqu_au = None
            if compte:
                _rembourser_echec(s, v, compte)
            s.commit()
            return
        # Les anciens clips conservent exactement leur reçu et leur idempotence.
        if (v.plan or {}).get("schema") not in (2, 3):
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
        references = v.plan.get("schema") == 3
        while len(plans) < (1 if references else len(sources)):
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
                if references:
                    image_urls = list(plan.get("image_urls") or [])
                    for source_plan in sources[len(image_urls):]:
                        source = stockage.lire(source_plan["cle_source"])
                        image_urls.append(await higgsfield_video.preparer_image(images.preparer_envoi_ia(source)))
                        plan["image_urls"] = image_urls
                        sauver()
                elif not plan.get("image_url"):
                    source = stockage.lire(sources[index]["cle_source"])
                    plan["image_url"] = await higgsfield_video.preparer_image(images.preparer_envoi_ia(source))
                    sauver()
                s.expire(compte)
                if compte.statut != "actif":
                    raise RuntimeError("Compte inactif.")
                # L'intention et le modèle sont figés à la confirmation, y compris
                # lors d'une réponse perdue ou d'un changement ultérieur de réglage.
                directions = v.plan.get("directions")
                prompt = directions[index]["prompt"] if directions else CONSIGNE_FIDELITE + v.plan.get("demande", "")
                modele = v.plan.get("modele", higgsfield_video.MODELE)
                if references:
                    plan.update(await higgsfield_video.soumettre_references(plan["image_urls"], v.plan["prompt_continu"], v.plan["duree"], plan["idempotence"], v.plan.get("qualite", "720p")))
                else:
                    plan.update(await higgsfield_video.soumettre(plan["image_url"], prompt, v.plan.get("duree_source", 5), plan["idempotence"], modele))
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
                    _rembourser_echec(s, v, compte)
                    sauver()
                    return
                else:
                    v.statut = "clips"
            if all(p.get("cle_clip") for p in plans):
                if len(plans) == 1 and not v.plan.get("montage_exact"):
                    v.cle_video = plans[0]["cle_clip"]
                else:
                    v.statut = "montage"
                    sauver(minutes=15)
                    contenu = video_montage.assembler([stockage.lire(p["cle_clip"]) for p in plans], v.plan["duree"], v.plan.get("qualite", "720p"))
                    v.cle_video = stockage.ecrire(f"prive/videos/{v.id}/video.mp4", contenu, "video/mp4")
                v.statut, v.erreur = "prete", ""
            sauver()
        except Exception as erreur:
            s.rollback()
            v = s.get(Video, video_id)
            if v.traitement_jeton == jeton:
                if isinstance(erreur, httpx.HTTPStatusError) and erreur.response.status_code == 402:
                    v.statut, v.erreur = "echec", "Le solde du service vidéo est insuffisant. Les clips déjà prêts sont conservés. Aucun nouvel essai ne sera lancé automatiquement après la recharge."
                elif isinstance(erreur, httpx.HTTPStatusError) and erreur.response.status_code in {400, 401, 403, 404, 422}:
                    v.statut, v.erreur = "echec", "Le fournisseur n'a pas accepté un plan. Les clips déjà prêts restent disponibles. Vérifiez la connexion et le solde du service avant un nouvel essai."
                else:
                    v.erreur = "Le suivi est momentanément interrompu. Revenez sur cette vidéo : le même projet sera vérifié sans recréer les plans terminés."
                if v.statut == "echec":
                    _rembourser_echec(s, v, compte)
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
    videos = s.scalars(select(Video).where(Video.logement_id == p.logement_id, Video.supprime_le.is_(None))
                       .order_by(Video.cree_le.desc(), Video.id.desc())).all()
    v = next((item for item in videos if (item.plan or {}).get("photo_id") == p.id or
              any(source.get("photo_id") == p.id for source in (item.plan or {}).get("sources", []))), None)
    if v:
        vue = _vue(v)
        _planifier(s, v)
        return vue
    return None

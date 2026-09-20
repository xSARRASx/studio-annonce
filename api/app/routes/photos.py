"""Les photos : dépôt, analyse, essais de retouche, téléchargement HD (c'est là que le crédit est compté)."""
from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import credits, gemini, images, retouche, stockage
from ..config import reglages
from ..db import session
from ..models import Compte, Logement, Photo, Version, maintenant
from .auth import compte_courant

routeur = APIRouter(prefix="/photos", tags=["photos"])


def _photo_du_compte(s: Session, compte: Compte, photo_id: str) -> Photo:
    p = s.get(Photo, photo_id)
    if not p or p.logement.compte_id != compte.id:
        raise HTTPException(404, "Photo introuvable.")
    return p


def _vue_version(v: Version) -> dict:
    return {"id": v.id, "numero": v.numero, "consigne": v.consigne, "depuis": v.depuis_version_id,
            "apercu": stockage.url_publique(v.cle_apercu), "hd": bool(v.cle_hd), "cree_le": v.cree_le.isoformat()}


def _vue_photo(p: Photo) -> dict:
    limite = reglages.ESSAIS_MAX_PHOTO_OFFERTE if p.offerte else reglages.ESSAIS_MAX_PAR_PHOTO
    restants = max(0, limite - p.essais)
    return {
        "id": p.id, "logement_id": p.logement_id, "ordre": p.ordre, "offerte": bool(p.offerte),
        "vignette": stockage.url_publique(p.cle_vignette), "analyse": p.analyse,
        "essais": p.essais, "essais_restants": restants,
        "alerte": restants if restants in reglages.ALERTES_ESSAIS_RESTANTS else None,
        "version_gardee": p.version_gardee_id, "credite_le": p.credite_le.isoformat() if p.credite_le else None,
        "reprise_jusqu_au": (p.credite_le + timedelta(days=reglages.JOURS_DE_REPRISE)).isoformat() if p.credite_le else None,
        "versions": [_vue_version(v) for v in p.versions],
    }


@routeur.post("/{logement_id}")
async def deposer(logement_id: str, fichier: UploadFile = File(...), compte: Compte = Depends(compte_courant),
                  s: Session = Depends(session)):
    logement = s.get(Logement, logement_id)
    if not logement or logement.compte_id != compte.id:
        raise HTTPException(404, "Logement introuvable.")
    donnees = await fichier.read()
    if len(donnees) > 30 * 1024 * 1024:
        raise HTTPException(413, "Photo trop lourde (30 Mo maximum).")
    try:
        original = images.preparer_envoi_ia(donnees)   # on ne garde que ce dont l'IA a besoin : 2048 px
    except Exception:
        raise HTTPException(400, "Ce fichier n'est pas une image lisible.")
    photo = Photo(logement_id=logement.id, ordre=len(logement.photos), cle_originale="")
    s.add(photo); s.flush()
    photo.cle_originale = stockage.ecrire(f"{compte.id}/{logement.id}/{photo.id}/original.jpg", original, "image/jpeg")
    photo.cle_vignette = stockage.ecrire(f"{compte.id}/{logement.id}/{photo.id}/vignette.webp", images.vignette(original), "image/webp")
    # La photo offerte : la première du compte, une seule fois
    if compte.photos_offertes_utilisees < reglages.PHOTO_OFFERTE_PAR_COMPTE:
        photo.offerte = 1
        compte.photos_offertes_utilisees += 1
    s.commit()
    return _vue_photo(photo)


@routeur.post("/{photo_id}/analyser")
async def analyser(photo_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    p = _photo_du_compte(s, compte, photo_id)
    p.analyse = await gemini.analyser(stockage.lire(p.cle_originale))
    s.commit()
    return _vue_photo(p)


class DemandeEssai(BaseModel):
    demande: str = ""                 # ce que le client tape ; vide = la consigne proposée par l'analyse
    depuis_version_id: str | None = None   # repartir d'un essai précédent ; None = depuis la photo d'origine


@routeur.post("/{photo_id}/essai")
async def essai(photo_id: str, d: DemandeEssai, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    p = _photo_du_compte(s, compte, photo_id)
    limite = reglages.ESSAIS_MAX_PHOTO_OFFERTE if p.offerte else reglages.ESSAIS_MAX_PAR_PHOTO
    if p.essais >= limite:
        raise HTTPException(402, f"Cette photo a atteint ses {limite} essais. Continuez avec un nouveau crédit ou repartez d'une photo propre.")
    if not p.offerte and p.credite_le is None and credits.solde(s, compte.id) <= 0:
        raise HTTPException(402, "Il faut au moins un crédit pour retoucher cette photo.")
    if p.credite_le and maintenant() > p.credite_le + timedelta(days=reglages.JOURS_DE_REPRISE):
        raise HTTPException(402, "La fenêtre de 7 jours est passée : un nouveau crédit permet de reprendre cette photo.")
    debut_jour = maintenant().replace(hour=0, minute=0, second=0, microsecond=0)
    essais_du_jour = s.execute(select(func.count(Version.id)).join(Photo).join(Logement)
                               .where(Logement.compte_id == compte.id, Version.cree_le >= debut_jour)).scalar() or 0
    if essais_du_jour >= reglages.ESSAIS_MAX_PAR_JOUR:
        raise HTTPException(429, "Limite d'essais du jour atteinte, revenez demain.")
    if d.depuis_version_id:
        base = s.get(Version, d.depuis_version_id)
        if not base or base.photo_id != p.id:
            raise HTTPException(404, "Version de départ introuvable.")
        source, historique = stockage.lire(base.cle_pleine), [v.consigne for v in p.versions if v.numero <= base.numero]
    else:
        source, historique = stockage.lire(p.cle_originale), []
    if d.demande.strip():
        consigne = await gemini.reformuler_demande(p.analyse, historique, d.demande.strip())
    else:
        consigne = (p.analyse or {}).get("consigne") or "Rends cette photo digne d'un photographe immobilier professionnel : lumière équilibrée, couleurs justes, netteté, verticales droites, sans rien changer d'autre."
    resultat = await retouche.retoucher(source, consigne)
    v = Version(photo_id=p.id, numero=len(p.versions) + 1, depuis_version_id=d.depuis_version_id, consigne=consigne,
                cle_apercu="", cle_pleine="")
    s.add(v); s.flush()
    base_cle = f"{compte.id}/{p.logement_id}/{p.id}/v{v.numero}"
    v.cle_pleine = stockage.ecrire(f"{base_cle}-pleine.jpg", resultat, "image/jpeg")
    v.cle_apercu = stockage.ecrire(f"{base_cle}-apercu.webp", images.apercu_filigrane(resultat), "image/webp")
    p.essais += 1
    s.commit()
    s.refresh(p)
    return _vue_photo(p)


@routeur.get("/{photo_id}")
def voir(photo_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    return _vue_photo(_photo_du_compte(s, compte, photo_id))


@routeur.post("/{photo_id}/versions/{version_id}/telecharger")
async def telecharger(photo_id: str, version_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    """Le seul endroit où un crédit est compté : au premier téléchargement HD d'une photo. Reprise libre 7 jours."""
    p = _photo_du_compte(s, compte, photo_id)
    v = s.get(Version, version_id)
    if not v or v.photo_id != p.id:
        raise HTTPException(404, "Version introuvable.")
    premiere_fois = p.credite_le is None
    if premiere_fois and not p.offerte:
        if credits.solde(s, compte.id) <= 0:
            raise HTTPException(402, "Il vous faut un crédit pour télécharger cette photo en haute qualité.")
        credits.mouvement(s, compte, -1, "Photo gardée en HD", p.id)
    if premiere_fois:
        p.credite_le = maintenant()
    elif maintenant() > p.credite_le + timedelta(days=reglages.JOURS_DE_REPRISE) and v.cle_hd == "":
        raise HTTPException(402, "La fenêtre de 7 jours est passée pour cette photo.")
    if not v.cle_hd:
        hd = await retouche.retoucher(stockage.lire(v.cle_pleine),
                                    "Reproduis exactement cette image, sans rien changer, en haute définition et parfaitement nette.", hd=True)
        v.cle_hd = stockage.ecrire(f"{compte.id}/{p.logement_id}/{p.id}/v{v.numero}-hd.jpg", hd, "image/jpeg")
    p.version_gardee_id = v.id
    s.commit()
    s.refresh(p)
    return Response(stockage.lire(v.cle_hd), media_type="image/jpeg",
                    headers={"Content-Disposition": f'attachment; filename="photo-{p.ordre + 1}.jpg"'})

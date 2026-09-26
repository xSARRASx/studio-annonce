"""Photos, historique et périodes de retouche. Un débit ne suit qu'une action explicite réussie."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from .. import credits, gemini, images, retouche, stockage
from ..config import reglages
from ..db import session
from ..models import Compte, Logement, OperationPhoto, Photo, ReprisePhoto, Version, identifiant, maintenant
from .auth import compte_courant

routeur = APIRouter(prefix="/photos", tags=["photos"])


def _utc(date: datetime | None) -> str | None:
    # Les dates SQL historiques sont UTC sans tzinfo ; l'API explicite ce fuseau.
    return date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z") if date else None


def _verrouiller_compte(s: Session, compte_id: str) -> Compte:
    # Évite une lecture périmée issue de l'authentification. L'UPDATE verrouille une
    # ligne sur PostgreSQL et acquiert le verrou d'écriture SQLite, même sans changement.
    s.rollback()
    s.execute(update(Compte).where(Compte.id == compte_id)
              .values(photos_offertes_utilisees=Compte.photos_offertes_utilisees))
    s.expire_all()
    compte = s.get(Compte, compte_id)
    if not compte:
        raise HTTPException(401, "Compte introuvable.")
    return compte


def _photo_du_compte(s: Session, compte: Compte, photo_id: str) -> Photo:
    p = s.get(Photo, photo_id)
    if not p or p.logement.compte_id != compte.id:
        raise HTTPException(404, "Photo introuvable.")
    return p


def _periode(s: Session, p: Photo) -> dict:
    reprise = s.scalars(select(ReprisePhoto).where(ReprisePhoto.photo_id == p.id)
                        .order_by(ReprisePhoto.commence_le.desc(), ReprisePhoto.id.desc())).first()
    debut = reprise.commence_le if reprise else p.credite_le
    fin = debut + timedelta(days=reglages.JOURS_DE_REPRISE) if debut else None
    limite = reglages.ESSAIS_MAX_PAR_PHOTO if reprise or not p.offerte else reglages.ESSAIS_MAX_PHOTO_OFFERTE
    essais_cycle = p.essais - (reprise.essais_depart if reprise else 0)
    expiree = bool(fin and maintenant() >= fin)
    return {"cycle_id": reprise.id if reprise else "initial", "debut": debut, "fin": fin,
            "limite": limite, "essais_cycle": essais_cycle,
            "expiree": expiree, "necessaire": expiree or essais_cycle >= limite}


def _vue_version(v: Version) -> dict:
    return {"id": v.id, "numero": v.numero, "consigne": v.consigne, "depuis": v.depuis_version_id,
            "apercu": stockage.url_publique(v.cle_apercu), "hd": bool(v.cle_hd), "cree_le": _utc(v.cree_le)}


def _vue_photo(s: Session, p: Photo) -> dict:
    periode = _periode(s, p)
    restants = max(0, periode["limite"] - periode["essais_cycle"])
    return {
        "id": p.id, "logement_id": p.logement_id, "ordre": p.ordre, "offerte": bool(p.offerte),
        "vignette": stockage.url_publique(p.cle_vignette), "analyse": p.analyse,
        "essais": p.essais, "essais_cycle": periode["essais_cycle"], "essais_restants": restants,
        "alerte": restants if restants in reglages.ALERTES_ESSAIS_RESTANTS else None,
        "version_gardee": p.version_gardee_id, "credite_le": _utc(p.credite_le),
        "reprise_jusqu_au": _utc(periode["fin"]), "reprise_commence_le": _utc(periode["debut"]),
        "reprise_expiree": periode["expiree"], "reprise_necessaire": periode["necessaire"],
        "cycle_id": periode["cycle_id"], "versions": [_vue_version(v) for v in p.versions],
    }


def _operation_libre(s: Session, photo_id: str) -> OperationPhoto | None:
    op = s.get(OperationPhoto, photo_id)
    if op and op.statut == "en_cours" and maintenant() < op.expire_le:
        raise HTTPException(409, "Une opération est déjà en cours sur cette photo. Patientez avant de réessayer.")
    return op


def _reserver(s: Session, p: Photo, compte_id: str, nature: str) -> str:
    op = _operation_libre(s, p.id)
    if op is None:
        op = OperationPhoto(photo_id=p.id, compte_id=compte_id, nature=nature)
        s.add(op)
    op.jeton = identifiant()
    op.nature, op.statut = nature, "en_cours"
    op.expire_le = maintenant() + timedelta(minutes=10)
    jeton = op.jeton
    s.commit()  # aucun verrou SQL n'est conservé pendant la génération
    return jeton


def _operation_a_terminer(s: Session, photo_id: str, jeton: str) -> OperationPhoto:
    op = s.get(OperationPhoto, photo_id)
    if not op or op.jeton != jeton or op.statut != "en_cours" or maintenant() >= op.expire_le:
        raise HTTPException(409, "Cette opération a expiré. Aucun crédit n'a été consommé ; réessayez.")
    return op


def _abandonner(s: Session, compte_id: str, photo_id: str, jeton: str) -> None:
    _verrouiller_compte(s, compte_id)
    op = s.get(OperationPhoto, photo_id)
    if op and op.jeton == jeton and op.statut == "en_cours":
        op.statut = "echec"
    s.commit()


@routeur.post("/{logement_id}")
async def deposer(logement_id: str, fichier: UploadFile = File(...), compte: Compte = Depends(compte_courant),
                  s: Session = Depends(session)):
    compte_id = compte.id
    logement = s.get(Logement, logement_id)
    if not logement or logement.compte_id != compte_id:
        raise HTTPException(404, "Logement introuvable.")
    donnees = await fichier.read(30 * 1024 * 1024 + 1)
    if len(donnees) > 30 * 1024 * 1024:
        raise HTTPException(413, "Photo trop lourde (30 Mo maximum).")
    try:
        original = images.preparer_envoi_ia(donnees)
    except Exception:
        raise HTTPException(400, "Ce fichier n'est pas une image lisible.")
    compte = _verrouiller_compte(s, compte_id)
    logement = s.get(Logement, logement_id)
    if not logement or logement.compte_id != compte_id:
        raise HTTPException(404, "Logement introuvable.")
    photo = Photo(logement_id=logement.id, ordre=len(logement.photos), cle_originale="")
    s.add(photo); s.flush()
    photo.cle_originale = stockage.ecrire(f"{compte.id}/{logement.id}/{photo.id}/original.jpg", original, "image/jpeg")
    photo.cle_vignette = stockage.ecrire(f"{compte.id}/{logement.id}/{photo.id}/vignette.webp", images.vignette(original), "image/webp")
    if compte.photos_offertes_utilisees < reglages.PHOTO_OFFERTE_PAR_COMPTE:
        photo.offerte = 1
        compte.photos_offertes_utilisees += 1
    s.commit()
    return _vue_photo(s, photo)


@routeur.post("/{photo_id}/analyser")
async def analyser(photo_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    p = _photo_du_compte(s, compte, photo_id)
    if not p.analyse:
        p.analyse = await gemini.analyser(stockage.lire(p.cle_originale))
        s.commit()
    return _vue_photo(s, p)


class DemandeEssai(BaseModel):
    demande: str = Field(default="", max_length=4000)
    depuis_version_id: str | None = None


@routeur.post("/{photo_id}/essai")
async def essai(photo_id: str, d: DemandeEssai, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    compte_id = compte.id
    compte = _verrouiller_compte(s, compte_id)
    p = _photo_du_compte(s, compte, photo_id)
    periode = _periode(s, p)
    if periode["expiree"]:
        raise HTTPException(402, "La période de retouche est terminée. Reprenez explicitement cette photo avec un crédit.")
    if periode["essais_cycle"] >= periode["limite"]:
        raise HTTPException(402, f"Les {periode['limite']} essais de cette période sont utilisés. Un crédit permet d'ouvrir une nouvelle période.")
    if not p.offerte and p.credite_le is None and credits.solde(s, compte_id) <= 0:
        raise HTTPException(402, "Il faut au moins un crédit pour retoucher cette photo.")
    debut_jour = maintenant().replace(hour=0, minute=0, second=0, microsecond=0)
    essais_du_jour = s.scalar(select(func.count(Version.id)).join(Photo).join(Logement)
                              .where(Logement.compte_id == compte_id, Version.cree_le >= debut_jour)) or 0
    reserves = s.scalar(select(func.count(OperationPhoto.photo_id)).where(
        OperationPhoto.compte_id == compte_id, OperationPhoto.nature == "essai",
        OperationPhoto.statut == "en_cours", OperationPhoto.expire_le > maintenant())) or 0
    if essais_du_jour + reserves >= reglages.ESSAIS_MAX_PAR_JOUR:
        raise HTTPException(429, "Limite d'essais du jour atteinte, revenez demain (remise à zéro à minuit UTC).")
    if d.depuis_version_id:
        base = s.get(Version, d.depuis_version_id)
        if not base or base.photo_id != p.id:
            raise HTTPException(404, "Version de départ introuvable.")
        source, historique = stockage.lire(base.cle_pleine), [v.consigne for v in p.versions if v.numero <= base.numero]
    else:
        source, historique = stockage.lire(p.cle_originale), []
    analyse = p.analyse
    jeton = _reserver(s, p, compte_id, "essai")
    try:
        if d.demande.strip():
            consigne = await gemini.reformuler_demande(analyse, historique, d.demande.strip())
        else:
            consigne = (analyse or {}).get("consigne") or "Rends cette photo digne d'un photographe immobilier professionnel : lumière équilibrée, couleurs justes, netteté, verticales droites, sans rien changer d'autre."
        resultat = await retouche.retoucher(source, consigne)
        # Stockage unique par opération : même une réponse tardive ne remplace pas une version.
        base_cle = f"{compte_id}/{p.logement_id}/{photo_id}/{jeton}"
        pleine = stockage.ecrire(f"{base_cle}-pleine.jpg", resultat, "image/jpeg")
        apercu = stockage.ecrire(f"{base_cle}-apercu.webp", images.apercu_filigrane(resultat), "image/webp")
        compte = _verrouiller_compte(s, compte_id)
        p = _photo_du_compte(s, compte, photo_id)
        op = _operation_a_terminer(s, photo_id, jeton)
        periode = _periode(s, p)
        if periode["expiree"]:
            raise HTTPException(402, "La période de retouche s'est terminée pendant le traitement. Aucun crédit supplémentaire n'a été consommé.")
        v = Version(photo_id=p.id, numero=max((v.numero for v in p.versions), default=0) + 1,
                    depuis_version_id=d.depuis_version_id, consigne=consigne,
                    cle_apercu=apercu, cle_pleine=pleine, cree_le=maintenant())
        s.add(v)
        p.essais += 1
        op.statut = "terminee"
        s.commit()
        s.refresh(p)
        return _vue_photo(s, p)
    except BaseException:
        _abandonner(s, compte_id, photo_id, jeton)
        raise


class DemandeReprise(BaseModel):
    cycle_id: str = Field(min_length=1, max_length=24)


@routeur.post("/{photo_id}/reprendre")
def reprendre(photo_id: str, d: DemandeReprise, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    compte_id = compte.id
    compte = _verrouiller_compte(s, compte_id)
    p = _photo_du_compte(s, compte, photo_id)
    periode = _periode(s, p)
    if d.cycle_id != periode["cycle_id"]:
        raise HTTPException(409, "Cette photo a déjà changé de période. Actualisez-la ; aucun crédit supplémentaire n'a été consommé.")
    if not periode["necessaire"]:
        return _vue_photo(s, p)  # une période active n'est jamais facturée à nouveau
    _operation_libre(s, p.id)
    if credits.solde(s, compte_id) < 1:
        raise HTTPException(402, "Il vous faut un crédit pour reprendre cette photo.")
    instant = maintenant()
    reprise = ReprisePhoto(photo_id=p.id, commence_le=instant, essais_depart=p.essais)
    s.add(reprise); s.flush()
    credits.mouvement(s, compte, -1, "Nouvelle période de retouche photo", f"reprise:{reprise.id}")
    # Une reprise peut suivre l'épuisement des essais avant le premier téléchargement.
    # Ce crédit inclut la HD, sans second débit au prochain téléchargement.
    if p.credite_le is None:
        p.credite_le = instant
    s.commit()
    return _vue_photo(s, p)


@routeur.get("/{photo_id}")
def voir(photo_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    return _vue_photo(s, _photo_du_compte(s, compte, photo_id))


@routeur.post("/{photo_id}/versions/{version_id}/telecharger")
async def telecharger(photo_id: str, version_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    compte_id = compte.id
    compte = _verrouiller_compte(s, compte_id)
    p = _photo_du_compte(s, compte, photo_id)
    v = s.get(Version, version_id)
    if not v or v.photo_id != p.id:
        raise HTTPException(404, "Version introuvable.")
    periode = _periode(s, p)
    if p.credite_le is None and not p.offerte and credits.solde(s, compte_id) < 1:
        raise HTTPException(402, "Il vous faut un crédit pour télécharger cette photo en haute qualité.")
    # Une HD déjà produite reste récupérable, même après les sept jours.
    if periode["expiree"] and not v.cle_hd:
        raise HTTPException(402, "La période est terminée. Reprenez explicitement la photo avant de produire une autre version HD.")
    if v.cle_hd:
        contenu = stockage.lire(v.cle_hd)
        cle_hd = v.cle_hd
    else:
        contenu = stockage.lire(v.cle_pleine)
        cle_hd = ""
    jeton = _reserver(s, p, compte_id, "hd")
    try:
        if not cle_hd:
            contenu = await retouche.retoucher(contenu,
                "Reproduis exactement cette image, sans rien changer, en haute définition et parfaitement nette.", hd=True)
            cle_hd = stockage.ecrire(f"{compte_id}/{p.logement_id}/{p.id}/{jeton}-hd.jpg", contenu, "image/jpeg")
            contenu = stockage.lire(cle_hd)  # valider l'accès au fichier AVANT tout débit
        try:
            image_verifiee = images.ouvrir(contenu)
            image_verifiee.close()
        except Exception:
            raise HTTPException(502, "Le fichier HD reçu n'est pas une image lisible. Aucun nouveau crédit n'a été consommé.")
        compte = _verrouiller_compte(s, compte_id)
        p = _photo_du_compte(s, compte, photo_id)
        op = _operation_a_terminer(s, photo_id, jeton)
        v = s.get(Version, version_id)
        periode = _periode(s, p)
        if periode["expiree"] and not v.cle_hd:
            raise HTTPException(402, "La période s'est terminée pendant le traitement. Aucun crédit supplémentaire n'a été consommé.")
        premiere_fois = p.credite_le is None
        credit_consomme = premiere_fois and not p.offerte
        if credit_consomme:
            if credits.solde(s, compte_id) < 1:
                raise HTTPException(402, "Il vous faut un crédit pour télécharger cette photo en haute qualité.")
            credits.mouvement(s, compte, -1, "Photo gardée en HD", p.id)
        if premiere_fois:
            p.credite_le = maintenant()
        v.cle_hd = cle_hd
        p.version_gardee_id = v.id
        op.statut = "terminee"
        s.commit()
        fin = _periode(s, p)["fin"]
        return Response(contenu, media_type="image/jpeg", headers={
            "Content-Disposition": f'attachment; filename="photo-{p.ordre + 1}.jpg"',
            "X-Photo-Credit-Consomme": "1" if credit_consomme else "0",
            "X-Photo-Offerte": "1" if premiere_fois and p.offerte else "0",
            "X-Photo-Reprise-Jusqu-Au": _utc(fin) or "",
        })
    except BaseException:
        _abandonner(s, compte_id, photo_id, jeton)
        raise

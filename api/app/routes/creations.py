"""Corbeille du compte : aucune purge de fichiers ni remise à zéro des crédits."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import stockage
from ..db import session
from ..models import Compte, Logement, Photo, Video, maintenant
from .auth import compte_complet
from .photos import _operation_libre, _utc, _verrouiller_compte
from .videos import EN_COURS, _vue

routeur = APIRouter(prefix="/creations", tags=["creations"])
Nature = Literal["photos", "videos"]


def _element(s, compte, nature, ident):
    item = s.get(Photo if nature == "photos" else Video, ident)
    home = s.get(Logement, item.logement_id) if item else None
    if not home or home.compte_id != compte.id:
        raise HTTPException(404, "Création introuvable.")
    return item, home


@routeur.get("")
def lister(corbeille: bool = False, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    resultat = []
    for model, nature in ((Photo, "photos"), (Video, "videos")):
        # Les photos actives sont déjà dans la bibliothèque ; ici, vidéos et corbeille.
        if model is Photo and not corbeille:
            continue
        items = s.scalars(select(model).join(Logement, model.logement_id == Logement.id)
                          .where(Logement.compte_id == compte.id,
                                 model.supprime_le.is_not(None) if corbeille else model.supprime_le.is_(None))).all()
        for item in items:
            home = s.get(Logement, item.logement_id)
            plan = item.plan or {} if model is Video else {}
            source_id = plan.get("photo_id") or next((p.get("photo_id") for p in plan.get("sources", []) if p.get("photo_id")), "")
            photo = item if model is Photo else s.get(Photo, source_id)
            entree = {"id": item.id, "nature": nature, "logement": home.nom,
                      "titre": ((item.analyse or {}).get("piece") or f"Photo {item.ordre + 1}") if model is Photo else f"Vidéo · {home.nom}",
                      "vignette": stockage.url_publique(photo.cle_vignette) if photo else "",
                      "cree_le": _utc(item.cree_le), "supprime_le": _utc(item.supprime_le),
                      "en_cours": model is Video and item.statut in EN_COURS}
            if model is Video:
                entree.update(_vue(item))
            resultat.append(entree)
    return sorted(resultat, key=lambda item: item["supprime_le"] or item["cree_le"], reverse=True)


@routeur.delete("/{nature}/{ident}")
def supprimer(nature: Nature, ident: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    compte = _verrouiller_compte(s, compte.id)
    item, home = _element(s, compte, nature, ident)
    if not item.supprime_le:
        if nature == "photos":
            _operation_libre(s, item.id)
            actifs = s.scalars(select(Video).where(Video.logement_id == home.id, Video.statut.in_(EN_COURS))).all()
            if any((v.plan or {}).get("photo_id") == ident or any(p.get("photo_id") == ident for p in (v.plan or {}).get("sources", [])) for v in actifs):
                raise HTTPException(409, "Cette photo est utilisée par une vidéo en cours. Attendez la fin de sa création.")
        elif item.statut in EN_COURS:
            raise HTTPException(409, "Cette vidéo est encore en cours. Attendez la fin de sa création avant de la supprimer.")
        item.supprime_le = maintenant()
    s.commit()
    return {"supprimee": True}


@routeur.post("/{nature}/{ident}/restaurer")
def restaurer(nature: Nature, ident: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    compte = _verrouiller_compte(s, compte.id)
    item, _ = _element(s, compte, nature, ident)
    item.supprime_le = None
    if nature == "photos":
        item.archive_le = None
    s.commit()
    return {"supprimee": False}

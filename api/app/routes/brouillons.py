"""Sauvegardes privées de préparation. Ne déclenchent jamais un fournisseur."""
import json
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db import session
from ..models import Brouillon, Compte, Logement, Photo, OperationPhoto, maintenant
from .auth import compte_complet
from .photos import _utc
from .. import stockage

routeur = APIRouter(prefix="/brouillons", tags=["brouillons"])
class Enregistrement(BaseModel):
    nature: Literal["video", "photo", "image"]
    donnees: dict = Field(default_factory=dict)

def lire(s, compte, ident):
    b = s.get(Brouillon, ident)
    if not b or b.compte_id != compte.id:
        raise HTTPException(404, "Brouillon introuvable.")
    return b

def vue(b):
    return {"id": b.id, "nature": b.nature, "donnees": b.donnees, "modifie_le": _utc(b.modifie_le), "video_id": b.video_id}

@routeur.get("")
def lister(compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    result = [vue(b) for b in s.scalars(select(Brouillon).where(Brouillon.compte_id == compte.id, Brouillon.video_id.is_(None)).order_by(Brouillon.modifie_le.desc()))]
    photos = s.scalars(select(Photo).join(Logement).where(Logement.compte_id == compte.id, Photo.archive_le.is_(None), Photo.supprime_le.is_(None))).all()
    for p in photos:
        operation = s.get(OperationPhoto, p.id)
        if operation and operation.statut == "en_cours" and operation.expire_le > maintenant():
            continue
        if not p.versions or p.demande_brouillon:
            result.append({"id": p.id, "nature": "photo", "photo_id": p.id, "titre": (p.analyse or {}).get("piece") or f"Photo {p.ordre + 1}", "vignette": stockage.url_publique(p.cle_vignette), "modifie_le": _utc(p.cree_le), "donnees": {"idea": p.demande_brouillon or ""}})
    return sorted(result, key=lambda item: item["modifie_le"] or "", reverse=True)

@routeur.get("/{ident}")
def voir(ident: str, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    return vue(lire(s, compte, ident))

@routeur.put("/{ident}")
def enregistrer(ident: str, d: Enregistrement, compte: Compte = Depends(compte_complet), s: Session = Depends(session)):
    import uuid
    try: uuid.UUID(ident)
    except ValueError: raise HTTPException(422, "Identifiant de brouillon invalide.")
    if len(json.dumps(d.donnees, ensure_ascii=False)) > 80000:
        raise HTTPException(422, "Ce brouillon contient trop de texte.")
    b = s.get(Brouillon, ident)
    if b and b.compte_id != compte.id:
        raise HTTPException(404, "Brouillon introuvable.")
    if b and b.video_id:
        raise HTTPException(409, "Cette préparation a déjà été lancée. Commencez un nouveau brouillon.")
    if not b:
        b = Brouillon(id=ident, compte_id=compte.id, nature=d.nature, donnees={})
        s.add(b)
    b.nature, b.donnees, b.modifie_le = d.nature, d.donnees, maintenant()
    s.commit()
    return vue(b)

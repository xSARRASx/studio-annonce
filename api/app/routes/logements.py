from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import stockage
from ..db import session
from ..models import Compte, Logement
from .auth import compte_courant

routeur = APIRouter(prefix="/logements", tags=["logements"])


class NouveauLogement(BaseModel):
    nom: str = "Mon logement"
    ville: str = ""
    type_annonce: str = "location"


def _vue(l: Logement) -> dict:
    return {"id": l.id, "nom": l.nom, "ville": l.ville, "type_annonce": l.type_annonce, "cree_le": l.cree_le.isoformat(),
            "photos": [{"id": p.id, "vignette": stockage.url_publique(p.cle_vignette), "essais": p.essais,
                        "gardee": bool(p.version_gardee_id)} for p in l.photos]}


@routeur.get("")
def lister(compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    return [_vue(l) for l in compte.logements]


@routeur.post("")
def creer(n: NouveauLogement, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    l = Logement(compte_id=compte.id, nom=n.nom, ville=n.ville, type_annonce=n.type_annonce)
    s.add(l); s.commit()
    return _vue(l)


@routeur.get("/{logement_id}")
def voir(logement_id: str, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    l = s.get(Logement, logement_id)
    if not l or l.compte_id != compte.id:
        raise HTTPException(404, "Logement introuvable.")
    return _vue(l)

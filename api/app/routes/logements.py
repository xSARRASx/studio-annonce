from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from urllib.parse import urlsplit, urlunsplit

from .. import acces_ia, stockage
from ..db import session
from ..models import Compte, Logement
from .auth import compte_courant
from .photos import _utc, _vue_version

routeur = APIRouter(prefix="/logements", tags=["logements"])


class NouveauLogement(BaseModel):
    nom: str = "Mon logement"
    ville: str = ""
    type_annonce: str = "location"
    source_url: str = Field(default="", max_length=1000)

    @field_validator("source_url")
    @classmethod
    def verifier_lien(cls, valeur: str) -> str:
        valeur = valeur.strip()
        if not valeur:
            return ""
        try:
            url = urlsplit(valeur)
            if url.scheme != "https" or not url.hostname or url.username or url.password:
                raise ValueError()
            # Les paramètres de recherche Airbnb/Booking contiennent des dates et
            # du suivi ; l'adresse de l'annonce suffit pour la retrouver.
            return urlunsplit(("https", url.netloc.lower(), url.path or "/", "", ""))
        except ValueError:
            raise ValueError("Collez un lien d’annonce HTTPS valide.") from None


def _vue(l: Logement, archives: bool = False) -> dict:
    return {"id": l.id, "nom": l.nom, "ville": l.ville, "type_annonce": l.type_annonce, "source_url": l.source_url or "", "cree_le": _utc(l.cree_le),
            "photos": [{"id": p.id, "vignette": stockage.url_publique(p.cle_vignette), "essais": p.essais,
                        "gardee": bool(p.version_gardee_id), "offerte": bool(p.offerte),
                        "creditee": bool(p.credite_le), "archivee": bool(p.archive_le),
                        "titre": (p.analyse or {}).get("piece") or f"Photo {p.ordre + 1}", "ordre": p.ordre,
                        "cree_le": _utc(p.cree_le), "original": stockage.url_publique(p.cle_originale),
                        "version_gardee": p.version_gardee_id,
                        "versions": [_vue_version(v, bool(acces_ia.gratuit_proprietaire(l.compte) or p.offerte or p.credite_le)) for v in p.versions]
                       } for p in l.photos if not p.supprime_le and (archives or not p.archive_le)]}


@routeur.get("")
def lister(archives: bool = False, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    return [_vue(l, archives=archives) for l in compte.logements]


@routeur.post("")
def creer(n: NouveauLogement, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    l = Logement(compte_id=compte.id, nom=n.nom, ville=n.ville, type_annonce=n.type_annonce, source_url=n.source_url)
    s.add(l); s.commit()
    return _vue(l)


@routeur.patch("/{logement_id}")
def modifier(logement_id: str, n: NouveauLogement, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    l = s.get(Logement, logement_id)
    if not l or l.compte_id != compte.id:
        raise HTTPException(404, "Logement introuvable.")
    if "nom" in n.model_fields_set:
        l.nom = n.nom.strip() or l.nom
    if "ville" in n.model_fields_set:
        l.ville = n.ville.strip()
    if "type_annonce" in n.model_fields_set:
        l.type_annonce = n.type_annonce
    if "source_url" in n.model_fields_set:
        l.source_url = n.source_url
    s.commit()
    return _vue(l)


@routeur.get("/{logement_id}")
def voir(logement_id: str, archives: bool = False, compte: Compte = Depends(compte_courant), s: Session = Depends(session)):
    l = s.get(Logement, logement_id)
    if not l or l.compte_id != compte.id:
        raise HTTPException(404, "Logement introuvable.")
    return _vue(l, archives=archives)

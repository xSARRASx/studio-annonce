"""Les tables. Un point = une ligne de registre : rien ne se compte sans trace."""
from __future__ import annotations

import secrets
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def maintenant() -> datetime:
    """Heure UTC, sans fuseau : SQLite et PostgreSQL la stockent et la comparent pareil."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def identifiant() -> str:
    return secrets.token_urlsafe(12)


class Compte(Base):
    __tablename__ = "comptes"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=identifiant)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    photos_offertes_utilisees: Mapped[int] = mapped_column(Integer, default=0)
    logements: Mapped[list[Logement]] = relationship(back_populates="compte")


class CodeConnexion(Base):
    __tablename__ = "codes_connexion"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), index=True)
    code: Mapped[str] = mapped_column(String(6))
    expire_le: Mapped[datetime] = mapped_column(DateTime)
    utilise: Mapped[int] = mapped_column(Integer, default=0)


class Jeton(Base):
    __tablename__ = "jetons"
    valeur: Mapped[str] = mapped_column(String(64), primary_key=True)
    compte_id: Mapped[str] = mapped_column(ForeignKey("comptes.id"), index=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)


class Logement(Base):
    __tablename__ = "logements"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=identifiant)
    compte_id: Mapped[str] = mapped_column(ForeignKey("comptes.id"), index=True)
    nom: Mapped[str] = mapped_column(String(120), default="Mon logement")
    ville: Mapped[str] = mapped_column(String(120), default="")
    type_annonce: Mapped[str] = mapped_column(String(40), default="location")  # location, vente, vacances
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    compte: Mapped[Compte] = relationship(back_populates="logements")
    photos: Mapped[list[Photo]] = relationship(back_populates="logement", order_by="Photo.ordre")


class Photo(Base):
    __tablename__ = "photos"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=identifiant)
    logement_id: Mapped[str] = mapped_column(ForeignKey("logements.id"), index=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0)
    cle_originale: Mapped[str] = mapped_column(String(300))       # fichier d'origine dans le stockage
    cle_vignette: Mapped[str] = mapped_column(String(300), default="")
    analyse: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # ce que l'IA a vu, sa consigne, sa question
    offerte: Mapped[int] = mapped_column(Integer, default=0)      # 1 = la photo offerte du compte
    essais: Mapped[int] = mapped_column(Integer, default=0)
    credite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # 1er téléchargement HD
    version_gardee_id: Mapped[str | None] = mapped_column(String(24), nullable=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    logement: Mapped[Logement] = relationship(back_populates="photos")
    versions: Mapped[list[Version]] = relationship(back_populates="photo", order_by="Version.numero")


class Version(Base):
    """Un essai de retouche. On garde chaque étape : le client peut repartir d'où il veut."""
    __tablename__ = "versions"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=identifiant)
    photo_id: Mapped[str] = mapped_column(ForeignKey("photos.id"), index=True)
    numero: Mapped[int] = mapped_column(Integer)
    depuis_version_id: Mapped[str | None] = mapped_column(String(24), nullable=True)
    consigne: Mapped[str] = mapped_column(Text)
    cle_apercu: Mapped[str] = mapped_column(String(300))          # réduit + filigrané, ce que le client voit
    cle_pleine: Mapped[str] = mapped_column(String(300))          # sans filigrane, réservé au serveur
    cle_hd: Mapped[str] = mapped_column(String(300), default="")  # produite au téléchargement seulement
    cout_estime_usd: Mapped[int] = mapped_column(Integer, default=5)  # en centièmes de cent
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    photo: Mapped[Photo] = relationship(back_populates="versions")


class MouvementCredit(Base):
    """Le registre. Chaque crédit ajouté ou consommé est une ligne, avec son motif."""
    __tablename__ = "mouvements_credits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    compte_id: Mapped[str] = mapped_column(ForeignKey("comptes.id"), index=True)
    delta: Mapped[int] = mapped_column(Integer)                   # +5 (achat), -1 (photo gardée)
    motif: Mapped[str] = mapped_column(String(200))
    reference: Mapped[str] = mapped_column(String(200), default="")  # id Stripe, id photo, id vidéo
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)


class Video(Base):
    __tablename__ = "videos"
    id: Mapped[str] = mapped_column(String(24), primary_key=True, default=identifiant)
    logement_id: Mapped[str] = mapped_column(ForeignKey("logements.id"), index=True)
    statut: Mapped[str] = mapped_column(String(30), default="en_attente")  # en_attente, clips, montage, prete, echec
    plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)         # décisions du réalisateur automatique
    requetes: Mapped[dict | None] = mapped_column(JSON, nullable=True)     # identifiants Higgsfield, jamais perdus
    cle_video: Mapped[str] = mapped_column(String(300), default="")
    erreur: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

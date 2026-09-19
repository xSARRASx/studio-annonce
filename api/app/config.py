"""Réglages du cerveau. Tout vient du .env du serveur, jamais du code."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Reglages(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    GEMINI_API_KEY: str = ""
    HF_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./studio.db"
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET: str = "studio-annonce"
    R2_PUBLIC_URL: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "Studio Annonce <no-reply@example.com>"
    SECRET_KEY: str = "changer-moi"
    URL_PUBLIQUE_API: str = "http://localhost:8000"
    # Démo seulement : sans SMTP, renvoyer le code de connexion dans la réponse (à couper dès que les mails partent).
    CODE_DANS_LA_REPONSE: bool = False

    # Les règles du produit, décidées avec Martin (18 et 19/09/2026)
    PHOTO_OFFERTE_PAR_COMPTE: int = 1
    ESSAIS_MAX_PAR_PHOTO: int = 30
    ESSAIS_MAX_PHOTO_OFFERTE: int = 10
    ESSAIS_MAX_PAR_JOUR: int = 150
    JOURS_DE_REPRISE: int = 7
    ALERTES_ESSAIS_RESTANTS: tuple[int, ...] = (10, 5, 3, 2, 1)
    MODELE_ANALYSE: str = "gemini-3.5-flash"
    MODELE_APERCU: str = "gemini-3.1-flash-image"
    MODELE_HD: str = "gemini-3-pro-image"
    LARGEUR_APERCU: int = 720
    LARGEUR_VIGNETTE: int = 320
    LARGEUR_ENVOI_IA: int = 2048


reglages = Reglages()


# Sur Render, l'adresse publique est fournie par la plateforme.
import os as _os
if _os.environ.get("RENDER_EXTERNAL_URL") and reglages.URL_PUBLIQUE_API.startswith("http://localhost"):
    reglages.URL_PUBLIQUE_API = _os.environ["RENDER_EXTERNAL_URL"]
# Render fournit une URL postgres:// ; SQLAlchemy veut postgresql+psycopg://
if reglages.DATABASE_URL.startswith("postgres://"):
    reglages.DATABASE_URL = "postgresql+psycopg://" + reglages.DATABASE_URL[len("postgres://"):]
elif reglages.DATABASE_URL.startswith("postgresql://"):
    reglages.DATABASE_URL = "postgresql+psycopg://" + reglages.DATABASE_URL[len("postgresql://"):]

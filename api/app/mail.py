"""Envoi des codes de connexion par SMTP."""
import smtplib
from email.message import EmailMessage

from .config import reglages


def disponible() -> bool:
    return bool(reglages.SMTP_HOST and reglages.SMTP_USER and reglages.SMTP_PASSWORD
                and reglages.MAIL_FROM and "example.com" not in reglages.MAIL_FROM)


def envoyer(destinataire: str, sujet: str, texte: str) -> None:
    if not disponible():
        raise RuntimeError("Envoi des emails non configuré")
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = reglages.MAIL_FROM, destinataire, sujet
    msg.set_content(texte)
    with smtplib.SMTP(reglages.SMTP_HOST, reglages.SMTP_PORT) as s:
        s.starttls()
        s.login(reglages.SMTP_USER, reglages.SMTP_PASSWORD)
        s.send_message(msg)

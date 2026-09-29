"""Envoi des codes de connexion par SMTP."""
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formatdate, make_msgid, parseaddr

from .config import reglages


def disponible() -> bool:
    return bool(reglages.SMTP_HOST and reglages.SMTP_USER and reglages.SMTP_PASSWORD
                and reglages.MAIL_FROM and "example.com" not in reglages.MAIL_FROM)


def envoyer(destinataire: str, sujet: str, texte: str) -> None:
    if not disponible():
        raise RuntimeError("Envoi des emails non configuré")
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = reglages.MAIL_FROM, destinataire, sujet
    msg["Date"] = formatdate(localtime=False)
    msg["Message-ID"] = make_msgid(domain=parseaddr(reglages.MAIL_FROM)[1].split("@")[-1])
    msg.set_content(texte)
    with smtplib.SMTP(reglages.SMTP_HOST, reglages.SMTP_PORT, timeout=20) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(reglages.SMTP_USER, reglages.SMTP_PASSWORD)
        s.send_message(msg)

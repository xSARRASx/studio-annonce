"""Envoi des mails (code de connexion). Sans SMTP configuré, le code s'affiche dans les journaux du serveur."""
import smtplib
from email.message import EmailMessage

from .config import reglages


def envoyer(destinataire: str, sujet: str, texte: str) -> None:
    if not reglages.SMTP_HOST:
        print(f"[mail non envoyé, SMTP absent] à {destinataire} : {sujet}\n{texte}")
        return
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = reglages.MAIL_FROM, destinataire, sujet
    msg.set_content(texte)
    with smtplib.SMTP(reglages.SMTP_HOST, reglages.SMTP_PORT) as s:
        s.starttls()
        s.login(reglages.SMTP_USER, reglages.SMTP_PASSWORD)
        s.send_message(msg)

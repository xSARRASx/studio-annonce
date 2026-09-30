"""Envoi transactionnel des codes de connexion par SMTP."""
from html import escape
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formatdate, make_msgid, parseaddr

from .config import reglages


def disponible() -> bool:
    return bool(reglages.SMTP_HOST and reglages.SMTP_USER and reglages.SMTP_PASSWORD
                and reglages.MAIL_FROM and "example.com" not in reglages.MAIL_FROM)


def envoyer(destinataire: str, sujet: str, texte: str, html: str | None = None) -> str:
    if not disponible():
        raise RuntimeError("Envoi des emails non configuré")
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = reglages.MAIL_FROM, destinataire, sujet
    msg["Reply-To"] = reglages.SUPPORT_EMAIL
    msg["Date"] = formatdate(localtime=False)
    msg["Message-ID"] = make_msgid(domain=parseaddr(reglages.MAIL_FROM)[1].split("@")[-1])
    msg.set_content(texte)
    if html:
        msg.add_alternative(html, subtype="html")
    with smtplib.SMTP(reglages.SMTP_HOST, reglages.SMTP_PORT, timeout=20) as s:
        s.ehlo()
        s.starttls(context=ssl.create_default_context())
        s.ehlo()
        s.login(reglages.SMTP_USER, reglages.SMTP_PASSWORD)
        refuses = s.send_message(
            msg,
            from_addr=parseaddr(reglages.MAIL_FROM)[1],
            to_addrs=[destinataire],
        )
        if refuses:
            raise smtplib.SMTPRecipientsRefused(refuses)
    return str(msg["Message-ID"])


def envoyer_code_connexion(destinataire: str, code: str) -> str:
    """Envoie un OTP lisible sans ressource externe ni donnée marketing."""
    sujet = f"{code} — votre code Studio Annonce"
    texte = (
        "Bonjour,\n\n"
        "Vous avez demandé à accéder à votre espace Studio Annonce.\n\n"
        f"Votre code de connexion : {code}\n"
        "Il est valable 10 minutes et ne peut servir qu’une fois.\n\n"
        "Saisissez-le sur la page de connexion que vous venez d’ouvrir sur studioannonce.fr. "
        "Ne communiquez ce code à personne.\n\n"
        "Si vous n’avez pas fait cette demande, vous pouvez ignorer ce message.\n\n"
        "L’équipe Studio Annonce\n"
        f"Besoin d’aide : {reglages.SUPPORT_EMAIL}"
    )
    code_sur = escape(code)
    support_sur = escape(reglages.SUPPORT_EMAIL)
    html = f"""<!doctype html>
<html lang="fr"><body style="margin:0;background:#f8f7f2;color:#292d25;font-family:Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">Votre code Studio Annonce est {code_sur}. Il expire dans 10 minutes.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f7f2;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffefa;border:1px solid #e4e5dc;border-radius:18px">
        <tr><td style="padding:34px 36px">
          <p style="margin:0 0 26px;color:#4e5e3c;font-size:20px;font-weight:700">studioannonce</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Votre code de connexion</h1>
          <p style="margin:0;color:#646b5e;font-size:15px;line-height:1.7">Saisissez ce code sur la page Studio Annonce que vous venez d’ouvrir.</p>
          <div style="margin:28px 0;padding:20px;text-align:center;background:#f1f3ec;border:1px solid #d9dfcf;border-radius:12px;font-size:34px;font-weight:700;letter-spacing:10px;color:#30372a">{code_sur}</div>
          <p style="margin:0 0 14px;color:#646b5e;font-size:14px;line-height:1.7"><strong>Valable 10 minutes</strong> et utilisable une seule fois.</p>
          <p style="margin:0;color:#7b8175;font-size:12px;line-height:1.7">Vous n’êtes pas à l’origine de cette demande ? Ignorez simplement ce message. Ne partagez jamais ce code.</p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #e4e5dc;color:#7b8175;font-size:12px;line-height:1.6">Message automatique · Aide : <a href="mailto:{support_sur}" style="color:#4e5e3c">{support_sur}</a></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""
    return envoyer(destinataire, sujet, texte, html)

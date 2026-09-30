"""Le mail de connexion reste lisible et l'échec d'un destinataire est remonté."""
import smtplib
import unittest
from unittest.mock import patch

from app import mail


class FauxSMTP:
    dernier_message = None
    refuses = {}

    def __init__(self, *_args, **_kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def ehlo(self):
        return 250, b"ok"

    def starttls(self, **_kwargs):
        return 220, b"ready"

    def login(self, *_args):
        return 235, b"ok"

    def send_message(self, message, **_kwargs):
        type(self).dernier_message = message
        return type(self).refuses


class MailConnexion(unittest.TestCase):
    def setUp(self):
        FauxSMTP.dernier_message = None
        FauxSMTP.refuses = {}
        self.reglages = (
            patch.object(mail.reglages, "SMTP_HOST", "smtp.example.test"),
            patch.object(mail.reglages, "SMTP_USER", "no-reply@studioannonce.fr"),
            patch.object(mail.reglages, "SMTP_PASSWORD", "secret"),
            patch.object(mail.reglages, "MAIL_FROM", "Studio Annonce <no-reply@studioannonce.fr>"),
            patch.object(mail.reglages, "SUPPORT_EMAIL", "contact@studioannonce.fr"),
            patch.object(mail.smtplib, "SMTP", FauxSMTP),
        )
        for reglage in self.reglages:
            reglage.start()

    def tearDown(self):
        for reglage in reversed(self.reglages):
            reglage.stop()

    def test_code_est_present_en_texte_et_html(self):
        identifiant = mail.envoyer_code_connexion("client@example.test", "123456")
        message = FauxSMTP.dernier_message
        self.assertTrue(identifiant.startswith("<"))
        self.assertIn("123456", message["Subject"])
        self.assertEqual(message["Reply-To"], "contact@studioannonce.fr")
        self.assertIn("123456", message.get_body(preferencelist=("plain",)).get_content())
        self.assertIn("123456", message.get_body(preferencelist=("html",)).get_content())

    def test_destinataire_refuse_provoque_une_erreur(self):
        FauxSMTP.refuses = {"client@example.test": (550, b"refused")}
        with self.assertRaises(smtplib.SMTPRecipientsRefused):
            mail.envoyer_code_connexion("client@example.test", "123456")


if __name__ == "__main__":
    unittest.main()

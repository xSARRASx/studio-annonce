"""Hachage de mots de passe avec sel unique et coût versionné."""
import base64
import hashlib
import hmac
import secrets

ITERATIONS = 600_000


def valider(mot_de_passe: str) -> None:
    if not 12 <= len(mot_de_passe) <= 128:
        raise ValueError("Le mot de passe doit contenir entre 12 et 128 caractères.")


def hacher(mot_de_passe: str) -> str:
    valider(mot_de_passe)
    sel = secrets.token_bytes(16)
    empreinte = hashlib.pbkdf2_hmac("sha256", mot_de_passe.encode("utf-8"), sel, ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        ITERATIONS,
        base64.urlsafe_b64encode(sel).decode("ascii"),
        base64.urlsafe_b64encode(empreinte).decode("ascii"),
    )


def verifier(mot_de_passe: str, valeur: str | None) -> bool:
    if not valeur or len(mot_de_passe) > 128:
        return False
    try:
        algorithme, iterations, sel, empreinte = valeur.split("$")
        if algorithme != "pbkdf2_sha256" or not 600_000 <= int(iterations) <= 2_000_000:
            return False
        calcul = hashlib.pbkdf2_hmac("sha256", mot_de_passe.encode("utf-8"),
                                     base64.urlsafe_b64decode(sel), int(iterations))
        return hmac.compare_digest(calcul, base64.urlsafe_b64decode(empreinte))
    except (ValueError, TypeError):
        return False

"""Accorde une seule fois la propriété à un compte existant dont l'email est validé.

Aucun appel HTTP ne permet de devenir propriétaire. Utilisation serveur :
python -m scripts.initialiser_admin --email adresse@example.com
"""
import argparse

from sqlalchemy import select, update

from app.db import Session
from app.models import Compte, JournalAdmin


def initialiser(s, email):
    # Prend le verrou d'écriture avant de vérifier l'unicité du propriétaire.
    s.execute(update(Compte).values(revision_admin=Compte.revision_admin))
    proprietaires = s.scalars(select(Compte).where(Compte.role == "proprietaire")).all()
    if proprietaires:
        if len(proprietaires) == 1 and proprietaires[0].email == email.lower():
            return False
        raise ValueError("Un propriétaire existe déjà. Aucun droit modifié.")
    c = s.scalar(select(Compte).where(Compte.email == email.lower()))
    if not c or not c.email_verifie_le or c.statut != "actif" or not c.profil_complete_le:
        raise ValueError("Le compte doit déjà exister, être actif et avoir validé son email et son profil.")
    c.role = "proprietaire"
    c.revision_admin += 1
    s.add(JournalAdmin(acteur_id=c.id, cible_id=c.id, action="proprietaire_initialise", details={}))
    s.commit()
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    args = parser.parse_args()
    with Session() as s:
        cree = initialiser(s, args.email.strip())
    print("Compte propriétaire activé." if cree else "Compte propriétaire déjà configuré.")

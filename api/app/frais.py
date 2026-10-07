"""Rapprochement des frais en euros, sans tarifs estimés ni modification de Stripe."""
from sqlalchemy import select
from .models import Compte, FraisFournisseur


def resume(s, ca_centimes):
    lignes = s.execute(select(FraisFournisseur, Compte).outerjoin(Compte, Compte.id == FraisFournisseur.compte_id)
                       .order_by(FraisFournisseur.date_frais.desc(), FraisFournisseur.id)).all()
    actifs = [f for f, _ in lignes if not f.annule_le]
    total = sum(f.montant_centimes for f in actifs)
    par_compte = {}
    for f in actifs:
        if f.compte_id:
            par_compte[f.compte_id] = par_compte.get(f.compte_id, 0) + f.montant_centimes
    return {"montant_centimes": total if actifs else None,
            "marge_provisoire_centimes": ca_centimes - total if actifs else None,
            "nombre": len(actifs), "par_compte": par_compte,
            "lignes": [{"id": f.id, "fournisseur": f.fournisseur, "reference": f.reference,
                        "nature": f.nature, "montant_centimes": f.montant_centimes,
                        "date": f.date_frais.date().isoformat(), "compte_id": f.compte_id,
                        "compte": f"{c.prenom} {c.nom}".strip() or c.email if c else "Frais du studio",
                        "annule": bool(f.annule_le)} for f, c in lignes[:100]]}

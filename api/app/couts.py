"""Rapport privé : python -m app.couts. Tarifs OpenAI standard vérifiés le 29/09/2026."""
from collections import defaultdict
from decimal import Decimal
from sqlalchemy import select
from .db import Session
from .models import UsageIA


def montant_usd(modele: str, usage: dict) -> Decimal | None:
    million = Decimal(1_000_000)
    if modele.startswith("gpt-image-2.5-sunburst"):
        details = usage.get("input_tokens_details") or {}
        if not all(isinstance(details.get(k), int) for k in ("image_tokens", "text_tokens")) or not isinstance(usage.get("output_tokens"),int):
            return None
        # Images API directe : pas de réduction pour mise en cache.
        return (Decimal(details["image_tokens"])*8 + Decimal(details["text_tokens"])*5 + Decimal(usage["output_tokens"])*30)/million
    if modele.startswith("gpt-5.4-mini"):
        if not all(isinstance(usage.get(k),int) for k in ("input_tokens","output_tokens")):
            return None
        cache=(usage.get("input_tokens_details") or {}).get("cached_tokens",0)
        return ((Decimal(usage["input_tokens"])-cache)*Decimal("0.75") + Decimal(cache)*Decimal("0.075") + Decimal(usage["output_tokens"])*Decimal("4.50"))/million
    return None


def rapport():
    groupes=defaultdict(lambda: {"appels":0,"non_chiffres":0,"usd":Decimal(0)})
    with Session() as s:
        for u in s.scalars(select(UsageIA)):
            g=groupes[(u.modele,u.operation)]; g["appels"]+=1
            montant=montant_usd(u.modele,u.usage)
            if montant is None: g["non_chiffres"]+=1
            else: g["usd"]+=montant
    if not groupes:
        print("Aucune consommation fournisseur mesurée. Aucun coût par photo ne peut encore être confirmé.")
    for (modele,op),g in groupes.items():
        print(f"{modele} | {op} | {g['appels']} appels | {g['usd']:.6f} USD estimés sur usage mesuré | {g['non_chiffres']} non chiffrés")
    print("Hors taxes, change, stockage, emails, paiement et appels sans usage renvoyé. Rapprocher de la facture fournisseur.")


if __name__ == "__main__":
    rapport()

"""Conversions vérifiées en base et exports Klay ; jamais d'écriture Stripe."""
import csv
import io
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select, update

from .models import AchatCredits, AttributionPublicitaire, Compte, ConversionPublicitaire, identifiant, maintenant


def date_utc(value: datetime) -> datetime:
    return value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value


def verifier_consentement(d):
    now = maintenant()
    consent = date_utc(d.date_consentement)
    if not d.consentement or not now - timedelta(days=180) <= consent <= now + timedelta(minutes=5):
        raise HTTPException(422, "Un accord publicitaire actuel est nécessaire.")
    return consent


def commande(s, compte, achat_id):
    achat = s.get(AchatCredits, achat_id)
    if not achat or achat.compte_id != compte.id:
        raise HTTPException(404, "Achat introuvable.")
    return achat


def verrou(s, compte):
    compte_id = compte.id
    s.rollback()
    s.execute(update(Compte).where(Compte.id == compte_id).values(revision_admin=Compte.revision_admin))
    s.refresh(compte)
    if compte.statut != "actif":
        raise HTTPException(403, "Compte indisponible.")


def suivi(s, compte, achat, consent):
    conversion = s.get(ConversionPublicitaire, achat.id)
    if conversion:
        return conversion
    attribution = s.get(AttributionPublicitaire, compte.id)
    valide = attribution and timedelta(0) <= achat.cree_le - attribution.date_clic <= timedelta(days=90)
    conversion = ConversionPublicitaire(achat_id=achat.id, date_consentement=consent,
        identifiant=attribution.identifiant if valide else "", type=attribution.type if valide else "",
        date_clic=attribution.date_clic if valide else None)
    s.add(conversion); s.flush()
    return conversion


def reserver_conversion(s, compte, achat_id, consent):
    verrou(s, compte)
    achat = commande(s, compte, achat_id)
    if achat.statut != "paye" or not achat.credite_le or not achat.reel or achat.devise.lower() != "eur" or compte.role != "client":
        s.rollback()
        return {"ticket": None}
    conversion = suivi(s, compte, achat, consent)
    now = maintenant()
    if conversion.envoye_le or (conversion.reserve_le and conversion.reserve_le > now - timedelta(minutes=5)):
        s.rollback(); return {"ticket": None}
    conversion.ticket, conversion.reserve_le = identifiant(), now
    conversion.valeur_centimes = achat.montant_centimes
    conversion.date_consentement = consent
    premier = not s.scalar(select(AchatCredits.id).where(AchatCredits.compte_id == compte.id,
        AchatCredits.reel == 1, AchatCredits.credite_le.is_not(None), AchatCredits.credite_le < achat.credite_le).limit(1))
    s.commit()
    return {"ticket": conversion.ticket, "transaction_id": achat.id, "value": achat.montant_centimes / 100,
            "valeur_base": "ca_ttc", "pack": achat.pack_id, "nature": achat.nature, "credits": achat.credits,
            "premier_achat": premier, "user_data": {"email_address": compte.email.strip().lower()},
            "items": [{"item_id": a["pack_id"], "quantity": a["quantite"]}
                for a in (achat.composition or [{"pack_id": achat.pack_id, "quantite": 1}])]}


def periode(mois: str):
    try:
        start = datetime.strptime(mois, "%Y-%m")
        end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    except ValueError as e:
        raise HTTPException(422, "Choisissez un mois au format AAAA-MM.") from e
    return start, end


def csv_texte(champs, lignes):
    output = io.StringIO(newline="")
    writer = csv.writer(output); writer.writerow(champs); writer.writerows(lignes)
    return output.getvalue()


def ventes_csv(s, mois):
    start, end = periode(mois)
    # Include credited orders subsequently refunded: the adjustment export retracts them.
    achats = s.scalars(select(AchatCredits).where(AchatCredits.reel == 1, AchatCredits.credite_le >= start,
        AchatCredits.credite_le < end, AchatCredits.devise == "eur").order_by(AchatCredits.credite_le)).all()
    rows = []
    for achat in achats:
        compte = s.get(Compte, achat.compte_id)
        if not compte or compte.statut != "actif" or compte.role != "client":
            continue
        conversion = s.get(ConversionPublicitaire, achat.id)
        attr = conversion if conversion else s.get(AttributionPublicitaire, achat.compte_id)
        if not attr or attr.type != "gclid" or not attr.date_clic or not attr.identifiant:
            continue
        if not timedelta(0) <= achat.credite_le - attr.date_clic < timedelta(days=90):
            continue
        cents = conversion.valeur_centimes if conversion and conversion.valeur_centimes is not None else achat.montant_centimes
        rows.append([achat.id, attr.identifiant, achat.credite_le.replace(tzinfo=timezone.utc).isoformat(), f"{cents / 100:.2f}", "EUR"])
    return csv_texte(["commande_id", "gclid", "date_heure_paiement", "valeur_eur", "devise"], rows)


def remboursements_csv(s, mois):
    """Lecture bornée des remboursements Stripe réels, y compris partiels.

    Les webhooks du père sont conservés. Stripe porte la date et le montant
    exacts, que les seuls mouvements de crédits ne permettent pas de déduire.
    """
    from . import justificatifs
    start, end = periode(mois)
    # Copy only the references required by the export. No SQLite read transaction
    # remains open while waiting for Stripe; creation and payments stay responsive.
    commandes = {}
    for achat in s.scalars(select(AchatCredits).where(AchatCredits.reel == 1,
            AchatCredits.credite_le.is_not(None), AchatCredits.devise == "eur")):
        compte = s.get(Compte, achat.compte_id)
        if not compte or compte.statut != "actif" or compte.role != "client": continue
        conversion = s.get(ConversionPublicitaire, achat.id)
        attr = conversion if conversion else s.get(AttributionPublicitaire, compte.id)
        if not (conversion and conversion.envoye_le) and not (attr and attr.identifiant): continue
        commandes[achat.stripe_session_id] = {"id": achat.id, "compte": compte.id,
            "montant": achat.montant_centimes,
            "valeur": conversion.valeur_centimes if conversion and conversion.valeur_centimes is not None else achat.montant_centimes}
    s.rollback()
    if not commandes:
        return csv_texte(["transaction_id", "date_remboursement", "montant_eur", "motif"], [])
    refunds = justificatifs.lire_objet("refunds", {"limit": 100, "created[gte]": int(start.replace(tzinfo=timezone.utc).timestamp()),
                                                "created[lt]": int(end.replace(tzinfo=timezone.utc).timestamp())})
    if refunds.get("has_more"):
        raise HTTPException(413, "Plus de 100 remboursements ce mois-ci. Demandez un export complet au support.")
    grouped = {}
    for refund in refunds.get("data", []):
        if not isinstance(refund, dict) or refund.get("status") != "succeeded" or not refund.get("livemode") or refund.get("currency") != "eur":
            continue
        intent = refund.get("payment_intent")
        if isinstance(intent, str) and isinstance(refund.get("created"), int): grouped.setdefault(intent, []).append(refund)
    if len(grouped) > 20:
        raise HTTPException(413, "Cet export nécessite un rapprochement plus large. Demandez-le au support.")
    def rapprocher(item):
        intent, entries = item
        rows = []
        sessions = justificatifs.lire_objet("checkout/sessions", {"payment_intent": intent, "limit": 100})
        if sessions.get("has_more"):
            raise HTTPException(413, "Sessions trop nombreuses pour un rapprochement complet.")
        for stripe_session in sessions.get("data", []):
            if not isinstance(stripe_session, dict): continue
            achat = commandes.get(stripe_session.get("id"))
            metadata = stripe_session.get("metadata")
            if not achat or not isinstance(metadata, dict): continue
            if (metadata.get("achat_id") != achat["id"] or metadata.get("compte_id") != achat["compte"]
                    or stripe_session.get("client_reference_id") != achat["compte"]
                    or stripe_session.get("amount_total") != achat["montant"]
                    or stripe_session.get("mode") != "payment" or stripe_session.get("payment_status") != "paid"
                    or stripe_session.get("currency") != "eur" or not stripe_session.get("livemode")
                    or stripe_session.get("payment_intent") != intent): continue
            # Restatement after a partial refund uses the actual remaining TTC,
            # accumulated through this month, rather than treating it as a full retraction.
            latest = max(entries, key=lambda r: r["created"])
            cumulative = justificatifs.lire_objet("refunds", {"payment_intent": intent, "limit": 100,
                "created[lt]": int(end.replace(tzinfo=timezone.utc).timestamp())})
            if cumulative.get("has_more"):
                raise HTTPException(413, "Remboursements trop nombreux pour un rapprochement automatique complet.")
            refunded = sum(r["amount"] for r in cumulative.get("data", [])
                if isinstance(r, dict) and r.get("status") == "succeeded" and r.get("livemode") and r.get("currency") == "eur"
                and r.get("payment_intent") == intent and isinstance(r.get("amount"), int) and r["amount"] > 0)
            if not refunded: continue
            if refunded >= achat["montant"]:
                amount = achat["valeur"]
                motif = "remboursement_total"
            else:
                amount = max(0, achat["montant"] - refunded); motif = "valeur_apres_remboursement_partiel"
            rows.append([achat["id"], datetime.fromtimestamp(latest["created"], timezone.utc).isoformat(), f"{amount / 100:.2f}", motif])
        return rows
    with ThreadPoolExecutor(max_workers=4) as executor:
        rows = [row for batch in executor.map(rapprocher, grouped.items()) for row in batch]
    rows.sort(key=lambda row: (row[1], row[0]))
    return csv_texte(["transaction_id", "date_remboursement", "montant_eur", "motif"], rows)

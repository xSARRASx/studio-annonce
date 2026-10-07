"""Retire les identifiants de clics expirés, sans toucher aux commandes."""
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import delete, update
from app.db import Session
from app.models import AttributionPublicitaire, ConversionPublicitaire, maintenant

if __name__ == "__main__":
    with Session() as s:
        date = maintenant() - timedelta(days=90)
        s.execute(delete(AttributionPublicitaire).where(AttributionPublicitaire.date_clic <= date))
        s.execute(update(ConversionPublicitaire).where(ConversionPublicitaire.date_clic <= date)
                  .values(identifiant="", type="", date_clic=None))
        s.commit()

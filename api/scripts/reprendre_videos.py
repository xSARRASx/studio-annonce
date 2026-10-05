"""Reprendre les vidéos confirmées même si Passenger a redémarré. Aucun nouveau projet."""
import asyncio
from datetime import timedelta
from sqlalchemy import select
from app.db import Session
from app.models import Video, maintenant
from app.routes.videos import EN_COURS, _avancer
async def main():
    with Session() as s:
        ids = list(s.scalars(select(Video.id).where(Video.statut.in_(EN_COURS), Video.supprime_le.is_(None), Video.cree_le > maintenant() - timedelta(hours=2))).all())
    for ident in ids:
        await _avancer(Session, ident)
if __name__ == "__main__":
    asyncio.run(main())

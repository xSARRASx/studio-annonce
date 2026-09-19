"""Base de données : SQLite en local, PostgreSQL en production (DATABASE_URL)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import reglages

est_sqlite = reglages.DATABASE_URL.startswith("sqlite")
moteur = create_engine(
    reglages.DATABASE_URL,
    connect_args={"check_same_thread": False} if est_sqlite else {},
    pool_pre_ping=True,
)
Session = sessionmaker(bind=moteur, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def session():
    s = Session()
    try:
        yield s
    finally:
        s.close()

"""Le cerveau de Studio Annonce. Lancer : uvicorn app.main:app --reload"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import stockage
from .db import Base, moteur
from .routes import auth, compte, logements, photos

Base.metadata.create_all(moteur)

app = FastAPI(title="Studio Annonce", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
for r in (auth, logements, photos, compte):
    app.include_router(r.routeur)

if not stockage.utilise_s3():  # en local seulement : en prod, les fichiers sont servis par le stockage, jamais par nous
    stockage.DOSSIER_LOCAL.mkdir(exist_ok=True)
    app.mount("/fichiers", StaticFiles(directory=stockage.DOSSIER_LOCAL), name="fichiers")


@app.get("/sante")
def sante():
    return {"ok": True}

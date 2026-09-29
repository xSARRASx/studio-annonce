"""Le cerveau de Studio Annonce. Lancer : uvicorn app.main:app --reload"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import mail, retouche, stockage, vision, paiements as service_paiement
from .config import reglages
from .db import Base, moteur
from .routes import auth, compte, logements, photos, paiements

Base.metadata.create_all(moteur)

app = FastAPI(title="Studio Annonce", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["X-Photo-Credit-Consomme", "X-Photo-Offerte", "X-Photo-Reprise-Jusqu-Au"])
for r in (auth, logements, photos, compte, paiements):
    app.include_router(r.routeur)

if not stockage.utilise_s3():
    stockage.DOSSIER_LOCAL.mkdir(exist_ok=True)

    @app.get("/fichiers/{cle:path}", include_in_schema=False)
    def fichier_local(cle: str, expiration: int = Query(...), signature: str = Query(...)):
        chemin = stockage.chemin_local_signe(cle, expiration, signature)
        if not chemin or not chemin.is_file():
            raise HTTPException(404, "Fichier introuvable.")
        return FileResponse(chemin)


@app.get("/sante")
def sante():
    return {
        "ok": True,
        "connexion_disponible": mail.disponible() or reglages.CODE_DANS_LA_REPONSE,
        "retouche_disponible": vision.disponible() and retouche.disponible(),
        "paiement_disponible": service_paiement.disponible(),
    }

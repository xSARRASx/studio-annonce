"""Le cerveau de Studio Annonce. Lancer : uvicorn app.main:app --reload"""
from fastapi import FastAPI, Header, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import acces_ia, higgsfield_video, mail, stockage, paiements as service_paiement
from .config import reglages
from .db import Base, moteur, session
from .models import Compte, Jeton
from sqlalchemy.orm import Session
from .routes import auth, compte, logements, photos, paiements, admin, videos

Base.metadata.create_all(moteur)

app = FastAPI(title="Studio Annonce", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["X-Photo-Credit-Consomme", "X-Photo-Offerte", "X-Photo-Reprise-Jusqu-Au"])
for r in (auth, logements, photos, videos, compte, paiements, admin):
    app.include_router(r.routeur)


@app.middleware("http")
async def donnees_privees(request, call_next):
    response = await call_next(request)
    # Passenger monte l'API sous /api : retirer le préfixe du montage avant
    # d'identifier les routes privées, comme le fait le routeur Starlette.
    chemin = request.scope["path"]
    racine = request.scope.get("root_path", "").rstrip("/")
    if racine and chemin.startswith(racine + "/"):
        chemin = chemin[len(racine):]
    if chemin.startswith(("/admin", "/compte", "/auth", "/photos", "/videos", "/logements", "/fichiers")):
        response.headers["Cache-Control"] = "private, no-store"
    return response

if not stockage.utilise_s3():
    stockage.DOSSIER_LOCAL.mkdir(exist_ok=True)

    @app.get("/fichiers/{cle:path}", include_in_schema=False)
    def fichier_local(cle: str, expiration: int = Query(...), signature: str = Query(...)):
        chemin = stockage.chemin_local_signe(cle, expiration, signature)
        if not chemin or not chemin.is_file():
            raise HTTPException(404, "Fichier introuvable.")
        return FileResponse(chemin)


@app.get("/sante")
def sante(authorization: str = Header(default=""), s: Session = Depends(session)):
    compte = None
    if authorization.startswith("Bearer "):
        jeton = s.get(Jeton, authorization[7:])
        if jeton:
            compte = s.get(Compte, jeton.compte_id)
    return {
        "ok": True,
        "connexion_disponible": mail.disponible() or reglages.CODE_DANS_LA_REPONSE,
        "retouche_disponible": acces_ia.autorise(compte),
        "video_disponible": acces_ia.gratuit_proprietaire(compte) and higgsfield_video.disponible(),
        "paiement_disponible": service_paiement.photo_disponible(),
        "paiement_photo_disponible": service_paiement.photo_disponible(),
        "paiement_video_disponible": service_paiement.video_disponible(),
    }

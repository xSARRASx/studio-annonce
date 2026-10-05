"""Le cerveau de Studio Annonce. Lancer : uvicorn app.main:app --reload"""
import re

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import FastAPI, Header, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from . import acces_ia, higgsfield_video, mail, stockage, paiements as service_paiement
from .config import reglages
from .db import Base, moteur, session
from .models import Compte, Jeton
from sqlalchemy.orm import Session
from .routes import auth, compte, logements, photos, paiements, admin, videos, creations, brouillons, annonces

Base.metadata.create_all(moteur)

app = FastAPI(title="Studio Annonce", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["X-Photo-Credit-Consomme", "X-Photo-Offerte", "X-Photo-Reprise-Jusqu-Au"])
for r in (auth, logements, photos, videos, compte, paiements, admin, creations, brouillons, annonces):
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
    if chemin.startswith(("/admin", "/compte", "/auth", "/photos", "/videos", "/logements", "/fichiers", "/creations", "/brouillons", "/annonces")):
        response.headers["Cache-Control"] = "private, no-store"
    return response

if not stockage.utilise_s3():
    stockage.DOSSIER_LOCAL.mkdir(exist_ok=True)


@app.get("/fichiers/{cle:path}", include_in_schema=False)
def fichier_prive(cle: str, request: Request, expiration: int = Query(...), signature: str = Query(...)):
    if not stockage.lien_signe_valide(cle, expiration, signature):
        raise HTTPException(404, "Fichier introuvable.")
    if not stockage.utilise_s3():
        chemin = stockage.chemin_local_signe(cle, expiration, signature)
        if not chemin or not chemin.is_file():
            raise HTTPException(404, "Fichier introuvable.")
        return FileResponse(chemin)
    plage = request.headers.get("range")
    if plage and not re.fullmatch(r"bytes=(?:\d+-\d*|-\d+)", plage):
        raise HTTPException(416, "Plage de fichier invalide.")
    try:
        objet = stockage.ouvrir_flux_s3(cle, plage)
    except ClientError as erreur:
        statut = erreur.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if statut in (404, 416):
            raise HTTPException(statut, "Fichier introuvable." if statut == 404 else "Plage de fichier invalide.") from erreur
        raise HTTPException(503, "Stockage temporairement indisponible.") from erreur
    except BotoCoreError as erreur:
        raise HTTPException(503, "Stockage temporairement indisponible.") from erreur
    corps = objet["Body"]

    def morceaux():
        try:
            for morceau in corps.iter_chunks(chunk_size=64 * 1024):
                if morceau:
                    yield morceau
        finally:
            corps.close()

    entetes = {"Accept-Ranges": "bytes"}
    if objet.get("ContentLength") is not None:
        entetes["Content-Length"] = str(objet["ContentLength"])
    if objet.get("ContentRange"):
        entetes["Content-Range"] = objet["ContentRange"]
    return StreamingResponse(morceaux(), status_code=206 if plage else 200,
                             media_type=objet.get("ContentType") or "application/octet-stream", headers=entetes)


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
        "video_disponible": bool(compte and higgsfield_video.disponible() and
                                 (acces_ia.gratuit_proprietaire(compte) or service_paiement.video_disponible())),
        "paiement_disponible": service_paiement.photo_disponible(),
        "paiement_photo_disponible": service_paiement.photo_disponible(),
        "paiement_video_disponible": service_paiement.video_disponible(),
    }

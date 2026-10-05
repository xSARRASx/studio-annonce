"""Aperçu privé puis ajout explicite des photos choisies, sans crédit ni IA."""
import asyncio
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from .. import annonces
from ..db import session
from ..models import Compte, Logement
from .auth import compte_complet
from .photos import _deposer

_recent: dict[str, float] = {}

routeur=APIRouter(prefix='/annonces', tags=['annonces'])
class Recherche(BaseModel):
    url: str=Field(max_length=1000)
class Import(BaseModel):
    jeton_photo: str=Field(max_length=4000)
    logement_id: str=Field(max_length=24)
    cle_import: str=Field(pattern=r'^[a-fA-F0-9-]{36}$')

@routeur.post('/photos')
async def chercher(d:Recherche, compte:Compte=Depends(compte_complet)):
    now=time.monotonic()
    if now-_recent.get(compte.id,0)<3: raise HTTPException(429,'Patientez quelques secondes avant une nouvelle recherche.')
    if len(_recent)>10000: _recent.clear()
    _recent[compte.id]=now
    url=annonces.adresse(d.url)
    try: html=await asyncio.wait_for(annonces.charger(url,3*1024*1024),timeout=22)
    except asyncio.TimeoutError: raise HTTPException(422,'L’annonce tarde à répondre. Réessayez ou ajoutez vos photos depuis votre appareil.') from None
    titre,photos=annonces.extraire(html.decode('utf-8',errors='replace'))
    if not photos: raise HTTPException(422,'Aucune photo accessible sur cette annonce. Airbnb ou Booking peut limiter cet accès. Ajoutez les fichiers de votre appareil.')
    return {'titre':titre,'source_url':url,'photos':[{'preview':p,'jeton':annonces.signer(compte.id,p)} for p in photos], 'message':'Photos accessibles sur la page publique. Vérifiez votre sélection ; certaines photos de la galerie peuvent manquer.'}

@routeur.post('/importer')
async def importer(d:Import, compte:Compte=Depends(compte_complet), s:Session=Depends(session)):
    logement=s.get(Logement,d.logement_id)
    if not logement or logement.compte_id!=compte.id:
        raise HTTPException(404,"Logement introuvable.")
    url=annonces.verifier(compte.id,d.jeton_photo)
    data=await annonces.charger(url,15*1024*1024,image=True)
    return _deposer(d.logement_id,data,'',d.cle_import,compte,s)

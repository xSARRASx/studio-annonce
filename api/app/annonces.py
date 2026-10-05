"""Lecture bornée des photos publiques d'une annonce, sans session ni contournement."""
import asyncio
import base64
import hashlib
import hmac
import ipaddress
import json
import re
import socket
import time
from html.parser import HTMLParser
from urllib.parse import urlsplit, urlunsplit, urljoin
import httpx
from fastapi import HTTPException
from .config import reglages

AIRBNB = {f'www.airbnb.{t}' for t in ('com','fr','de','es','it','be','nl','pt','ie','ca','co.uk','com.au')}
AIRBNB |= {x[4:] for x in list(AIRBNB)}

def adresse(value: str) -> str:
    try:
        u = urlsplit(value.strip())
        if u.scheme != 'https' or u.username or u.password or u.port not in (None,443): raise ValueError()
        host = u.hostname or ''
        if host in AIRBNB and re.fullmatch(r'/rooms/\d+/?', u.path): pass
        elif host in {'www.booking.com','booking.com'} and re.fullmatch(r'/hotel/[a-z]{2}/[a-zA-Z0-9_.-]+\.html', u.path): pass
        else: raise ValueError()
        return urlunsplit(('https',host,u.path,'',''))
    except ValueError:
        raise HTTPException(422, 'Collez le lien complet de la page du logement Airbnb ou Booking (pas un lien raccourci).') from None

def photo_url(value: str) -> str | None:
    try:
        u = urlsplit(value)
        if u.scheme != 'https' or u.username or u.password or u.port not in (None,443): return None
        if u.hostname == 'a0.muscache.com' and u.path.startswith(('/im/pictures/','/pictures/')) and re.search(r'\.(jpg|jpeg|png|webp)$',u.path,re.I):
            return urlunsplit(('https',u.hostname,u.path,'im_w=1440',''))
        if u.hostname == 'cf.bstatic.com' and re.fullmatch(r'/xdata/images/hotel/[^?#]+',u.path):
            return urlunsplit(('https',u.hostname,u.path,u.query,''))
    except ValueError: pass
    return None

async def public_dns(url: str):
    host = urlsplit(url).hostname
    try:
        infos = await asyncio.get_running_loop().run_in_executor(None, lambda: socket.getaddrinfo(host,443,type=socket.SOCK_STREAM))
    except OSError:
        raise HTTPException(422, "L’annonce ne répond pas. Réessayez ou ajoutez vos photos.") from None
    if not infos or any(not ipaddress.ip_address(i[4][0]).is_global for i in infos):
        raise HTTPException(422, 'Adresse de l’annonce inaccessible.')

async def charger(url: str, maximum: int, image=False) -> bytes:
    # Domaines imposés, aucune adresse libre, cookie ou session client transmis.
    await public_dns(url)
    try:
        async with httpx.AsyncClient(timeout=18, follow_redirects=False, trust_env=False) as client:
            async with client.stream('GET',url, headers={'User-Agent':'StudioAnnonce/1.0 (user-requested listing photo import)', 'Accept':'image/*' if image else 'text/html'}) as response:
                if not image and response.status_code in (301,302,307,308):
                    target=adresse(urljoin(url,response.headers.get('location','')))
                    if target == url: raise HTTPException(422,'La page renvoie vers elle-même.')
                    return await charger_sans_redirection(target,maximum)
                response.raise_for_status()
                if image and not response.headers.get('content-type','').startswith('image/'):
                    raise HTTPException(422,'La photo distante n’est pas une image.')
                data=bytearray()
                async for chunk in response.aiter_bytes():
                    data.extend(chunk)
                    if len(data)>maximum: raise HTTPException(413,'Le fichier distant est trop volumineux.')
                return bytes(data)
    except (httpx.HTTPError, OSError):
        raise HTTPException(422,'Cette annonce ne permet pas de récupérer ses photos pour le moment. Vous pouvez ajouter vos fichiers depuis votre appareil.') from None

async def charger_sans_redirection(url, maximum):
    await public_dns(url)
    try:
        async with httpx.AsyncClient(timeout=18, follow_redirects=False, trust_env=False) as client:
            async with client.stream('GET',url) as response:
                if response.status_code != 200: raise HTTPException(422,'L’annonce demande une vérification ou n’est pas publique. Ajoutez vos photos depuis votre appareil.')
                data=bytearray()
                async for part in response.aiter_bytes():
                    data.extend(part)
                    if len(data)>maximum: raise HTTPException(413,'Page trop volumineuse.')
                return bytes(data)
    except httpx.HTTPError: raise HTTPException(422,'L’annonce ne répond pas. Réessayez ou ajoutez vos photos.') from None

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.json=False; self.current=[]; self.documents=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script': self.json=dict(attrs).get('type')=='application/ld+json'; self.current=[]
    def handle_data(self,value):
        if self.json: self.current.append(value)
    def handle_endtag(self,tag):
        if tag=='script' and self.json:
            try: self.documents.append(json.loads(''.join(self.current)))
            except (ValueError, RecursionError): pass
            self.json=False

def extraire(html: str):
    page=Page();page.feed(html)
    def candidats(value):
        if isinstance(value,list):
            for v in value: yield from candidats(v)
        elif isinstance(value,dict):
            kinds=value.get('@type',[]);kinds=[kinds] if isinstance(kinds,str) else kinds
            if any(k in ('VacationRental','Hotel','LodgingBusiness','Apartment','Accommodation') for k in kinds): yield value
            # Only structured primary listing nodes, never recommendation/review photos.
            if '@graph' in value: yield from candidats(value['@graph'])
    for document in page.documents:
        for listing in candidats(document):
            urls=listing.get('image',[]);urls=[urls] if isinstance(urls,(str,dict)) else urls
            result=[]
            for item in urls:
                raw=item.get('url') or item.get('contentUrl') if isinstance(item,dict) else item
                url=photo_url(raw) if isinstance(raw,str) else None
                if url and url not in result: result.append(url)
            if result: return str(listing.get('name','Mon logement'))[:120],result[:40]
    return '',[]

def signer(compte_id,url):
    payload=base64.urlsafe_b64encode(json.dumps([compte_id,url,int(time.time())+3600],separators=(',',':')).encode()).decode().rstrip('=')
    mac=hmac.new(reglages.SECRET_KEY.encode(),payload.encode(),hashlib.sha256).hexdigest()
    return payload+'.'+mac

def verifier(compte_id,token):
    try:
        payload,mac=token.split('.')
        if not hmac.compare_digest(mac,hmac.new(reglages.SECRET_KEY.encode(),payload.encode(),hashlib.sha256).hexdigest()): raise ValueError()
        owner,url,expiry=json.loads(base64.urlsafe_b64decode(payload+'='*(-len(payload)%4)))
        if owner!=compte_id or expiry<time.time() or not photo_url(url): raise ValueError()
        return url
    except (ValueError, TypeError, json.JSONDecodeError): raise HTTPException(403,'La sélection a expiré. Recherchez les photos de l’annonce à nouveau.') from None

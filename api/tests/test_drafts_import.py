"""Les préparations et imports restent privés, bornés et sans fournisseur IA."""
import json, tempfile, uuid, unittest
from unittest.mock import AsyncMock, patch
from fastapi import FastAPI, HTTPException
import httpx
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.db import Base, session
from app.models import Compte, Jeton, Logement, Photo, Brouillon, maintenant
from app.routes import brouillons, annonces as routes
from app import annonces

class DraftImport(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.engine=create_engine(f'sqlite:///{self.temp.name}/db',connect_args={'check_same_thread':False})
        Base.metadata.create_all(self.engine);self.sessions=sessionmaker(self.engine,expire_on_commit=False)
        with self.sessions() as s:
            for x in ('a','b'):
                s.add(Compte(id=x,email=x+'@example.com',prenom=x,nom=x,profil_complete_le=maintenant(),email_verifie_le=maintenant()))
            s.flush()
            s.add_all([Jeton(valeur=x,compte_id=x) for x in ('a','b')]);s.add(Logement(id='home',compte_id='a'));s.flush()
            s.add(Photo(id='photo',logement_id='home',cle_originale='o',cle_vignette='v',demande_brouillon='Garder les fenêtres'));s.commit()
        def sessions():
            with self.sessions() as s:yield s
        app=FastAPI();app.include_router(brouillons.routeur);app.include_router(routes.routeur);app.dependency_overrides[session]=sessions
        self.client=httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test',headers={'Authorization':'Bearer a'})
        routes._recent.clear()
    async def asyncTearDown(self):
        await self.client.aclose();self.engine.dispose();self.temp.cleanup()
    async def test_brouillon_prive_reprise_sans_generation(self):
        id=str(uuid.uuid4());data={'nature':'video','donnees':{'duration':20,'selectedIds':['photo'],'idea':'Drone autour de la table'}}
        response=await self.client.put('/brouillons/'+id,json=data);self.assertEqual(response.status_code,200,response.text)
        self.assertEqual((await self.client.get('/brouillons/'+id)).json()['donnees'],data['donnees'])
        self.assertEqual((await self.client.get('/brouillons/'+id,headers={'Authorization':'Bearer b'})).status_code,404)
        self.assertEqual((await self.client.put('/brouillons/'+id,json=data,headers={'Authorization':'Bearer b'})).status_code,404)
        items=(await self.client.get('/brouillons')).json();self.assertEqual({x['id'] for x in items},{id,'photo'})
        with self.sessions() as s:
            b=s.get(Brouillon,id);b.video_id='launched';s.get(Photo,'photo').archive_le=maintenant();s.commit()
        self.assertEqual((await self.client.get('/brouillons')).json(),[])
        self.assertEqual((await self.client.put('/brouillons/'+id,json=data)).status_code,409)
    async def test_annonce_aperçu_sans_import_et_photos_signees(self):
        html='<script type="application/ld+json">'+json.dumps({'@type':'VacationRental','name':'Villa','image':['https://a0.muscache.com/im/pictures/a.jpg']})+'</script>'
        with patch.object(annonces,'charger',new=AsyncMock(return_value=html.encode())) as charge, patch.object(routes,'_deposer') as depot:
            result=await self.client.post('/annonces/photos',json={'url':'https://www.airbnb.fr/rooms/26158537?adults=4'})
            self.assertEqual(result.status_code,200,result.text);self.assertEqual(len(result.json()['photos']),1);depot.assert_not_called()
            token=result.json()['photos'][0]['jeton']
            self.assertEqual(annonces.verifier('a',token),'https://a0.muscache.com/im/pictures/a.jpg?im_w=1440')
            response=await self.client.post('/annonces/importer',json={'logement_id':'home','jeton_photo':token,'cle_import':str(uuid.uuid4())},headers={'Authorization':'Bearer b'})
            self.assertEqual(response.status_code,404);self.assertEqual(charge.await_count,1)
    def test_urls_tokens_et_recommandations(self):
        for url in ('https://127.0.0.1/rooms/1','https://www.airbnb.fr.evil.test/rooms/1','https://user@www.airbnb.fr/rooms/1','http://www.airbnb.fr/rooms/1','https://www.airbnb.fr:444/rooms/1'):
            with self.assertRaises(HTTPException):annonces.adresse(url)
        self.assertIsNone(annonces.photo_url('https://a0.muscache.com.evil.test/pictures/a.jpg'))
        token=annonces.signer('a','https://a0.muscache.com/pictures/a.jpg')
        with self.assertRaises(HTTPException):annonces.verifier('a',token+'x')
        with patch.object(annonces.time,'time',return_value=10**11):
            with self.assertRaises(HTTPException):annonces.verifier('a',token)
        doc={'@type':'Hotel','name':'Hotel','image':['https://cf.bstatic.com/xdata/images/hotel/max1024x768/1.jpg?k=1']*2,'review':{'image':'https://cf.bstatic.com/xdata/images/hotel/x/2.jpg'}}
        title,photos=annonces.extraire('<script type="application/ld+json">'+json.dumps(doc)+'</script>')
        self.assertEqual(title,'Hotel');self.assertEqual(len(photos),1)

    async def test_http_public_entetes_et_flux_borne(self):
        original_client = httpx.AsyncClient
        def response(request):
            self.assertIn('StudioAnnonce', request.headers['User-Agent'])
            return httpx.Response(200, content=b'page publique')
        with patch.object(annonces, 'public_dns', new=AsyncMock()), patch.object(annonces.httpx, 'AsyncClient', side_effect=lambda **options: original_client(transport=httpx.MockTransport(response), **options)):
            self.assertEqual(await annonces.charger('https://www.airbnb.fr/rooms/1', 100), b'page publique')
            with self.assertRaises(HTTPException) as error:
                await annonces.charger('https://www.airbnb.fr/rooms/1', 4)
            self.assertEqual(error.exception.status_code, 413)

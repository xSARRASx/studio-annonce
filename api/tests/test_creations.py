"""Corbeille isolée par compte, réversible, sans reset des crédits ni appel IA."""
import base64
import io
import tempfile
import unittest
import uuid
from contextlib import ExitStack
from datetime import timedelta
from unittest.mock import patch
import httpx
from fastapi import FastAPI
from PIL import Image
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker
from app.db import Base, session
from app.migrations import migrer
from app.models import Compte, Jeton, Logement, MouvementCredit, OperationPhoto, Photo, Version, Video, maintenant
from app.routes import creations, logements, photos, videos

class Corbeille(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = create_engine(f'sqlite:///{self.temp.name}/test.db', connect_args={'check_same_thread': False})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions() as s:
            for ident in ('client', 'autre'):
                s.add(Compte(id=ident, email=f'{ident}@example.test', prenom='Test', nom='Test', profil_complete_le=maintenant(), photos_offertes_utilisees=1))
            s.flush()
            for ident in ('client', 'autre'):
                s.add_all([Jeton(valeur=ident, compte_id=ident), Logement(id=ident, compte_id=ident, nom=ident), MouvementCredit(compte_id=ident, delta=5, motif='recette')])
            s.flush()
            s.add_all([Photo(id='photo', logement_id='client', cle_originale='source', cle_vignette='thumb', essais=2, offerte=1, version_gardee_id='version', archive_le=maintenant()), Photo(id='etrangere', logement_id='autre', cle_originale='foreign')])
            s.flush()
            s.add_all([Version(id='version', photo_id='photo', numero=1, consigne='Lumière', cle_apercu='preview', cle_pleine='full'), Video(id='video', logement_id='client', statut='prete', cle_video='film', plan={'photo_id':'photo', 'duree':5}), Video(id='etrangere', logement_id='autre', statut='prete')])
            s.commit()
        app = FastAPI()
        for route in (creations, photos, logements, videos): app.include_router(route.routeur)
        def sessions():
            with self.sessions() as s: yield s
        app.dependency_overrides[session] = sessions
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test', headers={'Authorization':'Bearer client'})
        self.stack = ExitStack()
        self.write = self.stack.enter_context(patch.object(photos.stockage, 'ecrire', side_effect=lambda key,*args:key))
        self.stack.enter_context(patch.object(photos.stockage, 'url_publique', side_effect=lambda key:f'/test/{key}'))
        self.stack.enter_context(patch.object(photos.stockage, 'url_privee', side_effect=lambda key:f'/private/{key}'))
        self.schedule = self.stack.enter_context(patch.object(videos, '_planifier'))
    async def asyncTearDown(self):
        await self.client.aclose(); self.stack.close(); self.engine.dispose(); self.temp.cleanup()
    async def test_photo_restaurable_avec_versions_sans_reset(self):
        for _ in range(2): self.assertEqual((await self.client.delete('/creations/photos/photo')).status_code,200)
        self.assertEqual((await self.client.get('/photos/photo')).status_code,404)
        for url in ('/logements','/logements?archives=true','/logements/client?archives=true'):
            data=(await self.client.get(url)).json()
            self.assertEqual((data[0] if isinstance(data,list) else data)['photos'],[])
        trash=(await self.client.get('/creations?corbeille=true')).json()
        self.assertEqual([(p['nature'],p['id']) for p in trash],[('photos','photo')])
        self.assertEqual([p['id'] for p in (await self.client.get('/creations')).json()],['video'])
        self.assertEqual((await self.client.post('/creations/photos/photo/restaurer')).status_code,200)
        p=(await self.client.get('/photos/photo')).json()
        self.assertEqual(p['essais'],2); self.assertTrue(p['offerte']); self.assertEqual(p['versions'][0]['id'],'version'); self.assertEqual(p['version_gardee'],'version')
        self.assertEqual(len((await self.client.get('/logements/client')).json()['photos']),1)
        with self.sessions() as s:
            self.assertEqual(s.get(Compte,'client').photos_offertes_utilisees,1)
            self.assertEqual([m.delta for m in s.scalars(select(MouvementCredit).where(MouvementCredit.compte_id=='client'))],[5])
            self.assertIsNone(s.get(Photo,'photo').archive_le)
        self.write.assert_not_called(); self.schedule.assert_not_called()
    async def test_video_restaurable_sans_generer(self):
        self.assertEqual((await self.client.delete('/creations/videos/video')).status_code,200)
        self.assertEqual((await self.client.get('/videos/video')).status_code,404)
        self.assertEqual((await self.client.get('/creations')).json(),[])
        self.assertEqual((await self.client.get('/videos/photos/photo/derniere')).json(),None)
        self.assertEqual((await self.client.get('/creations?corbeille=true')).json()[0]['nature'],'videos')
        self.assertEqual((await self.client.post('/creations/videos/video/restaurer')).status_code,200)
        self.assertEqual((await self.client.get('/creations')).json()[0]['url'],'/private/film')
        self.schedule.assert_not_called()
    async def test_isolation_comptes(self):
        for nature in ('photos','videos'):
            self.assertEqual((await self.client.delete(f'/creations/{nature}/etrangere')).status_code,404)
            self.assertEqual((await self.client.post(f'/creations/{nature}/etrangere/restaurer')).status_code,404)
        self.assertEqual((await self.client.get('/creations',headers={'Authorization':''})).status_code,401)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo,'etrangere').supprime_le); self.assertIsNone(s.get(Video,'etrangere').supprime_le)
    async def test_suppression_refusee_pendant_generation(self):
        with self.sessions() as s:
            s.add(OperationPhoto(photo_id='photo',compte_id='client',nature='essai',expire_le=maintenant()+timedelta(minutes=2))); s.commit()
        self.assertEqual((await self.client.delete('/creations/photos/photo')).status_code,409)
        with self.sessions() as s:
            s.get(OperationPhoto,'photo').statut='terminee'; v=s.get(Video,'video'); v.statut='montage'; v.plan={'sources':[{'photo_id':'photo'}]}; s.commit()
        self.assertEqual((await self.client.delete('/creations/photos/photo')).status_code,409)
        self.assertEqual((await self.client.delete('/creations/videos/video')).status_code,409)
    async def test_rejeu_import_ne_ressuscite_pas_corbeille(self):
        data=io.BytesIO(); Image.new('RGB',(32,32),'white').save(data,format='JPEG')
        payload={'image':base64.b64encode(data.getvalue()).decode(),'cle_import':str(uuid.uuid4())}
        r=await self.client.post('/photos/client/import',json=payload); self.assertEqual(r.status_code,200,r.text)
        await self.client.delete('/creations/photos/'+r.json()['id'])
        replay=await self.client.post('/photos/client/import',json=payload)
        self.assertEqual(replay.status_code,409,replay.text); self.assertIn('corbeille',replay.json()['detail'])
        with self.sessions() as s:
            self.assertEqual(len(s.scalars(select(Photo)).all()),3); self.assertEqual(s.get(Compte,'client').photos_offertes_utilisees,1)
    async def test_migration_ancienne_base_idempotente(self):
        with self.engine.begin() as c:
            c.execute(text('ALTER TABLE photos DROP COLUMN supprime_le')); c.execute(text('ALTER TABLE videos DROP COLUMN supprime_le'))
        migrer(self.engine); migrer(self.engine)
        with self.sessions() as s:
            self.assertIsNone(s.get(Photo,'photo').supprime_le); self.assertIsNone(s.get(Video,'video').supprime_le); self.assertEqual(s.get(Version,'version').cle_pleine,'full')

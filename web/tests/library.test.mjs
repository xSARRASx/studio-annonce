import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { IDBFactory, IDBObjectStore, forceCloseDatabase } = require('fake-indexeddb');
let library;
let testNumber = 0;
beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory();
  library = await import(`../app/demo/library.ts?case=${++testNumber}`);
});

async function rawDatabase() {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open('studio-annonce-library', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('library');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function seed(value) {
  const db = await rawDatabase();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('library', 'readwrite');
      tx.objectStore('library').put(value, 'current');
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function rawValue() {
  const db = await rawDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('library').objectStore('library').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
function photo(id='salon') {
  return {...library.sampleProject('photo'), id};
}
async function setupPhotos({credits=5, freeUsed=false, count=1}={}) {
  const state = library.initialLibrary();
  state.credits=credits;
  state.freeUsed=freeUsed;
  state.projects=Array.from({length:count},(_,index)=>photo(`p${index}`));
  await seed(state);
  return state;
}

test('Deux onglets téléchargent la même photo : un seul débit et un seul événement', async () => {
  await setupPhotos({freeUsed:true});
  const autreOnglet=await import(`../app/demo/library.ts?peer=${testNumber}`);
  await Promise.all(Array.from({length:10},(_,index)=>(index%2?autreOnglet:library)
    .changeLibrary(state=>library.beginDownload(state,'p0','decor',1000))));
  const saved=await library.readLibrary();
  assert.equal(saved.credits,4);
  assert.equal(saved.events.length,1);
  assert.equal(saved.projects[0].firstDownloadedAt,1000);
  assert.equal(saved.projects[0].editUntil,1000+library.WEEK);
});

test('Deux photos simultanées ne consomment la première offre qu’une fois', async () => {
  await setupPhotos({count:2});
  await Promise.all([0,1].map(n=>library.changeLibrary(state=>library.beginDownload(state,`p${n}`,'decor',1000))));
  const saved=await library.readLibrary();
  assert.equal(saved.credits,4);
  assert.equal(saved.events.filter(event=>event.amount===0).length,1);
  assert.equal(saved.events.filter(event=>event.amount===-1).length,1);
});

test('Deux photos avec le dernier crédit : une seule réussite, sans découvert', async () => {
  await setupPhotos({credits:1,freeUsed:true,count:2});
  const autreOnglet=await import(`../app/demo/library.ts?peer=${testNumber}`);
  const results=await Promise.allSettled([library,autreOnglet].map((onglet,n)=>onglet.changeLibrary(state=>library.beginDownload(state,`p${n}`,'decor',1000))));
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  const saved=await library.readLibrary();
  assert.equal(saved.credits,0);
  assert.equal(saved.events.length,1);
  assert.equal(saved.projects.filter(project=>project.firstDownloadedAt!==undefined).length,1);
});

test('L’échéance exacte déclenche une seule reprise, sans perdre les versions ni le premier téléchargement', async () => {
  await setupPhotos();
  await library.changeLibrary(state=>library.beginDownload(state,'p0','decor',0));
  await library.changeLibrary(state=>library.beginDownload(state,'p0','decor',500));
  let saved=await library.readLibrary();
  assert.equal(saved.events.length,1); // Même un timestamp égal à zéro désigne un vrai téléchargement.
  assert.equal(library.isExpired(saved.projects[0],library.WEEK-1),false);
  assert.equal(library.isExpired(saved.projects[0],library.WEEK),true);
  await Promise.all(Array.from({length:3},()=>library.changeLibrary(state=>library.renewProject(state,'p0',library.WEEK))));
  saved=await library.readLibrary();
  assert.equal(saved.credits,4);
  assert.equal(saved.events.length,2);
  assert.equal(saved.projects[0].versions.length,4);
  assert.equal(saved.projects[0].firstDownloadedAt,0);
  assert.equal(saved.projects[0].editUntil,library.WEEK*2);
});

test('Télécharger après l’échéance reste gratuit et ne prolonge pas la période', async () => {
  await setupPhotos({freeUsed:true});
  await library.changeLibrary(state=>library.beginDownload(state,'p0','decor',1000));
  await library.changeLibrary(state=>library.beginDownload(state,'p0','light',library.WEEK*2));
  const saved=await library.readLibrary();
  assert.equal(saved.credits,4);
  assert.equal(saved.events.length,1);
  assert.equal(saved.projects[0].editUntil,1000+library.WEEK);
});

test('Une reprise sans crédit échoue en conservant intégralement l’état précédent', async () => {
  await setupPhotos({credits:0});
  await library.changeLibrary(state=>library.beginDownload(state,'p0','decor',1000));
  const before=await rawValue();
  await assert.rejects(library.changeLibrary(state=>library.renewProject(state,'p0',1000+library.WEEK)),/Aucun crédit/);
  assert.deepEqual(await rawValue(),before);
});

test('Téléchargements originaux, vidéos et fichiers importés : aucun débit ni ouverture de délai', async () => {
  const saved=library.initialLibrary();
  saved.projects=[photo('p'),library.sampleProject('video'),{...photo('import'),sample:false}];
  await seed(saved);
  await library.changeLibrary(state=>{
    library.beginDownload(state,'p','original',1000);
    library.beginDownload(state,'example-tour','tour',1000);
    library.beginDownload(state,'import','decor',1000);
  });
  const result=await library.readLibrary();
  assert.equal(result.credits,5);
  assert.equal(result.freeUsed,false);
  assert.equal(result.events.length,0);
  assert.ok(result.projects.every(project=>project.firstDownloadedAt===undefined));
});

test('Modifications simultanées d’un nom et d’un brouillon : aucune écriture perdue', async () => {
  await setupPhotos();
  await Promise.all([
    library.changeLibrary(state=>{state.projects[0].title='Nouveau salon';}),
    library.changeLibrary(state=>{state.projects[0].draft='Garder la table, changer le canapé.';})
  ]);
  const saved=await library.readLibrary();
  assert.equal(saved.projects[0].title,'Nouveau salon');
  assert.equal(saved.projects[0].draft,'Garder la table, changer le canapé.');
  assert.equal(saved.revision,2);
});

test('Erreur au milieu d’une mutation : le crédit et le nom sont tous deux annulés', async () => {
  await setupPhotos({freeUsed:true});
  const before=await rawValue();
  await assert.rejects(library.changeLibrary(state=>{
    library.beginDownload(state,'p0','decor',1000);
    state.projects[0].title='Cette modification ne doit pas apparaître';
    throw new Error('Erreur simulée');
  }),/Erreur simulée/);
  assert.deepEqual(await rawValue(),before);
});

test('Quota de stockage atteint : les projets et crédits déjà enregistrés sont conservés', async () => {
  await setupPhotos({freeUsed:true});
  const before=await rawValue();
  const put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(){throw new DOMException('Quota','QuotaExceededError');};
  try {
    await assert.rejects(library.changeLibrary(state=>library.beginDownload(state,'p0','decor',1000)),error=>{
      assert.match(library.storageError(error),/Aucun fichier existant n’a été supprimé/);
      return error.name==='QuotaExceededError';
    });
  } finally { IDBObjectStore.prototype.put=put; }
  assert.deepEqual(await rawValue(),before);
});

test('Un stockage indisponible peut être réessayé sans recharger le module', async () => {
  globalThis.indexedDB=undefined;
  await assert.rejects(library.readLibrary(),/pas disponible/);
  globalThis.indexedDB=new IDBFactory();
  assert.deepEqual(await library.readLibrary(),library.initialLibrary());
});

test('Une fermeture imprévue de la connexion IndexedDB permet de rouvrir les projets', async () => {
  await setupPhotos();
  const open=indexedDB.open.bind(indexedDB);
  let connection;
  indexedDB.open=(...args)=>{
    const request=open(...args);
    request.addEventListener('success',()=>{connection=request.result;});
    return request;
  };
  assert.equal((await library.readLibrary()).projects.length,1);
  forceCloseDatabase(connection);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal((await library.readLibrary()).projects.length,1);
});

test('Un read réussi suivi d’un abort de transaction reste une erreur de lecture', async () => {
  await setupPhotos();
  const get=IDBObjectStore.prototype.get;
  IDBObjectStore.prototype.get=function(...args){
    const request=get.apply(this,args);
    request.addEventListener('success',()=>this.transaction.abort());
    return request;
  };
  try { await assert.rejects(library.readLibrary(),/lecture.*interrompue/); }
  finally { IDBObjectStore.prototype.get=get; }
  assert.equal((await library.readLibrary()).projects.length,1);
});

test('Sauvegardes incohérentes refusées sans les écraser', async () => {
  const fixtures=[null,{schema:1,projects:[],events:[],credits:-1,freeUsed:false}];
  for(const mutation of [
    state=>{state.projects[0].versions=[];},
    state=>{state.projects[0].selected='absente';},
    state=>{state.projects.push(structuredClone(state.projects[0]));},
    state=>{state.projects[0].file={};},
    state=>{state.projects[0].versions[0].src='https://external.example/file';},
    state=>{state.projects[0].versions[0].src='//external.example/demo/file';},
    state=>{state.projects[0].editUntil=123;},
    state=>{state.events=[{id:'bad',project:'p',label:'x',amount:-1,at:Infinity}];}
  ]){
    const state=library.initialLibrary();state.projects=[photo()];mutation(state);fixtures.push(state);
  }
  for(const fixture of fixtures){
    await seed(fixture);
    await assert.rejects(library.readLibrary(),/conservée, sans modification/);
    await assert.rejects(library.changeLibrary(state=>{state.credits=5;}),/conservée, sans modification/);
    assert.deepEqual(await rawValue(),fixture);
  }
});

test('Une mutation invalide n’endommage pas une sauvegarde initialement valide', async () => {
  await setupPhotos();
  const before=await rawValue();
  await assert.rejects(library.changeLibrary(state=>{state.projects[0].versions=[];}),/conservée/);
  assert.deepEqual(await rawValue(),before);
});

test('Une callback asynchrone est refusée : aucune écriture partielle ou tardive', async () => {
  await setupPhotos();
  const before=await rawValue();
  await assert.rejects(library.changeLibrary(async state=>{
    state.projects[0].title='Avant await';
    await Promise.resolve();
    state.projects[0].draft='Après await';
  }),/une seule opération/);
  assert.deepEqual(await rawValue(),before);
});

test('Une date invalide ne peut pas consommer un crédit', async () => {
  await setupPhotos({freeUsed:true});
  const before=await rawValue();
  await assert.rejects(library.changeLibrary(state=>library.beginDownload(state,'p0','decor',NaN)),/date/);
  assert.deepEqual(await rawValue(),before);
});

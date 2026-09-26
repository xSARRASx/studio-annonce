import assert from 'node:assert/strict';
import { beforeEach, afterEach, test } from 'node:test';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const require=createRequire(import.meta.url);
const reactPath=fileURLToPath(new URL('../node_modules/react/index.js',import.meta.url));
const adapterURL=new URL('./fixtures/library-hook-adapter.mjs',import.meta.url).href;
registerHooks({resolve(specifier,context,nextResolve){
  if(specifier==='react') return nextResolve(reactPath,context);
  if(specifier==='./library' && context.parentURL?.includes('/app/demo/use-library.ts')) return {url:adapterURL,shortCircuit:true};
  return nextResolve(specifier,context);
}});
const React=require(reactPath);
const {create,act}=require('react-test-renderer');
const real=await import('../app/demo/library.ts');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const originalCreate=URL.createObjectURL;
const originalRevoke=URL.revokeObjectURL;
const originalChannel=globalThis.BroadcastChannel;
let root, current, persisted, urlsMade, urlsRevoked, serial=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
function state(revision,credits){return{...real.initialLibrary(),revision,credits};}

beforeEach(()=>{
  root=null; current=null; persisted=state(1,5); urlsMade=[]; urlsRevoked=[];
  globalThis.window=new EventTarget();
  globalThis.document=new EventTarget();
  document.visibilityState='visible';
  globalThis.BroadcastChannel=undefined;
  URL.createObjectURL=blob=>{const url=`blob:fixture-${urlsMade.length}`;urlsMade.push({url,blob});return url;};
  URL.revokeObjectURL=url=>urlsRevoked.push(url);
  globalThis.__libraryHookAdapter={
    initialLibrary:real.initialLibrary,
    storageError:real.storageError,
    readLibrary:async()=>structuredClone(persisted),
    changeLibrary:async change=>{const next=structuredClone(persisted);change(next);next.revision++;persisted=next;return structuredClone(next);},
  };
});
afterEach(async()=>{
  if(root)await act(async()=>{root.unmount();});
  URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  globalThis.BroadcastChannel=originalChannel;
});
async function mount(){
  const {useLibrary}=await import(`../app/demo/use-library.ts?case=${++serial}`);
  function Probe(){current=useLibrary();return null;}
  await act(async()=>{root=create(React.createElement(Probe));await tick();});
}

test('Une lecture initiale ancienne ne remplace pas une écriture déjà sauvegardée',async()=>{
  const pending=deferred();
  globalThis.__libraryHookAdapter.readLibrary=()=>pending.promise;
  await mount();
  assert.equal(current.loading,true);
  await act(async()=>{await current.update(s=>{s.credits=4;});});
  assert.equal(current.library.revision,2);
  await act(async()=>{pending.resolve(state(1,5));await tick();});
  assert.equal(current.library.credits,4);
  assert.equal(current.library.revision,2);
  assert.equal(current.loading,false);
});

test('Une ancienne erreur de lecture ne masque pas une sauvegarde réussie',async()=>{
  const pending=deferred();
  globalThis.__libraryHookAdapter.readLibrary=()=>pending.promise;
  await mount();
  await act(async()=>{await current.update(s=>{s.credits=4;});});
  await act(async()=>{pending.reject(new Error('Ancienne lecture interrompue'));await tick();});
  assert.equal(current.error,'');
  assert.equal(current.library.credits,4);
});

test('Un rafraîchissement plus récent gagne face à une ancienne réponse de mutation',async()=>{
  await mount();
  const pending=deferred();
  globalThis.__libraryHookAdapter.changeLibrary=()=>pending.promise;
  let update;
  await act(async()=>{update=current.update(()=>{});});
  persisted=state(3,2);
  await act(async()=>{await current.refresh();});
  assert.equal(current.library.revision,3);
  await act(async()=>{pending.resolve(state(2,4));await update;});
  assert.equal(current.library.revision,3);
  assert.equal(current.library.credits,2);
});

test('Un message inter-onglets impossible à envoyer ne fait pas échouer le commit',async()=>{
  globalThis.BroadcastChannel=class{postMessage(){throw new DOMException('Bloqué','SecurityError');}close(){}};
  await mount();
  let result;
  await act(async()=>{result=await current.update(s=>{s.credits=4;});});
  assert.equal(result.credits,4);
  assert.equal(current.library.credits,4);
  assert.equal(current.error,'');
});

test('Un canal indisponible ne bloque pas le chargement, et le retour à l’onglet actualise les données',async()=>{
  globalThis.BroadcastChannel=class{constructor(){throw new DOMException('Bloqué','SecurityError');}};
  await mount();
  assert.equal(current.loading,false);
  persisted=state(2,4);
  await act(async()=>{window.dispatchEvent(new Event('focus'));await tick();});
  assert.equal(current.library.credits,4);
  persisted=state(3,3);
  await act(async()=>{document.dispatchEvent(new Event('visibilitychange'));await tick();});
  assert.equal(current.library.credits,3);
});

test('Une lecture achevée après démontage ne crée pas d’aperçu et ne remet pas l’état en vie',async()=>{
  const pending=deferred();globalThis.__libraryHookAdapter.readLibrary=()=>pending.promise;
  await mount();
  await act(async()=>{root.unmount();root=null;});
  const project={...real.sampleProject('photo'),sample:false,file:new Blob(['a']),versions:[{id:'original',label:'Original',note:''}],selected:'original'};
  await act(async()=>{pending.resolve({...state(2,5),projects:[project]});await tick();});
  assert.equal(urlsMade.length,0);
});

test('Le remplacement d’un fichier renouvelle son aperçu et libère les anciennes URLs sans effacer le fichier',async()=>{
  const file=new Blob(['original']);
  persisted.projects=[{...real.sampleProject('photo'),sample:false,file,versions:[{id:'original',label:'Original',note:''}],selected:'original'}];
  await mount();
  const old=current.source(current.library.projects[0]);
  assert.equal(old,'blob:fixture-0');
  await act(async()=>{await current.update(s=>{s.projects[0].file=new Blob(['nouveau']);});});
  const latest=current.source(current.library.projects[0]);
  assert.notEqual(latest,old);
  assert.ok(urlsRevoked.includes(old));
  assert.equal(await current.library.projects[0].file.text(),'nouveau');
  await act(async()=>{root.unmount();root=null;});
  assert.ok(urlsRevoked.includes(latest));
});

test('Un aperçu impossible à créer n’annule pas une écriture : état sauvegardé et erreur claire',async()=>{
  await mount();
  URL.createObjectURL=()=>{throw new Error('Aperçu indisponible');};
  const project={...real.sampleProject('photo'),sample:false,file:new Blob(['image']),versions:[{id:'original',label:'Original',note:''}],selected:'original'};
  await act(async()=>{await current.update(s=>{s.projects=[project];});});
  assert.equal(current.library.projects.length,1);
  assert.match(current.error,/projets sont enregistrés/);
  URL.createObjectURL=blob=>{const url='blob:apercu-recupere';urlsMade.push({url,blob});return url;};
  await act(async()=>{await current.refresh();});
  assert.equal(current.error,'');
  assert.equal(current.source(current.library.projects[0]),'blob:apercu-recupere');
});

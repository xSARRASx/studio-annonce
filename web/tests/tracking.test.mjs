import assert from 'node:assert/strict';
import { test } from 'node:test';

let sequence = 0;
const store = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) }; };
async function browser(search = '') {
  const cookies = new Map(); const scripts = []; let reloads = 0;
  const window = new EventTarget();
  Object.assign(window, { localStorage: store(), sessionStorage: store(), location: { search, hash: '', pathname: '/', origin: 'https://studioannonce.fr', hostname: 'studioannonce.fr', protocol: 'https:', reload: () => reloads++ } });
  const document = { head: { appendChild: s => scripts.push(s) }, createElement: () => ({}) };
  Object.defineProperty(document, 'cookie', { get: () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), set: line => { const [name, value] = line.split(';')[0].split('='); if (line.includes('Max-Age=0')) cookies.delete(name); else cookies.set(name, value); } });
  globalThis.window = window; globalThis.document = document;
  const tracking = await import(`../../shared/tracking.ts?test=${sequence++}`);
  return { tracking, scripts, window, cookies, reloads: () => reloads, events: event => (window.dataLayer || []).filter(e => e.event === event) };
}
const context = transport => ({ base: 'https://studioannonce.fr/api', token: () => 'private-token', support: 'site', transport });
const tick = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };

test('Aucun script, identifiant de clic ou événement sans accord ; refus conservé', async () => {
  const b = await browser('?gclid=valid_click');
  b.tracking.initializeTracking(); b.tracking.captureClick(); b.tracking.demoInteraction('film');
  assert.equal(b.scripts.length, 0); assert.equal(b.cookies.size, 0); assert.equal(b.events('demo_interaction').length, 0);
  assert.equal(b.window.dataLayer[0][2].analytics_storage, 'denied');
  b.tracking.setConsent(false); b.tracking.initializeTracking();
  assert.equal(b.scripts.length, 0); assert.equal(b.tracking.readConsent().accepte, false); assert.equal(b.reloads(), 0);
});
test('Accord : un seul GTM, quatre signaux consentis et clic daté ; retrait nettoie puis recharge', async () => {
  const b = await browser('?gclid=valid_click'); b.tracking.initializeTracking(); b.tracking.setConsent(true); b.tracking.initializeTracking();
  assert.equal(b.scripts.length, 1); assert.equal(b.scripts[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-53FSBGMS');
  assert.equal(b.tracking.readClick().identifiant, 'valid_click');
  b.cookies.set('_ga', 'private'); b.cookies.set('session', 'necessary');
  b.tracking.setConsent(false);
  assert.equal(b.tracking.readClick(), null); assert.equal(b.cookies.has('_ga'), false); assert.equal(b.cookies.has('sa_gclid'), false);
  assert.equal(b.cookies.get('session'), 'necessary'); assert.equal(b.reloads(), 1);
});
test('Ancien accord, accord expiré ou invalide : nouvelle demande et aucun chargement', async () => {
  for (const value of [{ version: 1, accepte: true, date: new Date().toISOString() }, { version: 2, accepte: true, date: new Date(Date.now() - 181 * 86400000).toISOString() }, { version: 2, accepte: true, date: 'incorrect' }]) {
    const b = await browser(); b.window.localStorage.setItem('sa_consentement', JSON.stringify(value)); b.tracking.initializeTracking();
    assert.equal(b.scripts.length, 0); assert.equal(b.tracking.readConsent(), null);
  }
});
test('Interactions et navigation : doublons exclus et aucune query ou hash libre envoyé', async () => {
  const b = await browser(); b.tracking.setConsent(true);
  b.tracking.demoInteraction('comparateur'); b.tracking.demoInteraction('comparateur');
  assert.equal(b.events('demo_interaction').length, 1);
  b.window.location.pathname = '/app/photo/'; b.tracking.demoInteraction('film'); assert.equal(b.events('demo_interaction').length, 1);
  b.tracking.pageNavigation('/', 'site'); b.window.location.hash = '#secret-email';
  b.tracking.pageNavigation('/app/photo/?email=private@example.com&signature=secret', 'site');
  const event = b.events('page_view_spa')[0]; assert.equal(event.page_location, 'https://studioannonce.fr/app/photo/'); assert.equal(event.user_data, null);
  b.tracking.pageNavigation('/app/photo/', 'site'); assert.equal(b.events('page_view_spa').length, 1);
});
test('Une actualisation ne prolonge pas le clic et le développement ne charge aucun GTM', async () => {
  const b = await browser('?gclid=valid_click'); b.tracking.setConsent(true);
  const date = new Date(Date.now() - 86400000).toISOString(); b.window.localStorage.setItem('sa_clic_date', date);
  b.tracking.captureClick(); assert.equal(b.tracking.readClick().date_clic, date);
  const dev = await browser(); dev.window.location.hostname = 'localhost'; dev.tracking.setConsent(true);
  assert.equal(dev.scripts.length, 0); assert.equal(dev.tracking.emit({ event: 'dev' }), false);
});
test('Inscription comptée après vérification nouvelle uniquement, email isolé des autres événements', async () => {
  const b = await browser(); b.tracking.setConsent(true);
  const c = context(); const path = '/auth/inscription/verifier';
  b.tracking.observeApi(path, 'POST', { compte_id: 'a', nouveau_compte: false }, '{}', c);
  assert.equal(b.events('compte_cree').length, 0);
  b.tracking.observeApi(path, 'POST', { compte_id: 'a', nouveau_compte: true }, JSON.stringify({ email: '  CLIENT@example.com ', code: 'private-code' }), c);
  b.tracking.observeApi(path, 'POST', { compte_id: 'a', nouveau_compte: true }, '{}', c);
  assert.equal(b.events('compte_cree').length, 1); assert.deepEqual(b.events('compte_cree')[0].user_data, { email_address: 'client@example.com' });
  b.tracking.observeApi('/auth/connexion', 'POST', { compte_id: 'a', jeton: 'secret' }, '{}', c);
  assert.equal(b.events('login')[0].user_data, null);
  assert.ok(!JSON.stringify(b.window.dataLayer).includes('private-code')); assert.ok(!JSON.stringify(b.window.dataLayer).includes('private-token'));
});
test('Génération confirmée et HD acquis uniquement ; historique vidéo et erreur de crédit exclus', async () => {
  const b = await browser(); b.tracking.setConsent(true); const c = context();
  b.tracking.observeApi('/videos/old', 'GET', { id: 'old', statut: 'prete' }, null, c);
  b.tracking.observeApi('/videos/project', 'POST', { id: 'new', statut: 'en_attente' }, '{}', c);
  assert.equal(b.events('generation_terminee').length, 0);
  b.tracking.observeApi('/videos/new', 'GET', { id: 'new', statut: 'prete' }, null, c);
  b.tracking.observeApi('/videos/new', 'GET', { id: 'new', statut: 'prete' }, null, c);
  b.tracking.observeGenerationFailure('/photos/a/essai', 'insufficient', '{}', 402, 'site');
  assert.equal(b.events('generation_terminee').length, 1);
  b.tracking.observeApi('/photos/a/essai', 'POST', { versions: [{ id: 'v1', numero: 1 }] }, '{}', c);
  assert.equal(b.events('generation_terminee').length, 2);
  const path = '/photos/a/versions/v1/telecharger';
  b.tracking.observeDownload(path, new Response(), 'site'); assert.equal(b.events('telechargement_hd').length, 0);
  b.tracking.observeDownload(path, new Response(null, { headers: { 'X-Photo-Offerte': '1' } }), 'site');
  b.tracking.observeDownload(path, new Response(null, { headers: { 'X-Photo-Offerte': '1' } }), 'site');
  assert.equal(b.events('telechargement_hd').length, 1); assert.equal(b.events('telechargement_hd')[0].value, undefined);
});
test('Panier utilise les prix du serveur, achat réel réservé et confirmé une seule fois', async () => {
  const b = await browser(); b.tracking.setConsent(true); const calls = [];
  const c = context(async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify(url.endsWith('/confirmer') ? { confirme: true } : { ticket: 'ticket', value: 9.99, nature: 'photo', credits: 10, items: [{ item_id: 'photo10', quantity: 1 }] }), { headers: { 'Content-Type': 'application/json' } }); });
  b.tracking.observeApi('/compte', 'GET', { role: 'client', packs_photo: [{ id: 'photo10', prix_centimes: 999, nature: 'photo', credits: 10 }] }, null, c);
  b.tracking.observeApi('/paiements/checkout', 'POST', { achat_id: 'real-order', statut: 'en_attente' }, JSON.stringify({ articles: [{ pack_id: 'photo10', quantite: 2 }], value: 0.01 }), c);
  assert.equal(b.events('begin_checkout')[0].value, 19.98); assert.equal(b.events('pack_achete').length, 0);
  b.tracking.observeApi('/paiements/real-order', 'GET', { id: 'real-order', statut: 'paye' }, null, c);
  b.tracking.observeApi('/paiements/real-order', 'GET', { id: 'real-order', statut: 'paye' }, null, c);
  await tick(); assert.equal(b.events('pack_achete').length, 1); assert.equal(b.events('pack_achete')[0].value, 9.99);
  assert.equal(calls.filter(v => v.url.endsWith('/conversion')).length, 1); assert.equal(calls.filter(v => v.url.endsWith('/confirmer')).length, 1);
});
test('Comptes administrateur exclus et mode natif sans navigateur totalement silencieux', async () => {
  const b = await browser(); b.tracking.setConsent(true); const c = context();
  b.tracking.observeApi('/compte', 'GET', { role: 'admin' }, null, c);
  b.tracking.observeApi('/photos/a/essai', 'POST', { versions: [{ id: 'admin-v', numero: 1 }] }, '{}', c);
  assert.equal(b.events('generation_terminee').length, 0);
  delete globalThis.window; delete globalThis.document;
  b.tracking.initializeTracking(); assert.equal(b.tracking.emit({ event: 'native' }), false);
});

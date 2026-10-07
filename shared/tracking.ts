/** Klay event contract, shared by Next and Expo Web. No browser = no tracking. */
export const GTM_ID = 'GTM-53FSBGMS';
export const CONSENT_KEY = 'sa_consentement';
export const CONSENT_CHANGED = 'sa:consentement-change';
export const CONSENT_PREFERENCES = 'sa:preferences-cookies';
export type Consent = { accepte: boolean; date: string; version: 2 };
export type Support = 'site' | 'app';
type Payload = { event: string; [key: string]: unknown };
type Dictionary = Record<string, unknown>;
type Context = { base: string; token: () => string | null; support: Support; transport?: typeof fetch };
declare global { interface Window { dataLayer?: unknown[]; } }

const SIX_MONTHS = 180 * 86400000;
const NINETY_DAYS = 90 * 86400000;
const once = new Set<string>();
let remembered: Consent | null | undefined;
let started = false;
let bootstrapped = false;
let currentPage = '';
let accountRole = '';
let accountPacks: Dictionary[] = [];
let attributed = '';
const pendingConversions = new Set<string>();
const pendingVideos = new Set<string>();

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    const value = JSON.parse(raw || 'null');
    if (value?.version === 2 && typeof value.accepte === 'boolean' && typeof value.date === 'string') {
      const age = Date.now() - Date.parse(value.date);
      if (age >= 0 && age < SIX_MONTHS) return value as Consent;
    }
    if (raw !== null) return null;
  } catch { /* A browser without storage can still refuse or accept for this page. */ }
  const rememberedAge = remembered ? Date.now() - Date.parse(remembered.date) : -1;
  if (remembered && rememberedAge >= 0 && rememberedAge < SIX_MONTHS) return remembered;
  return null;
}
export const trackingAllowed = () => readConsent()?.accepte === true && /^(www\.)?studioannonce\.fr$/.test(window.location.hostname);
function command(..._values: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer ??= [];
  // Google expects an arguments object for consent commands.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}
function consentSignals(accepted: boolean) {
  const state = accepted ? 'granted' : 'denied';
  return { ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state };
}
function defaults() {
  if (bootstrapped) return;
  bootstrapped = true;
  command('consent', 'default', consentSignals(false));
}
export function setConsent(accepte: boolean) {
  if (typeof window === 'undefined') return;
  defaults();
  const value: Consent = { accepte, date: new Date().toISOString(), version: 2 };
  remembered = value;
  try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch { /* Page-only choice. */ }
  command('consent', 'update', consentSignals(accepte));
  if (accepte) { startTracking(); captureClick(); emit({ event: 'consentement_maj', consentement: 'accepte' }); }
  else { clearAdvertisingStorage(); attributed = ''; }
  window.dispatchEvent(new Event(CONSENT_CHANGED));
  // A loaded third-party script cannot be unexecuted. Reload with denied consent.
  if (!accepte && started) window.location.reload();
}
export function openPreferences() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CONSENT_PREFERENCES));
}
function clearAdvertisingStorage() {
  if (typeof document === 'undefined') return;
  document.cookie.split(';').forEach(entry => {
    const name = entry.trim().split('=')[0];
    if (!/^(_ga(?:_|$)|_gcl_|sa_gclid$)/.test(name)) return;
    for (const domain of ['', `; Domain=${window.location.hostname}`, '; Domain=.studioannonce.fr']) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain}`;
    }
  });
  try { window.localStorage.removeItem('sa_clic_date'); window.localStorage.removeItem('sa_clic_type'); } catch { /* Optional storage. */ }
}
/** No GTM request or noscript iframe before consent, including anonymous pings. */
export function initializeTracking() {
  if (typeof window === 'undefined') return;
  defaults();
  try { window.localStorage.removeItem('studioannonce:consentement-cookies:v1'); } catch { /* Not an advertising consent. */ }
  if (trackingAllowed()) { command('consent', 'update', consentSignals(true)); startTracking(); captureClick(); }
  else clearAdvertisingStorage();
}
function startTracking() {
  if (typeof document === 'undefined' || !trackingAllowed() || started) return;
  defaults();
  command('consent', 'update', consentSignals(true));
  started = true;
  window.dataLayer ??= [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.id = 'sa-gtm'; script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}
export function emit(data: Payload): boolean {
  if (typeof document === 'undefined' || !trackingAllowed()) return false;
  window.dataLayer ??= [];
  // Clear a previous enhanced-conversion variable on every unrelated event.
  window.dataLayer.push({ user_data: null, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== '')) });
  return true;
}
export function emitOnce(key: string, data: Payload): boolean {
  if (typeof window === 'undefined' || !trackingAllowed()) return false;
  const storageKey = `sa_evt_${key}`;
  try { if (window.sessionStorage.getItem(storageKey)) return false; } catch { /* Memory guard below. */ }
  if (once.has(key) || !emit(data)) return false;
  once.add(key);
  try { window.sessionStorage.setItem(storageKey, '1'); } catch { /* Memory guard stays active. */ }
  return true;
}
export function captureClick() {
  if (typeof window === 'undefined' || !trackingAllowed()) return;
  const query = new URLSearchParams(window.location.search);
  for (const type of ['gclid', 'gbraid', 'wbraid']) {
    const click = query.get(type);
    if (!click || !/^[A-Za-z0-9_-]{1,250}$/.test(click)) continue;
    const saved = readClick();
    if (saved?.identifiant === click && saved.type === type) break;
    document.cookie = `sa_gclid=${encodeURIComponent(click)}; Max-Age=${NINETY_DAYS / 1000}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    try { window.localStorage.setItem('sa_clic_date', new Date().toISOString()); window.localStorage.setItem('sa_clic_type', type); } catch { /* No offline attribution without a known click date. */ }
    break;
  }
}
export function readClick() {
  if (typeof document === 'undefined' || !trackingAllowed()) return null;
  try {
    const id = decodeURIComponent(document.cookie.split(';').map(e => e.trim()).find(e => e.startsWith('sa_gclid='))?.slice(9) || '');
    const date = window.localStorage.getItem('sa_clic_date') || '';
    const type = window.localStorage.getItem('sa_clic_type') || '';
    const age = Date.now() - Date.parse(date);
    return /^[A-Za-z0-9_-]{1,250}$/.test(id) && ['gclid', 'gbraid', 'wbraid'].includes(type) && age >= 0 && age < NINETY_DAYS ? { identifiant: id, type, date_clic: date } : null;
  } catch { return null; }
}
/** Query strings can contain emails, codes and signed media links; never send them. */
export function pageNavigation(path: string, support: Support) {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash;
  const safeHash = /^#(nouvelle|visite|creer|creer-image|video-photos|bibliotheque|brouillons)$/.test(hash) ? hash : '';
  const next = path.split('?')[0] + safeHash;
  captureClick();
  if (!currentPage) { currentPage = next; return; } // GTM owns the initial page view.
  if (next === currentPage) return;
  const previous = currentPage; currentPage = next;
  emit({ event: 'page_view_spa', page_path: next, page_location: window.location.origin + next, page_referrer: window.location.origin + previous, support });
}
export function demoInteraction(element: 'comparateur' | 'film' | 'parcours' | 'filtre', variante?: string) {
  if (typeof window === 'undefined' || /^\/(app|mobile|demo)\//.test(window.location.pathname)) return;
  emitOnce(`demo_${element}`, { event: 'demo_interaction', element, variante });
}
async function request(context: Context, path: string, method = 'GET', body?: Dictionary) {
  const token = context.token(); if (!token || !trackingAllowed()) return null;
  const consent = readConsent();
  const response = await (context.transport || fetch)(context.base.replace(/\/$/, '') + path, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify({ ...body, consentement: true, date_consentement: consent?.date }) } : {}),
    signal: AbortSignal.timeout(5000),
  });
  return response.ok ? await response.json() as Dictionary : null;
}
export async function attachAttribution(context: Context, achatId?: string) {
  const click = readClick();
  if (!click || accountRole === 'admin' || accountRole === 'proprietaire') return;
  const key = `${context.token()}:${click.identifiant}:${achatId || ''}`;
  if (attributed === key) return;
  const result = await request(context, '/compte/publicite', 'POST', { ...click, achat_id: achatId });
  if (result) attributed = key;
}
export async function revokeAttribution(context: Context) {
  const token = context.token(); if (!token || readConsent()?.accepte !== false) return;
  try { await (context.transport || fetch)(context.base.replace(/\/$/, '') + '/compte/publicite/revoquer', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true,
  }); } catch { /* Retried at the next profile refresh. */ }
}
async function purchaseConversion(id: string, context: Context) {
  if (pendingConversions.has(id) || !trackingAllowed()) return;
  pendingConversions.add(id);
  try {
    await attachAttribution(context, id);
    const order = await request(context, `/compte/achats/${encodeURIComponent(id)}/conversion`, 'POST', {});
    if (!order?.ticket || !trackingAllowed()) return;
    const sent = emitOnce(`pack_achete_${id}`, {
      event: 'pack_achete', transaction_id: id, value: order.value, montant_ttc: order.value,
      currency: 'EUR', valeur_base: 'ca_ttc', pack: order.pack, type_pack: order.nature,
      nb_credits: order.credits, premier_achat: order.premier_achat, items: order.items, support: context.support,
      user_data: order.user_data,
    });
    // A successful local push (or an existing session push) is acknowledged separately.
    if (sent || once.has(`pack_achete_${id}`) || window.sessionStorage.getItem(`sa_evt_pack_achete_${id}`)) {
      await request(context, `/compte/achats/${encodeURIComponent(id)}/conversion/confirmer`, 'POST', { ticket: order.ticket });
    }
  } catch { /* Tracking never blocks creation, account access, or Stripe. */ }
  finally { pendingConversions.delete(id); }
}
/** Observes only confirmed API actions. Does not inspect prompts, image bytes or names. */
export function observeApi(path: string, method: string, data: unknown, body: BodyInit | null | undefined, context: Context) {
  if (typeof document === 'undefined' || !data || typeof data !== 'object') return;
  const value = data as Dictionary;
  if (path === '/compte') {
    accountRole = String(value.role || ''); accountPacks = [...(value.packs_photo as Dictionary[] || []), ...(value.packs_video as Dictionary[] || [])];
    if (trackingAllowed()) {
      void attachAttribution(context).catch(() => {});
      const id = new URLSearchParams(window.location.search).get('achat');
      if (id && /^[A-Za-z0-9_-]{1,24}$/.test(id)) void purchaseConversion(id, context);
    } else if (readConsent()?.accepte === false) void revokeAttribution(context);
    return;
  }
  if (!trackingAllowed()) return;
  if (method === 'POST' && path === '/auth/inscription' && value.ok) emitOnce('inscription_code_envoye', { event: 'inscription_code_envoye' });
  if (method === 'POST' && path === '/auth/inscription/verifier' && value.nouveau_compte === true) {
    let email = '';
    try { if (typeof body === 'string') email = String(JSON.parse(body).email || '').trim().toLowerCase(); } catch { /* Optional matching omitted. */ }
    emitOnce(`compte_cree_${value.compte_id}`, { event: 'compte_cree', methode: 'email', support: context.support, value: 0, currency: 'EUR', user_data: email ? { email_address: email } : undefined });
  }
  if (method === 'POST' && path === '/auth/connexion' && value.jeton) emitOnce(`login_${value.compte_id}`, { event: 'login', method: 'email', support: context.support });
  if (accountRole === 'admin' || accountRole === 'proprietaire') return;
  if (method === 'POST' && /^\/photos\/[^/]+(?:\/import)?$/.test(path) && value.id && value.logement_id) {
    const prefix = typeof body === 'string' ? body.match(/"image":\s*"([^"]{1,20})/)?.[1] || '' : '';
    const format = prefix.startsWith('/9j/') ? 'jpg' : prefix.startsWith('iVBOR') ? 'png' : prefix.startsWith('UklGR') ? 'webp' : 'autre';
    emitOnce(`import_${value.id}`, { event: 'photo_importee', nb_photos: 1, format, support: context.support });
  }
  if (method === 'POST' && /^\/photos\/[^/]+\/essai$/.test(path) && Array.isArray(value.versions)) {
    const version = value.versions.at(-1) as Dictionary | undefined;
    if (version?.id) emitOnce(`generation_${version.id}`, { event: 'generation_terminee', generation_id: version.id, outil: 'retouche', reussie: true, correction: Number(version.numero) > 1, support: context.support });
  }
  if (path.startsWith('/videos/') && value.id && value.statut) {
    const id = String(value.id);
    if (method === 'POST') { pendingVideos.add(id); try { window.sessionStorage.setItem(`sa_video_${id}`, '1'); } catch { /* Memory guard. */ } }
    let pending = pendingVideos.has(id);
    try { pending ||= window.sessionStorage.getItem(`sa_video_${id}`) === '1'; } catch { /* Memory guard. */ }
    if (pending && ['prete', 'echec'].includes(String(value.statut))) {
      emitOnce(`generation_${id}`, { event: 'generation_terminee', generation_id: id, outil: 'photos_video', reussie: value.statut === 'prete', correction: false, support: context.support });
    }
  }
  if (method === 'POST' && path === '/paiements/checkout' && value.achat_id && value.statut !== 'paye') {
    try {
      const input = typeof body === 'string' ? JSON.parse(body) : {};
      const articles: Dictionary[] = input.articles || [];
      const matched = articles.map(a => ({ pack: accountPacks.find(p => p.id === a.pack_id), quantity: Number(a.quantite) }));
      if (matched.length && matched.every(a => a.pack && Number.isSafeInteger(a.quantity) && a.quantity > 0)) {
        emitOnce(`checkout_${value.achat_id}`, { event: 'begin_checkout', commande_id: value.achat_id,
          currency: 'EUR', value: matched.reduce((sum, a) => sum + Number(a.pack!.prix_centimes) * a.quantity, 0) / 100,
          pack: matched.length === 1 ? matched[0].pack!.id : 'panier', type_pack: matched[0].pack!.nature,
          nb_credits: matched.reduce((sum, a) => sum + Number(a.pack!.credits) * a.quantity, 0), support: context.support,
          items: matched.map(a => ({ item_id: a.pack!.id, quantity: a.quantity })) });
      }
      void attachAttribution(context, String(value.achat_id)).catch(() => {});
    } catch { /* Ignore optional tracking when the cart cannot be verified. */ }
  }
  if (/^\/paiements\/[^/]+$/.test(path) && value.statut === 'paye' && value.id) void purchaseConversion(String(value.id), context);
}
export function observeGenerationFailure(path: string, id: string, body: BodyInit | null | undefined, status: number, support: Support) {
  if (status < 500 || !/^\/photos\/[^/]+\/essai$/.test(path) || accountRole === 'admin' || accountRole === 'proprietaire') return;
  let correction = false;
  try { correction = typeof body === 'string' && !!JSON.parse(body).depuis_version_id; } catch { /* Unknown remains false. */ }
  emitOnce(`generation_${id}`, { event: 'generation_terminee', generation_id: id, outil: 'retouche', reussie: false, correction, support });
}
export function observeDownload(path: string, response: Response, support: Support) {
  if (accountRole === 'admin' || accountRole === 'proprietaire') return;
  const id = path.match(/^\/photos\/([^/]+)\/versions\/[^/]+\/telecharger$/)?.[1];
  const offered = response.headers.get('X-Photo-Offerte') === '1';
  if (id && (offered || response.headers.get('X-Photo-Credit-Consomme') === '1')) emitOnce(`telechargement_${id}`, { event: 'telechargement_hd', photo_id: id, type_telechargement: offered ? 'offerte' : 'credit', outil: 'retouche', support });
}

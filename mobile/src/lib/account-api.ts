/** Account operations always use the server balance and limits. No local debit. */
export type Limit = { utilisees: number; limite: number; restantes: number; bloque: boolean };
export type Limits = { photo: Limit; video: Limit; support_url: string; support_telephone: string; support_email?: string };
export type Pack = { id: string; nature: 'photo' | 'video'; credits: number; secondes?: number; prix_centimes: number; prix_unitaire_centimes: number; libelle: string; avantage?: string };
export type Account = {
  id: string; email: string; prenom: string; nom: string; profil_complet: boolean;
  role: 'client' | 'admin' | 'proprietaire'; solde: number; photo_offerte_disponible: boolean;
  gratuit_illimite: boolean;
  paiement_disponible: boolean; paiement_photo_disponible: boolean; paiement_video_disponible: boolean;
  solde_video: number; limites?: Limits;
  packs: Pack[]; packs_photo: Pack[]; packs_video: Pack[];
  registre: { delta: number; motif: string; le: string }[];
  registre_video: { delta: number; motif: string; le: string }[];
};
export type Health = { ok: boolean; connexion_disponible: boolean; retouche_disponible: boolean; video_disponible?: boolean; paiement_disponible: boolean; paiement_photo_disponible?: boolean; paiement_video_disponible?: boolean };
export type Property = { id: string; nom: string; ville: string; type_annonce: string; source_url: string; cree_le?: string; photos: { id: string; vignette: string; essais: number; gardee: boolean; offerte: boolean; creditee: boolean; archivee?: boolean; titre?: string; ordre?: number; cree_le?: string; original?: string; version_gardee?: string | null; versions?: PhotoVersion[] }[] };
export type PhotoVersion = { id: string; numero: number; apercu: string; hd: boolean; consigne: string; cree_le?: string };
export type CreatedVideo = { id: string; statut: string; duree: number; erreur: string; url: string; plans_prets?: number; plans_total?: number; clips?: { photo_id: string; url: string }[] };
export type AccountPhoto = {
  id: string; logement_id: string; ordre: number; original: string; vignette: string; offerte: boolean;
  demande_brouillon: string;
  essais: number; essais_restants: number; cycle_id: string; reprise_necessaire: boolean; reprise_expiree: boolean;
  credite_le: string | null; version_gardee: string | null; versions: PhotoVersion[]; filigrane?: boolean; limites?: Limits;
  analyse: { piece: string; consigne: string; question: string; defauts: string[] } | null;
};
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function createAccountApi(base: string, getToken: () => string | null, onExpired: (token: string) => void, transport: typeof fetch = fetch) {
  const endpoint = base.replace(/\/$/, '');
  async function response(path: string, options: RequestInit = {}) {
    // Never send a bearer token to a URL supplied by an image or checkout response.
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) throw new ApiError(0, 'Adresse de service invalide.');
    const token = getToken();
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    let result: Response;
    try { result = await transport(`${endpoint}${path}`, { ...options, headers }); }
    catch { throw new ApiError(0, 'Connexion impossible. Vérifiez votre réseau puis réessayez.'); }
    if (!result.ok) {
      if (result.status === 401 && token) onExpired(token);
      let message = result.status === 403 ? 'L’hébergement a refusé cet envoi. Les photos déjà ajoutées sont conservées. Réessayez dans un instant.' : 'Le service est momentanément indisponible. Vos données déjà enregistrées sont conservées.';
      try { const data = await result.json(); if (typeof data.detail === 'string') message = data.detail; } catch { /* Keep the safe fallback. */ }
      if (message === 'There was an error parsing the body') message = 'L’envoi de cette photo est incomplet. Les photos déjà ajoutées sont conservées. Réessayez avec les fichiers restants.';
      throw new ApiError(result.status, message);
    }
    return result;
  }
  async function json<T>(path: string, options?: RequestInit): Promise<T> {
    const result = await response(path, options);
    if (!result.headers.get('content-type')?.includes('application/json')) throw new ApiError(502, 'La réponse du service est interrompue. Vos données déjà enregistrées sont conservées.');
    try { return await result.json(); } catch { throw new ApiError(502, 'La réponse du service est incomplète. Réessayez dans un instant.'); }
  }
  return { response, json };
}
export function generationLabel(photo: AccountPhoto) {
  if (photo.reprise_necessaire) return 'Corriger · 1 crédit';
  if (photo.essais === 0) return 'Créer mon aperçu';
  return photo.cycle_id === 'initial' ? 'Appliquer ma correction incluse' : 'Appliquer ma correction';
}
export function downloadLabel(photo: AccountPhoto) {
  if (photo.offerte) return 'Télécharger ma photo offerte';
  return photo.credite_le ? 'Télécharger sans filigrane' : 'Garder en HD · 1 crédit';
}
export function needsDownloadCredit(photo: AccountPhoto) { return !photo.offerte && !photo.credite_le; }
export function previewIsProtected(photo: AccountPhoto, isVersion: boolean) {
  return isVersion && (photo.filigrane ?? (!photo.offerte && !photo.credite_le));
}
export function canRequestGeneration(photo: AccountPhoto, blocked: boolean, balance: number) {
  return !blocked || (photo.reprise_necessaire && balance >= 1);
}

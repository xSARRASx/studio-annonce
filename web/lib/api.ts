import { observeApi, observeDownload, observeGenerationFailure } from '../../shared/tracking';
// Le seul endroit qui parle au cerveau. Jeton gardé dans le navigateur, jamais de clé ici.
// Le site public sert l'API sur le même domaine. Une compilation de production
// sans variable d'environnement ne doit jamais pointer vers l'ordinateur du visiteur.
export const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8000");

export function jeton(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("jeton"); } catch { return null; }
}
export function poserJeton(j: string | null) {
  try {
    if (j) { localStorage.setItem("jeton", j); localStorage.setItem("studio-annonce.account-session", j); }
    else { localStorage.removeItem("jeton"); localStorage.removeItem("studio-annonce.account-session"); sessionStorage.removeItem("studio-annonce.account-session"); }
  } catch {}
}

export class ErreurApi extends Error {
  constructor(public statut: number, message: string) { super(message); }
}

async function reponseApi(chemin: string, options: RequestInit = {}): Promise<Response> {
  const entetes: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  const j = jeton();
  if (j) entetes.Authorization = `Bearer ${j}`;
  if (options.body && !(options.body instanceof FormData)) entetes["Content-Type"] = "application/json";
  let rep: Response;
  try { rep = await fetch(`${API}${chemin}`, { ...options, headers: entetes }); }
  catch { throw new ErreurApi(0, "Le service ne répond pas pour le moment. Vérifiez votre connexion et réessayez."); }
  if (!rep.ok) {
    let message = rep.status === 403 ? "L’hébergement a refusé cet envoi. Les photos déjà reçues sont conservées. Réessayez ; si le refus persiste, contactez le support." : rep.status >= 500 ? "Le serveur n’a pas pu terminer cette action. Vos données déjà enregistrées sont conservées. Réessayez dans un instant." : "Cette action n’a pas abouti. Réessayez.";
    try { const d = await rep.json(); if (typeof d.detail === "string") message = d.detail; } catch {}
    if (message === "There was an error parsing the body") message = "Cette photo n’a pas pu être envoyée. Réessayez avec un fichier JPG, PNG ou WebP ; les photos déjà ajoutées sont conservées.";
    throw new ErreurApi(rep.status, message);
  }
  return rep;
}

export async function api<T = unknown>(chemin: string, options: RequestInit = {}): Promise<T> {
  let rep: Response;
  try { rep = await reponseApi(chemin, options); }
  catch (error) {
    if (typeof window !== 'undefined' && options.method === 'POST') try {
      observeGenerationFailure(chemin, crypto.randomUUID(), options.body, error instanceof ErreurApi ? error.statut : 0, 'site');
    } catch { /* No measurement failure can mask a service error. */ }
    throw error;
  }
  const type = rep.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new ErreurApi(502, "Le serveur n’a pas renvoyé de réponse complète. Vous pouvez reprendre cette action.");
  let data: T;
  try { data = await rep.json() as T; }
  catch { throw new ErreurApi(502, "La réponse du serveur a été interrompue. Vous pouvez reprendre cette action."); }
  try { observeApi(chemin, options.method || 'GET', data, options.body, { base: API, token: jeton, support: 'site' }); } catch { /* Optional measurement never changes the API result. */ }
  return data;
}

export async function telechargerPhoto(chemin: string): Promise<{
  fichier: Blob; creditConsomme: boolean; premierePhotoOfferte: boolean; repriseJusquAu: string | null;
}> {
  const rep = await reponseApi(chemin, { method: "POST" });
  try { observeDownload(chemin, rep, 'site'); } catch { /* Optional measurement. */ }
  return {
    fichier: await rep.blob(),
    creditConsomme: rep.headers.get("X-Photo-Credit-Consomme") === "1",
    premierePhotoOfferte: rep.headers.get("X-Photo-Offerte") === "1",
    repriseJusquAu: rep.headers.get("X-Photo-Reprise-Jusqu-Au") || null,
  };
}

export async function exportPublicitaire(nature: 'ventes_avec_gclid' | 'remboursements', mois: string): Promise<Blob> {
  if (!/^\d{4}-\d{2}$/.test(mois)) throw new Error('Choisissez un mois.');
  const fichier = await api<{ nom: string; contenu: string }>(`/admin/exports/${nature === 'ventes_avec_gclid' ? 'ventes' : nature}?mois=${encodeURIComponent(mois)}`);
  if (fichier.nom !== `${nature}-${mois}.csv` || typeof fichier.contenu !== 'string' || !fichier.contenu.trim()) throw new Error('Le fichier n’a pas été reçu complètement. Réessayez.');
  return new Blob([fichier.contenu], { type: 'text/csv;charset=utf-8' });
}

export type Version = { id: string; numero: number; consigne: string; depuis: string | null; apercu: string; hd: boolean; cree_le: string };
export type Analyse = { piece: string; defauts: string[]; consigne: string; question: string };
export type LimiteCreation = { utilisees: number; limite: number; restantes: number; bloque: boolean };
export type LimitesCreation = { proprietaire?: boolean; photo: LimiteCreation; video: LimiteCreation; support_url: string; support_telephone: string; support_email?: string };
export type Photo = {
  id: string; logement_id: string; original?: string; cree_le?: string; ordre: number; offerte: boolean; vignette: string; analyse: Analyse | null;
  demande_brouillon: string;
  usage_initial?: "photo" | "video";
  essais: number; essais_restants: number; alerte: number | null; version_gardee: string | null;
  credite_le: string | null; reprise_jusqu_au: string | null; versions: Version[];
  cycle_id: string; reprise_expiree: boolean; reprise_necessaire: boolean;
  essais_cycle: number; reprise_commence_le: string | null;
  filigrane: boolean; limites: LimitesCreation;
};
export type Logement = { id: string; nom: string; ville: string; type_annonce: string; cree_le: string;
  source_url: string; photos: { id: string; vignette: string; essais: number; gardee: boolean; offerte: boolean; creditee: boolean; archivee?: boolean;
    usage_initial?: "photo" | "video";
    titre?: string; ordre?: number; cree_le?: string; original?: string; version_gardee?: string | null; versions?: Version[] }[] };
export type VideoCreee = { id: string; statut: string; duree: number; erreur: string; url: string;
  plans_prets?: number; plans_total?: number; clips?: { photo_id: string; url: string }[] };
export type Pack = { id: string; nature: "photo" | "video"; credits: number; secondes?: number; prix_centimes: number; prix_unitaire_centimes: number; libelle: string; avantage?: string };
export type Achat = { id: string; nature: "photo" | "video"; credits: number; montant_centimes: number; devise: string; statut: string; cree_le: string; test: boolean };
export type Sante = { ok: boolean; connexion_disponible: boolean; retouche_disponible: boolean; video_disponible?: boolean; paiement_disponible: boolean; paiement_photo_disponible?: boolean; paiement_video_disponible?: boolean };
export type Compte = { id: string; email: string; prenom: string; nom: string; role: "client" | "admin" | "proprietaire"; profil_complet: boolean; paiement_disponible: boolean; paiement_photo_disponible: boolean; paiement_video_disponible: boolean; solde: number; solde_video: number; photo_offerte_disponible: boolean; photo_offerte_telechargee?: boolean;
  gratuit_illimite: boolean;
  limites: LimitesCreation;
  packs: Pack[]; packs_photo: Pack[]; packs_video: Pack[];
  registre: { delta: number; motif: string; le: string }[]; registre_video: { delta: number; motif: string; le: string }[] };

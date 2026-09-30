// Le seul endroit qui parle au cerveau. Jeton gardé dans le navigateur, jamais de clé ici.
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function jeton(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("jeton"); } catch { return null; }
}
export function poserJeton(j: string | null) {
  try {
    if (j) localStorage.setItem("jeton", j);
    else localStorage.removeItem("jeton");
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
    let message = "Une erreur est survenue.";
    try { const d = await rep.json(); message = typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail); } catch {}
    throw new ErreurApi(rep.status, message);
  }
  return rep;
}

export async function api<T = unknown>(chemin: string, options: RequestInit = {}): Promise<T> {
  const rep = await reponseApi(chemin, options);
  const type = rep.headers.get("content-type") || "";
  return (type.includes("application/json") ? rep.json() : rep.blob()) as Promise<T>;
}

export async function telechargerPhoto(chemin: string): Promise<{
  fichier: Blob; creditConsomme: boolean; premierePhotoOfferte: boolean; repriseJusquAu: string | null;
}> {
  const rep = await reponseApi(chemin, { method: "POST" });
  return {
    fichier: await rep.blob(),
    creditConsomme: rep.headers.get("X-Photo-Credit-Consomme") === "1",
    premierePhotoOfferte: rep.headers.get("X-Photo-Offerte") === "1",
    repriseJusquAu: rep.headers.get("X-Photo-Reprise-Jusqu-Au") || null,
  };
}

export type Version = { id: string; numero: number; consigne: string; depuis: string | null; apercu: string; hd: boolean; cree_le: string };
export type Analyse = { piece: string; defauts: string[]; consigne: string; question: string };
export type LimiteCreation = { utilisees: number; limite: number; restantes: number; bloque: boolean };
export type LimitesCreation = { photo: LimiteCreation; video: LimiteCreation; support_url: string; support_telephone: string; support_email?: string };
export type Photo = {
  id: string; logement_id: string; original?: string; cree_le?: string; ordre: number; offerte: boolean; vignette: string; analyse: Analyse | null;
  essais: number; essais_restants: number; alerte: number | null; version_gardee: string | null;
  credite_le: string | null; reprise_jusqu_au: string | null; versions: Version[];
  cycle_id: string; reprise_expiree: boolean; reprise_necessaire: boolean;
  essais_cycle: number; reprise_commence_le: string | null;
  filigrane: boolean; limites: LimitesCreation;
};
export type Logement = { id: string; nom: string; ville: string; type_annonce: string; cree_le: string;
  photos: { id: string; vignette: string; essais: number; gardee: boolean }[] };
export type Pack = { id: string; nature: "photo" | "video"; credits: number; secondes?: number; prix_centimes: number; prix_unitaire_centimes: number; libelle: string; avantage?: string };
export type Sante = { ok: boolean; connexion_disponible: boolean; retouche_disponible: boolean; paiement_disponible: boolean; paiement_photo_disponible?: boolean; paiement_video_disponible?: boolean };
export type Compte = { id: string; email: string; prenom: string; nom: string; role: "client" | "admin" | "proprietaire"; profil_complet: boolean; paiement_disponible: boolean; paiement_photo_disponible: boolean; paiement_video_disponible: boolean; solde: number; solde_video: number; photo_offerte_disponible: boolean;
  limites: LimitesCreation;
  packs: Pack[]; packs_photo: Pack[]; packs_video: Pack[];
  registre: { delta: number; motif: string; le: string }[]; registre_video: { delta: number; motif: string; le: string }[] };

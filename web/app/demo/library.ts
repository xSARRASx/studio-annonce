export type MediaKind = "photo" | "video";
export type DemoVersion = { id: string; label: string; src?: string; virtual?: boolean; note: string };
export type DemoProject = {
  id: string; title: string; property: string; kind: MediaKind; sample: boolean;
  createdAt: number; updatedAt: number; versions: DemoVersion[]; selected: string;
  saved?: string; file?: Blob; fileName?: string; draft: string;
  firstDownloadedAt?: number; editUntil?: number; freeDownload?: boolean;
};
export type CreditEvent = { id: string; project: string; label: string; amount: number; at: number };
export type DemoLibrary = { schema: 1; revision?: number; projects: DemoProject[]; credits: number; freeUsed: boolean; events: CreditEvent[] };
export const WEEK = 7 * 24 * 60 * 60 * 1000;
export const initialLibrary = (): DemoLibrary => ({ schema: 1, projects: [], credits: 5, freeUsed: false, events: [] });
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/demo/${path}`;
export const dateText = (time: number, withTime = false) => new Intl.DateTimeFormat("fr-FR", {
  day: "numeric", month: "long", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : {}),
}).format(time);
export const isExpired = (project: DemoProject, now = Date.now()) => project.editUntil !== undefined && project.editUntil <= now;

export function sampleProject(kind: MediaKind): DemoProject {
  const now = Date.now();
  if (kind === "video") return {
    id: "example-tour", title: "Une visite en douceur", property: "Appartement d’exemple", kind, sample: true,
    createdAt: now, updatedAt: now, selected: "tour", draft: "",
    versions: [{ id: "tour", label: "Maquette animée", src: asset("visite-guidee-demo.mp4"), note: "Séjour, cuisine, chambre · montage de photos fictives, sans génération vidéo." }],
  };
  return {
    id: "example-salon", title: "Le salon", property: "Appartement Lumière", kind, sample: true,
    createdAt: now, updatedAt: now, selected: "decor", draft: "",
    versions: [
      { id: "original", label: "Photo originale", src: asset("salon-avant.png"), note: "Le point de départ, toujours conservé." },
      { id: "light", label: "Plus de lumière", src: asset("salon-apres.png"), note: "Une lumière douce et un intérieur rangé." },
      { id: "terracotta", label: "Déco terracotta", src: asset("salon-deco.png"), virtual: true, note: "Une première proposition, conservée dans l’historique." },
      { id: "decor", label: "Décoration complète", src: asset("salon-deco-complete.png"), virtual: true, note: "Mobilier, luminaires et objets entièrement repensés." },
    ],
  };
}

let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  if (database) return database;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error("La sauvegarde locale n’est pas disponible dans ce navigateur.")); return; }
    let rejected = false;
    const request = indexedDB.open("studio-annonce-library", 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("library")) request.result.createObjectStore("library"); };
    request.onsuccess = () => {
      const db = request.result;
      // Une ouverture bloquée peut réussir plus tard : fermer ce résultat devenu inutile.
      if (rejected) { db.close(); return; }
      const forget = () => { if (database === opening) database = undefined; };
      db.onversionchange = () => { db.close(); forget(); };
      db.onclose = forget;
      resolve(db);
    };
    request.onerror = () => { rejected = true; reject(request.error); };
    request.onblocked = () => { rejected = true; reject(new Error("Fermez les autres aperçus Studio Annonce puis réessayez.")); };
  });
  database = opening;
  // Même un refus synchrone (navigation privée, IndexedDB absent) doit pouvoir être réessayé.
  void opening.catch(() => { if (database === opening) database = undefined; });
  return opening;
}

const invalidSave = () => new Error("Cette sauvegarde locale ne peut pas être lue. Elle est conservée, sans modification.");
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number, nonempty = false): value is string => typeof value === "string" && value.length <= max && (!nonempty || value.trim().length > 0);
const timestamp = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;
function localAsset(value: unknown): value is string {
  if (!text(value, 2000, true) || !value.startsWith("/")) return false;
  try {
    const url = new URL(value, "https://studio-annonce.invalid");
    return url.origin === "https://studio-annonce.invalid" && url.pathname.startsWith(asset(""));
  } catch { return false; }
}
function validate(value: unknown): DemoLibrary {
  if (value === undefined) return initialLibrary();
  if (!record(value) || value.schema !== 1 || !Array.isArray(value.projects) || !Array.isArray(value.events)
    || !Number.isSafeInteger(value.credits) || (value.credits as number) < 0 || typeof value.freeUsed !== "boolean"
    || (value.revision !== undefined && (!Number.isSafeInteger(value.revision) || (value.revision as number) < 0))) throw invalidSave();
  const projects = new Set<string>();
  for (const p of value.projects) {
    if (!record(p) || !text(p.id, 200, true) || projects.has(p.id) || !text(p.title, 500, true)
      || !text(p.property, 500) || !["photo", "video"].includes(p.kind as string) || typeof p.sample !== "boolean"
      || !timestamp(p.createdAt) || !timestamp(p.updatedAt) || !text(p.draft, 20_000)
      || !Array.isArray(p.versions) || !p.versions.length || !text(p.selected, 200, true)
      || (p.file !== undefined && (!(p.file instanceof Blob) || !p.file.size))
      || (p.fileName !== undefined && !text(p.fileName, 1000, true))) throw invalidSave();
    projects.add(p.id);
    const versions = new Set<string>();
    for (const v of p.versions) {
      if (!record(v) || !text(v.id, 200, true) || versions.has(v.id) || !text(v.label, 500, true) || !text(v.note, 20_000)
        || (v.virtual !== undefined && typeof v.virtual !== "boolean")
        || (v.src !== undefined && !localAsset(v.src)) || (!v.src && !p.file)) throw invalidSave();
      versions.add(v.id);
    }
    if (!versions.has(p.selected) || (p.saved !== undefined && (!text(p.saved, 200, true) || !versions.has(p.saved)))) throw invalidSave();
    if ((p.firstDownloadedAt !== undefined && !timestamp(p.firstDownloadedAt))
      || (p.editUntil !== undefined && !timestamp(p.editUntil))
      || (p.freeDownload !== undefined && typeof p.freeDownload !== "boolean")) throw invalidSave();
    if (p.firstDownloadedAt !== undefined) {
      if (p.kind !== "photo" || !p.sample || p.editUntil === undefined || typeof p.freeDownload !== "boolean"
        || (p.editUntil as number) < p.firstDownloadedAt) throw invalidSave();
    } else if (p.editUntil !== undefined || p.freeDownload !== undefined) throw invalidSave();
  }
  const events = new Set<string>();
  for (const event of value.events) {
    if (!record(event) || !text(event.id, 200, true) || events.has(event.id) || !text(event.project, 500, true)
      || !text(event.label, 500, true) || !Number.isSafeInteger(event.amount) || !timestamp(event.at)) throw invalidSave();
    events.add(event.id);
  }
  return value as DemoLibrary;
}

export async function readLibrary(): Promise<DemoLibrary> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("library", "readonly");
    const request = tx.objectStore("library").get("current");
    let result: DemoLibrary;
    let failure: unknown;
    request.onsuccess = () => {
      try { result = validate(request.result); }
      catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(failure || tx.error || new Error("La lecture de votre sauvegarde a été interrompue. Réessayez."));
    tx.onerror = () => { failure ||= tx.error; };
  });
}

// Read and write in one transaction so simultaneous tabs cannot spend the same credit twice.
export async function changeLibrary(change: (state: DemoLibrary) => void): Promise<DemoLibrary> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("library", "readwrite");
    const store = tx.objectStore("library");
    const request = store.get("current");
    let next: DemoLibrary;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        next = validate(request.result);
        const revision = (next.revision || 0) + 1;
        const outcome: unknown = change(next);
        if (outcome && typeof (outcome as Promise<unknown>).then === "function") {
          // Une mutation async peut reprendre après la clôture de la transaction : la refuser.
          void Promise.resolve(outcome).catch(() => {});
          throw new Error("La sauvegarde doit être effectuée en une seule opération. Aucun changement n’a été enregistré.");
        }
        next.revision = revision;
        validate(next);
        store.put(next, "current");
      } catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => resolve(next);
    tx.onabort = () => reject(failure || tx.error || new Error("La sauvegarde n’a pas abouti. Vos projets précédents sont conservés."));
    tx.onerror = () => { failure ||= tx.error; };
  });
}

export function projectFrom(state: DemoLibrary, id: string) {
  const project = state.projects.find(item => item.id === id);
  if (!project) throw new Error("Ce projet n’est plus accessible dans ce navigateur.");
  return project;
}
export function beginDownload(state: DemoLibrary, id: string, versionId: string, now = Date.now()) {
  if (!timestamp(now) || !timestamp(now + WEEK)) throw new Error("La date de téléchargement n’est pas valide.");
  const project = projectFrom(state, id);
  if (!project.versions.some(version => version.id === versionId)) throw new Error("Cette version n’existe pas.");
  if (project.kind !== "photo" || !project.sample || versionId === "original" || project.firstDownloadedAt !== undefined) return;
  const free = !state.freeUsed;
  if (!free && state.credits < 1) throw new Error("Vous avez utilisé les 5 crédits de démonstration. Vos versions déjà téléchargées restent disponibles.");
  if (free) state.freeUsed = true;
  else state.credits -= 1;
  project.firstDownloadedAt = now;
  project.editUntil = now + WEEK;
  project.freeDownload = free;
  state.events.unshift({ id: crypto.randomUUID(), project: project.title, label: free ? "Première photo offerte" : "Premier téléchargement HD", amount: free ? 0 : -1, at: now });
}
export function renewProject(state: DemoLibrary, id: string, now = Date.now()) {
  if (!timestamp(now) || !timestamp(now + WEEK)) throw new Error("La date de reprise n’est pas valide.");
  const project = projectFrom(state, id);
  if (project.kind !== "photo" || !project.sample || project.firstDownloadedAt === undefined) return;
  if (!isExpired(project, now)) return;
  if (state.credits < 1) throw new Error("Aucun crédit de démonstration restant. Vos fichiers et versions sont conservés.");
  state.credits -= 1;
  project.editUntil = now + WEEK;
  state.events.unshift({ id: crypto.randomUUID(), project: project.title, label: "Reprise pour 7 jours", amount: -1, at: now });
}

export async function importedProjects(files: File[], kind: MediaKind): Promise<DemoProject[]> {
  if (!files.length) return [];
  if (files.length > 20) throw new Error("Ajoutez jusqu’à 20 fichiers à la fois.");
  const allowed = kind === "photo" ? ["image/jpeg", "image/png", "image/webp"] : ["video/mp4", "video/quicktime", "video/webm"];
  const max = (kind === "photo" ? 20 : 100) * 1024 * 1024;
  const projects: DemoProject[] = [];
  for (const [index, file] of files.entries()) {
    if (!allowed.includes(file.type)) throw new Error(`${file.name} : choisissez ${kind === "photo" ? "une image JPG, PNG ou WebP" : "une vidéo MP4, MOV ou WebM"}.`);
    if (!file.size || file.size > max) throw new Error(`${file.name} : le fichier doit faire moins de ${kind === "photo" ? 20 : 100} Mo et ne pas être vide.`);
    if (kind === "photo") {
      try {
        const decoded = await createImageBitmap(file);
        const valid = decoded.width > 0 && decoded.height > 0 && decoded.width * decoded.height <= 64_000_000;
        decoded.close();
        if (!valid) throw new Error("dimensions");
      } catch { throw new Error(`${file.name} : cette image ne peut pas être ouverte. Essayez une autre photo.`); }
    }
    const now = Date.now() + index;
    projects.push({ id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ""), property: "Mon logement", kind, sample: false,
      createdAt: now, updatedAt: now, selected: "original", file, fileName: file.name, draft: "",
      versions: [{ id: "original", label: kind === "photo" ? "Photo originale" : "Vidéo originale", note: "Votre fichier, conservé sur cet appareil." }],
    });
  }
  return projects;
}

export function storageError(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return "Votre navigateur manque d’espace. Aucun fichier existant n’a été supprimé ; gardez une copie de vos originaux sur votre appareil.";
  return error instanceof Error ? error.message : "La sauvegarde locale est indisponible. Aucun projet existant n’a été modifié.";
}

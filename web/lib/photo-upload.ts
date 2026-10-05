import { api, ErreurApi, type Photo } from "./api";

const preparations = new WeakMap<File, Promise<Blob>>();
export function preparerPhoto(fichier: File): Promise<Blob> {
  let result = preparations.get(fichier);
  if (!result) { result = photoPourEnvoi(fichier); preparations.set(fichier, result); void result.catch(() => preparations.delete(fichier)); }
  return result;
}

const imports = new WeakMap<File, Map<string, { cle: string; body: Promise<string> }>>();

/** Réduit les grandes photos avant l'envoi, sans modifier le fichier original. */
export async function photoPourEnvoi(fichier: File): Promise<Blob> {
  if (!fichier.type.startsWith("image/")) throw new Error("Choisissez un fichier image.");
  if (fichier.size > 30 * 1024 * 1024) throw new Error("Choisissez une photo de moins de 30 Mo.");
  if (fichier.size < 1_500_000 && fichier.type === "image/jpeg") return fichier;
  const bitmap = await createImageBitmap(fichier);
  try {
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const contexte = canvas.getContext("2d");
    if (!contexte) throw new Error("Cette photo ne peut pas être préparée sur cet appareil.");
    contexte.fillStyle = "white";
    contexte.fillRect(0, 0, canvas.width, canvas.height);
    contexte.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("Cette photo ne peut pas être préparée.")),
      "image/jpeg", 0.82,
    ));
  } finally { bitmap.close(); }
}

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result).split(",", 2)[1]);
    lecteur.onerror = () => reject(new Error("Cette photo ne peut pas être lue. Choisissez le fichier à nouveau."));
    lecteur.readAsDataURL(blob);
  });
}

/** Une réponse perdue reprend le même envoi, sans dupliquer la photo sur le compte. */
export async function envoyerPhoto(fichier: File, logementId: string, demande = ""): Promise<Photo> {
  let confirmations = imports.get(fichier);
  if (!confirmations) { confirmations = new Map(); imports.set(fichier, confirmations); }
  const signature = `${logementId}:${demande}`;
  let confirmation = confirmations.get(signature);
  if (!confirmation) {
    const cle = crypto.randomUUID();
    confirmation = { cle, body: preparerPhoto(fichier).then(base64).then(image => JSON.stringify({ image, demande, cle_import: cle })) };
    confirmations.set(signature, confirmation);
    void confirmation.body.catch(() => confirmations?.delete(signature));
  }
  const body = await confirmation.body;
  const envoyer = () => api<Photo>(`/photos/${logementId}/import`, { method: "POST", body });
  try { return await envoyer(); }
  catch (erreur) {
    if (![0, 502, 504].includes((erreur as ErreurApi).statut)) throw erreur;
    return envoyer();
  }
}

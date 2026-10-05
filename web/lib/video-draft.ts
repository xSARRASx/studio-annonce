import { api } from "./api";
export type SavedDraft = { id: string; nature: "video" | "photo" | "image"; donnees: Record<string, unknown>; photo_id?: string; titre?: string; vignette?: string; modifie_le: string; video_id?: string };
export function readVideoDraftId(storageKey: string): string {
  const launched = localStorage.getItem(`${storageKey}:launched-snapshot`);
  if (launched && launched !== localStorage.getItem(storageKey)) {
    localStorage.removeItem(`${storageKey}:draft-id`);
    localStorage.removeItem(`${storageKey}:launched-snapshot`);
  }
  let id = localStorage.getItem(`${storageKey}:draft-id`);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(`${storageKey}:draft-id`, id); }
  return id;
}
export async function saveVideoDraft(storageKey: string, donnees: Record<string, unknown>): Promise<string> {
  const id = readVideoDraftId(storageKey);
  await api(`/brouillons/${id}`, { method: "PUT", body: JSON.stringify({ nature: "video", donnees }) });
  window.dispatchEvent(new Event("studio:drafts-updated"));
  return id;
}

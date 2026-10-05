"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FilePenLine, Film, ArrowRight } from "lucide-react";
import { photoPreparation } from "@/lib/photo-preparation";
import { api } from "@/lib/api";
import type { SavedDraft } from "@/lib/video-draft";
export function CreationDrafts({ onResume, accountId }: { accountId: string; onResume: (draft: SavedDraft) => void }) {
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = () => { void photoPreparation(`studio:${accountId}:new-photo`).then(saved => { if (active) setLocalCount(saved && (saved.fichiers.length || saved.demande) ? saved.fichiers.length : null); }).catch(() => {}); void api<SavedDraft[]>("/brouillons").then(data => { if (active) { setDrafts(data); setError(""); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); };
    load(); window.addEventListener("studio:drafts-updated", load);
    return () => { active = false; window.removeEventListener("studio:drafts-updated", load); };
  }, [accountId]);
  return <main className="st-main"><h1>Mes brouillons</h1><p>Reprenez vos photos et vidéos avant de lancer leur création. Enregistrer un brouillon ne consomme aucun crédit.</p>
    {loading && <p role="status">Chargement des brouillons…</p>}{error && <p role="alert">{error}</p>}
    {!loading && !drafts.length && localCount === null && <p>Aucun brouillon pour le moment. Vos préparations apparaîtront ici.</p>}
    <div className="draft-grid">{localCount !== null && <article><FilePenLine size={22}/><h2>Retouches en préparation</h2><p>{localCount} photos choisies. Brouillon conservé sur cet appareil.</p><a className="button dark" href="#nouvelle">Continuer la préparation <ArrowRight size={17}/></a></article>}{drafts.map(draft => <article key={`${draft.nature}-${draft.id}`}>{draft.nature === "video" ? <Film size={22}/> : <FilePenLine size={22}/>}<h2>{draft.titre || (draft.nature === "video" ? "Vidéo en préparation" : "Photo en préparation")}</h2><p>{String(draft.donnees.idea || draft.donnees.brief || "Photos choisies, demande à compléter").slice(0, 180)}</p><small>{draft.nature === "video" ? `${Array.isArray(draft.donnees.selectedIds) ? draft.donnees.selectedIds.length : 0} photos · ` : ""}Enregistré le {new Date(draft.modifie_le).toLocaleString("fr-FR")}</small>{draft.photo_id ? <Link className="button dark" href={`/app/photo/?id=${draft.photo_id}`}>Reprendre cette photo <ArrowRight size={17}/></Link> : <button type="button" className="button dark" onClick={() => onResume(draft)}>Reprendre ce brouillon <ArrowRight size={17}/></button>}</article>)}</div>
  </main>;
}

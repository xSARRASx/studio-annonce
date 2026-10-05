"use client";
import { useEffect, useState } from "react";
import { Archive, Trash2, Undo2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/app/demo/studio-parts";

export type CreationAction = { id: string; nature: "photos" | "videos"; titre: string; vignette?: string; action: "archiver" | "supprimer" };
export function CreationConfirmation({ item, onClose, onStart, onDone, onError }: { item: CreationAction; onClose: () => void; onStart?: () => void; onDone: () => void; onError?: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const archive = item.action === "archiver";
  const name = item.nature === "photos" ? "photo" : "vidéo";
  async function confirm() {
    if (busy) return;
    setBusy(true); setError("");
    onStart?.();
    try {
      await api(archive ? `/photos/${item.id}/archiver` : `/creations/${item.nature}/${item.id}`, { method: archive ? "POST" : "DELETE", keepalive: true });
      onDone();
    } catch (cause) {
      const message = (cause as Error).message;
      if (onError) onError(message);
      else { setError(message); setBusy(false); }
    }
  }
  return <Modal title={`${archive ? "Archiver" : "Supprimer"} cette ${name} ?`} mandatory={busy} onClose={() => { if (!busy) onClose(); }}>
    <div className="creation-confirm">
      <div className="creation-confirm-source">{item.vignette && <img src={item.vignette} alt=""/>}<strong>{item.titre}</strong></div>
      <p>{archive ? "Elle sera rangée dans vos archives. Vous pourrez la retrouver et la restaurer à tout moment." : `Cette ${name} sera retirée de Mes créations et placée dans la corbeille. Vous pourrez la restaurer en cas d’erreur.`}</p>
      {item.nature === "photos" && <p className="creation-small">L’original et ses retouches restent ensemble. Les vidéos déjà créées restent disponibles.</p>}
      {error && <p className="st-error" role="alert">{error}</p>}
      <div className="creation-actions"><button type="button" className="button outlined" disabled={busy} onClick={onClose}>Annuler</button><button type="button" className={`button ${archive ? "dark" : "creation-danger"}`} disabled={busy} onClick={() => void confirm()}>{archive ? <Archive size={17}/> : <Trash2 size={17}/>} {busy ? "En cours…" : archive ? "Oui, archiver" : "Oui, supprimer"}</button></div>
    </div>
  </Modal>;
}
export function CreationNotice({ text, onClose }: { text: string; onClose: () => void }) {
  return text ? <div className="creation-toast" role="status"><span>{text}</span><button type="button" aria-label="Fermer le message" onClick={onClose}><X size={18}/></button></div> : null;
}
type Item = { id: string; nature: "photos" | "videos"; titre: string; logement: string; vignette: string; duree?: number; url?: string; en_cours: boolean; statut?: string };
export function CreationExtras({ revision, onChange, onNotice }: { revision: number; onChange: () => void; onNotice: (message: string) => void }) {
  const [trash, setTrash] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmation, setConfirmation] = useState<CreationAction | null>(null);
  useEffect(() => {
    let active = true;
    api<Item[]>(`/creations?corbeille=${trash}`).then(data => { if (active) { setItems(data); setError(""); setLoading(false); } }).catch(cause => { if (active) { setItems([]); setError(cause.message); setLoading(false); } });
    return () => { active = false; };
  }, [trash, revision]);
  async function restore(item: Item) {
    if (busy) return;
    setBusy(item.id); setError("");
    try { await api(`/creations/${item.nature}/${item.id}/restaurer`, { method: "POST" }); setItems(previous => previous.filter(p => p.id !== item.id)); onNotice("Création restaurée dans Mes créations."); onChange(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(""); }
  }
  return <section className="creation-extras" aria-label="Vidéos et corbeille">
    <div className="creation-extras-head"><h2>{trash ? "Ma corbeille" : "Mes vidéos"}</h2><button className="button outlined" type="button" aria-pressed={trash} onClick={() => { setTrash(value => !value); setLoading(true); setError(""); }}>{trash ? "Voir mes vidéos" : <><Trash2 size={17}/> Ouvrir la corbeille</>}</button></div>
    {error && <p className="st-error" role="alert">{error}<button className="text-action" onClick={onChange}>Réessayer</button></p>}
    {loading ? <p role="status">Chargement…</p> : !items.length ? <p>{trash ? "La corbeille est vide." : "Vos vidéos apparaîtront ici après leur création."}</p> : <div className="creation-video-grid">{items.map(item => <article key={`${item.nature}-${item.id}`}>
      {!trash && item.url ? <video controls playsInline preload="none" poster={item.vignette} src={item.url}/> : item.vignette ? <img src={item.vignette} alt=""/> : null}
      <strong>{item.titre}</strong><small>{item.nature === "photos" ? item.logement : `${item.duree || 5} secondes · ${item.en_cours ? "En cours" : item.statut === "echec" ? "À vérifier" : "Terminée"}`}</small>
      {trash ? <button type="button" className="button outlined" disabled={!!busy} onClick={() => void restore(item)}><Undo2 size={16}/> {busy === item.id ? "Restauration…" : "Restaurer"}</button> : <button type="button" className="text-action creation-delete" disabled={item.en_cours} onClick={() => setConfirmation({ ...item, action: "supprimer" })}><Trash2 size={16}/> Supprimer la vidéo</button>}
      {item.en_cours && <small>La suppression sera disponible une fois la création terminée.</small>}
    </article>)}</div>}
    {confirmation && <CreationConfirmation key={confirmation.id} item={confirmation} onClose={() => setConfirmation(null)} onStart={() => { setItems(previous => previous.filter(item => item.id !== confirmation.id)); onNotice("Déplacement de la vidéo vers la corbeille en cours…"); setConfirmation(null); }} onDone={() => { onNotice("Vidéo déplacée dans la corbeille."); onChange(); }} onError={message => { onNotice(`La suppression n’a pas abouti : ${message}`); onChange(); }}/>}
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, type Logement } from "@/lib/api";

export function CreationArchives({ onRestore }: { onRestore: () => void }) {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    api<Logement[]>("/logements?archives=true")
      .then(items => { if (active) { setLogements(items); setLoading(false); } })
      .catch(cause => { if (active) { setError((cause as Error).message); setLoading(false); } });
    return () => { active = false; };
  }, []);

  async function restore(photoId: string) {
    if (busy) return;
    const previous = logements;
    setBusy(photoId);
    setError("");
    setNotice("Photo restaurée dans Mes créations.");
    setLogements(items => items.map(home => ({ ...home, photos: home.photos.filter(photo => photo.id !== photoId) })));
    try {
      await api(`/photos/${photoId}/restaurer`, { method: "POST", keepalive: true });
      onRestore();
    } catch (cause) {
      setLogements(previous);
      setNotice("");
      setError(`La restauration n’a pas abouti : ${(cause as Error).message}`);
    } finally { setBusy(""); }
  }

  const archived = logements.map(home => ({ ...home, photos: home.photos.filter(photo => photo.archivee) })).filter(home => home.photos.length);
  const count = archived.reduce((total, home) => total + home.photos.length, 0);
  return <main className="st-main st-archive-page">
    <div className="st-head"><div><p className="eyebrow">VOTRE BIBLIOTHÈQUE</p><h1>Photos archivées</h1><p>Retrouvez ici les photos mises de côté. Vous pouvez les restaurer en un clic.</p></div></div>
    {loading && <p role="status">Chargement des archives…</p>}
    {error && <p role="alert" className="st-archive-error">{error}</p>}
    {notice && <p role="status" className="st-archive-success">{notice}</p>}
    {!loading && !error && count === 0 && <div className="st-archive-empty"><strong>Aucune photo archivée</strong><p>Les photos que vous archivez apparaîtront ici.</p></div>}
    {archived.map(home => <section className="st-archive-group" key={home.id} aria-label={home.nom}>
      <h2>{home.nom} <span>{home.photos.length}</span></h2>
      <div className="st-archive-grid">{home.photos.map(photo => <article key={photo.id} className="st-archive-card">
        <Image src={photo.vignette} alt={photo.titre || "Photo archivée"} width={84} height={84} unoptimized/>
        <div><strong>{photo.titre || "Photo archivée"}</strong><div className="st-archive-actions"><button type="button" disabled={!!busy} onClick={() => void restore(photo.id)}>{busy === photo.id ? "Restauration…" : "Restaurer"}</button><Link href={`/app/photo/?id=${encodeURIComponent(photo.id)}`}>Ouvrir</Link></div></div>
      </article>)}</div>
    </section>)}
  </main>;
}

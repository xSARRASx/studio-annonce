"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, ImagePlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, type Logement, type Photo } from "@/lib/api";
import { Bouton, Message, Pastille } from "@/components/ui";

function PageLogement() {
  const router = useRouter();
  const id = useSearchParams().get("id") || "";
  const [logement, setLogement] = useState<Logement | null>(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null);
  const [glisse, setGlisse] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => { if (id) api<Logement>(`/logements/${id}`).then(setLogement).catch((e) => setErreur(e.message)); }, [id]);

  const choisies = logement?.photos.filter(photo => selection.includes(photo.id)) || [];
  const cout = choisies.filter(photo => !photo.offerte && !photo.creditee).length;
  function basculer(photoId: string) {
    setSelection(current => current.includes(photoId) ? current.filter(id => id !== photoId) : [...current, photoId]);
  }
  function commencerSelection() {
    if (!selection.length) return;
    const ordre = logement?.photos.filter(photo => selection.includes(photo.id)).map(photo => photo.id) || [];
    if (ordre.length) router.push(`/app/photo/?id=${ordre[0]}&lot=${encodeURIComponent(ordre.join(","))}`);
  }

  async function reduire(fichier: File): Promise<Blob> {
    // Le téléphone réduit la photo avant l'envoi : 4 fois plus rapide, l'IA n'a pas besoin de plus de 2048 px.
    const bitmap = await createImageBitmap(fichier);
    const echelle = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    if (echelle === 1) return fichier;
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * echelle); c.height = Math.round(bitmap.height * echelle);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob((b) => res(b || fichier), "image/jpeg", 0.92));
  }

  async function deposer(fichiers: FileList | File[]) {
    const liste = Array.from(fichiers).filter((f) => f.type.startsWith("image/"));
    if (!liste.length) return;
    setErreur(""); setEnvoi({ fait: 0, total: liste.length });
    for (let i = 0; i < liste.length; i++) {
      try {
        const fd = new FormData();
        fd.append("fichier", await reduire(liste[i]), liste[i].name.replace(/\.[^.]+$/, "") + ".jpg");
        const photo = await api<Photo>(`/photos/${id}`, { method: "POST", body: fd });
        setLogement((l) => l && { ...l, photos: [...l.photos, { id: photo.id, vignette: photo.vignette, essais: 0, gardee: false, offerte: photo.offerte, creditee: !!photo.credite_le }] });
      } catch (e) { setErreur((e as Error).message); }
      setEnvoi({ fait: i + 1, total: liste.length });
    }
    setTimeout(() => setEnvoi(null), 800);
  }

  return (
    <div className="connected-legacy apparait space-y-6">
      <Link href="/app" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Mes créations</Link>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{logement?.nom || "…"}</h1>
          <p className="text-fg-muted mt-1">{logement?.ville} {logement && <Pastille>{logement.type_annonce}</Pastille>}</p>
        </div>
        <Bouton className="ml-auto" onClick={() => champ.current?.click()}><ImagePlus className="size-4" /> Ajouter des photos</Bouton>
        <input ref={champ} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && deposer(e.target.files)} />
      </div>
      {logement?.source_url && <p className="text-sm text-fg-muted">Annonce liée : <a href={logement.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">voir le lien d’origine</a></p>}
      <Message texte={erreur} />
      <div onDragOver={(e) => { e.preventDefault(); setGlisse(true); }} onDragLeave={() => setGlisse(false)}
           onDrop={(e) => { e.preventDefault(); setGlisse(false); deposer(e.dataTransfer.files); }}
           className={`rounded-3xl border-2 border-dashed transition p-8 text-center ${glisse ? "border-accent bg-accent/5" : "border-line"}`}>
        <Upload className="size-6 mx-auto text-fg-muted" />
        <p className="mt-2 text-sm text-fg-muted">Glissez vos photos ici, ou <button className="text-accent underline-offset-2 hover:underline" onClick={() => champ.current?.click()}>choisissez-les</button>. Toutes les pièces, même en désordre : c&apos;est le travail de l&apos;IA.</p>
        {envoi && <p className="mt-3 text-sm text-accent">Envoi {envoi.fait} / {envoi.total}…</p>}
      </div>
      {logement && logement.photos.length > 0 && (
        <>
        <div className="batch-property-bar"><div><strong>{selection.length} photo{selection.length > 1 ? "s" : ""} choisie{selection.length > 1 ? "s" : ""}</strong><p>Si vous gardez toutes ces retouches en HD : {cout} crédit{cout > 1 ? "s" : ""}. Chaque photo se décide séparément.</p></div><button className="button dark" disabled={!selection.length} onClick={commencerSelection}>Retoucher ma sélection →</button></div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {logement.photos.map((p, i) => (
            <li key={p.id}>
              <button type="button" aria-pressed={selection.includes(p.id)} aria-label={`Sélectionner la photo ${i + 1}`} onClick={() => basculer(p.id)} className={`batch-property-photo block relative rounded-2xl overflow-hidden bg-surface-2 border group aspect-[3/4] w-full ${selection.includes(p.id) ? "batch-property-selected" : "border-line"}`}>
                <img src={p.vignette} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
                <span className="batch-property-check">{selection.includes(p.id) ? "✓" : ""}</span>
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2 text-xs">
                  <span>Photo {i + 1}</span>
                  {p.gardee ? <span className="ml-auto inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-3.5" /> gardée</span>
                    : p.essais > 0 ? <span className="ml-auto text-fg-muted">{p.essais} essai{p.essais > 1 ? "s" : ""}</span> : <span className="ml-auto text-accent">à retoucher</span>}
                </div>
              </button>
              <Link href={`/app/photo?id=${p.id}`} className="batch-property-open">Ouvrir cette photo →</Link>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><PageLogement /></Suspense>;
}

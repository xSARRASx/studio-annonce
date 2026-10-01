"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Images, Link2 } from "lucide-react";
import { api, type Logement, type Photo } from "@/lib/api";
import { useStudioAccount } from "@/components/studio-account";
import "./importer.css";

type Choix = { file: File; preview: string; selected: boolean };

function lienValide(value: string) {
  if (!value.trim()) return true;
  try { const url = new URL(value.trim()); return url.protocol === "https:" && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}

export default function ImporterAnnonce() {
  const router = useRouter();
  const { compte } = useStudioAccount();
  const [nom, setNom] = useState("");
  const [lien, setLien] = useState("");
  const [photos, setPhotos] = useState<Choix[]>([]);
  const [envoi, setEnvoi] = useState({ fait: 0, total: 0 });
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const [logementCree, setLogementCree] = useState<Logement | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);
  const imported = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach(URL.revokeObjectURL), []);

  const retenues = useMemo(() => photos.filter(photo => photo.selected), [photos]);
  const credits = Math.max(0, retenues.length - (compte.photo_offerte_disponible ? 1 : 0));

  function ajouter(files: FileList | null) {
    if (!files || occupe) return;
    const images = Array.from(files).filter(file => file.type.startsWith("image/") && file.size <= 30 * 1024 * 1024);
    if (!images.length) { setErreur("Choisissez des photos JPG, PNG ou WebP de moins de 30 Mo."); return; }
    setErreur("");
    setPhotos(previous => [...previous, ...images.slice(0, Math.max(0, 40 - previous.length)).map(file => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { file, preview, selected: true };
    })]);
    if (champ.current) champ.current.value = "";
  }

  async function importer() {
    if (occupe || !retenues.length || !lienValide(lien)) return;
    setOccupe(true); setErreur(""); setEnvoi({ fait: 0, total: retenues.length });
    let home = logementCree;
    try {
      if (!home) {
        home = await api<Logement>("/logements", { method: "POST", body: JSON.stringify({ nom: nom.trim() || "Mon logement", source_url: lien.trim() }) });
        setLogementCree(home);
      }
      for (let i = 0; i < retenues.length; i++) {
        const form = new FormData(); form.append("fichier", retenues[i].file);
        const photo = await api<Photo>(`/photos/${home.id}`, { method: "POST", body: form });
        imported.current.push(photo.id);
        setEnvoi({ fait: i + 1, total: retenues.length });
        setPhotos(previous => previous.filter(choice => choice !== retenues[i]));
      }
      window.dispatchEvent(new Event("studio:credits-updated"));
      const ids = imported.current;
      router.push(`/app/photo/?id=${ids[0]}&lot=${encodeURIComponent(ids.join(","))}`);
    } catch (cause) {
      setErreur(`${(cause as Error).message} ${home ? "Les photos déjà ajoutées restent dans le logement. Vous pouvez réessayer pour les autres." : ""}`);
      setOccupe(false);
    }
  }

  return <main className="batch-page">
    <button className="batch-back" onClick={() => router.push("/app/#nouvelle")}><ArrowLeft size={16}/> Retour à la création</button>
    <div className="batch-heading"><span className="eyebrow">VOTRE ANNONCE</span><h1>Choisissez les photos à améliorer.</h1><p>Ajoutez les photos de votre logement ensemble, puis ne travaillez que celles qui vous intéressent.</p></div>
    <div className="batch-card">
      <label className="batch-label">Nom du logement<input value={nom} onChange={event => setNom(event.target.value)} maxLength={120} placeholder="Ex. : Appartement du centre" disabled={occupe}/></label>
      <label className="batch-label"><span><Link2 size={16}/> Lien de votre annonce <small>facultatif</small></span><input type="url" inputMode="url" value={lien} onChange={event => setLien(event.target.value)} maxLength={1000} placeholder="https://www.airbnb.fr/rooms/…" disabled={occupe || !!logementCree}/></label>
      {!lienValide(lien) && <p className="batch-error" role="alert">Collez un lien HTTPS valide.</p>}
      <p className="batch-note">Le lien reste enregistré avec votre logement. L’import automatique depuis une annonce n’est pas encore disponible : ajoutez vos photos depuis votre appareil.</p>
      <button className="batch-picker" type="button" onClick={() => champ.current?.click()} disabled={occupe || photos.length >= 40}><Images size={22}/><span>Choisir plusieurs photos</span><small>Jusqu’à 40 photos · aucun crédit débité à l’ajout</small></button>
      <input ref={champ} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => ajouter(event.target.files)}/>
    </div>
    {photos.length > 0 && <section className="batch-card" aria-label="Photos à importer"><div className="batch-section-head"><h2>Vos photos</h2><button type="button" onClick={() => setPhotos(photos.map(photo => ({ ...photo, selected: photos.some(p => !p.selected) })))} disabled={occupe}>{photos.some(p => !p.selected) ? "Tout sélectionner" : "Tout désélectionner"}</button></div><div className="batch-grid">{photos.map((photo, index) => <button type="button" key={photo.preview} className={`batch-photo ${photo.selected ? "selected" : ""}`} aria-pressed={photo.selected} aria-label={`Photo ${index + 1}, ${photo.selected ? "sélectionnée" : "non sélectionnée"}`} disabled={occupe} onClick={() => setPhotos(previous => previous.map(p => p.preview === photo.preview ? { ...p, selected: !p.selected } : p))}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.preview} alt=""/><span className="batch-check">{photo.selected && <Check size={16}/>}</span><small>Photo {index + 1}</small>
    </button>)}</div></section>}
    <div className="batch-summary" role="status"><div><strong>{retenues.length} photo{retenues.length > 1 ? "s" : ""} sélectionnée{retenues.length > 1 ? "s" : ""}</strong><p>Si vous gardez toutes leurs retouches en HD : {credits} crédit{credits > 1 ? "s" : ""}{compte.photo_offerte_disponible && retenues.length ? " après votre photo offerte" : ""}. Vous déciderez photo par photo.</p></div><button type="button" className="button dark" disabled={occupe || !retenues.length || !lienValide(lien)} onClick={() => void importer()}>{occupe ? `Ajout ${envoi.fait}/${envoi.total}…` : "Ajouter mes photos"}<ArrowRight size={17}/></button></div>
    {erreur && <p className="batch-error" role="alert">{erreur}{logementCree && <button onClick={() => router.push(`/app/logement/?id=${logementCree.id}`)}>Voir les photos déjà ajoutées</button>}</p>}
  </main>;
}

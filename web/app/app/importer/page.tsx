"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Images, Link2 } from "lucide-react";
import { api, type Logement } from "@/lib/api";
import { envoyerPhoto } from "@/lib/photo-upload";
import { useStudioAccount } from "@/components/studio-account";
import "./importer.css";

type Choix = { file: File; preview: string; selected: boolean };

function lienValide(value: string) {
  if (!value.trim()) return true;
  try { const url = new URL(value.trim()); return url.protocol === "https:" && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}

function plateforme(value: string): "Airbnb" | "Booking.com" | null {
  try {
    const host = new URL(value.trim()).hostname.toLowerCase();
    if (host === "airbnb.com" || host.endsWith(".airbnb.com") || /^(?:www\.)?airbnb\.(?:fr|de|es|it|be|nl|pt|ie|ca|co\.uk|com\.au)$/.test(host)) return "Airbnb";
    if (host === "booking.com" || host.endsWith(".booking.com")) return "Booking.com";
  } catch {}
  return null;
}

export default function ImporterAnnonce() {
  const router = useRouter();
  const { compte } = useStudioAccount();
  const [nom, setNom] = useState("");
  const [lien, setLien] = useState("");
  const [photos, setPhotos] = useState<Choix[]>([]);
  const [envoi, setEnvoi] = useState({ fait: 0, total: 0 });
  const [occupe, setOccupe] = useState(false);
  const [glisse, setGlisse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [logementCree, setLogementCree] = useState<Logement | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);
  const imported = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach(URL.revokeObjectURL), []);

  const retenues = useMemo(() => photos.filter(photo => photo.selected), [photos]);
  const credits = Math.max(0, retenues.length - (compte.photo_offerte_disponible ? 1 : 0));

  function ajouter(files: FileList | File[] | null) {
    if (!files || occupe) return;
    const images = Array.from(files).filter(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 30 * 1024 * 1024);
    if (!images.length) { setErreur("Choisissez des photos JPG, PNG ou WebP de moins de 30 Mo."); return; }
    if (photos.length + images.length > 40) { setErreur("Vous pouvez ajouter 40 photos à la fois. Choisissez-en moins, puis ajoutez les autres depuis votre logement."); return; }
    setErreur("");
    setPhotos(previous => [...previous, ...images.map(file => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { file, preview, selected: true };
    })]);
    if (champ.current) champ.current.value = "";
  }


  async function enregistrerLien() {
    if (occupe || !lien.trim() || !lienValide(lien)) return;
    setOccupe(true); setErreur("");
    try {
      const home = await api<Logement>("/logements", { method: "POST", body: JSON.stringify({ nom: nom.trim() || "Mon logement", source_url: lien.trim() }) });
      router.push(`/app/logement/?id=${home.id}${new URLSearchParams(window.location.search).get("suite") === "video" ? "&suite=video" : ""}`);
    } catch (cause) { setErreur((cause as Error).message); setOccupe(false); }
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
        const photo = await envoyerPhoto(retenues[i].file, home.id);
        imported.current.push(photo.id);
        setEnvoi({ fait: i + 1, total: retenues.length });
        setPhotos(previous => previous.filter(choice => choice !== retenues[i]));
      }
      window.dispatchEvent(new Event("studio:credits-updated"));
      const ids = imported.current;
      if (new URLSearchParams(window.location.search).get("suite") === "video") {
        const key = `studio:${compte.id}:video-plan`;
        try {
          const current = JSON.parse(localStorage.getItem(key) || "{}");
          localStorage.setItem(key, JSON.stringify({ ...current, selectedIds: [...new Set([...(Array.isArray(current.selectedIds) ? current.selectedIds : []), ...ids])] }));
        } catch { /* Les photos restent dans le compte si le stockage local est refusé. */ }
        router.push("/app/#visite");
      } else router.push(`/app/photo/?id=${ids[0]}&lot=${encodeURIComponent(ids.join(","))}`);
    } catch (cause) {
      setErreur(`${(cause as Error).message} ${home ? "Les photos déjà ajoutées restent dans le logement. Vous pouvez réessayer pour les autres." : ""}`);
      setOccupe(false);
    }
  }

  return <main className="batch-page">
    <button className="batch-back" onClick={() => router.push("/app/#nouvelle")}><ArrowLeft size={16}/> Retour à la création</button>
    <div className="batch-heading"><span className="eyebrow">VOTRE ANNONCE</span><h1>Rassemblez les photos de votre logement.</h1><p>Collez le lien de votre annonce pour la retrouver, puis ajoutez les photos que vous souhaitez améliorer.</p></div>
    <div className="batch-card">
      <label className="batch-label">Nom du logement<input value={nom} onChange={event => setNom(event.target.value)} maxLength={120} placeholder="Ex. : Appartement du centre" disabled={occupe}/></label>
      <label className="batch-label"><span><Link2 size={16}/> Lien Airbnb ou Booking <small>facultatif</small></span><input type="url" inputMode="url" value={lien} onChange={event => setLien(event.target.value)} maxLength={1000} placeholder="https://www.airbnb.fr/rooms/… ou https://www.booking.com/hotel/…" disabled={occupe || !!logementCree}/></label>
      {!lienValide(lien) && <p className="batch-error" role="alert">Collez un lien HTTPS valide.</p>}
      {lien.trim() && lienValide(lien) && <div className="batch-source" role="status"><strong>{plateforme(lien) ? `Annonce ${plateforme(lien)} reconnue` : "Lien d’annonce reconnu"}</strong><p>Ce lien sera conservé avec votre logement. Pour l’instant, les photos ne peuvent pas être récupérées automatiquement depuis cette page : choisissez les originaux que vous possédez, ou glissez-les ici.</p></div>}
      {!lien.trim() && <p className="batch-note">Vous pouvez aussi commencer directement avec les photos de votre appareil.</p>}
      <div className={`batch-picker ${glisse ? "batch-picker-drag" : ""}`} role="group" aria-label="Ajouter les photos de l’annonce" tabIndex={0}
        onDragOver={event => { event.preventDefault(); if (!occupe) setGlisse(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setGlisse(false); }}
        onDrop={event => { event.preventDefault(); setGlisse(false); ajouter(event.dataTransfer.files); }}
        onPaste={event => { const images = Array.from(event.clipboardData.files).filter(file => file.type.startsWith("image/")); if (images.length) { event.preventDefault(); ajouter(images); } }}>
        <Images size={22}/><strong>Vos photos de l’annonce</strong><span>Glissez-les ici, ou collez une image copiée (⌘V / Ctrl+V).</span>
        <button type="button" onClick={() => champ.current?.click()} disabled={occupe || photos.length >= 40}>Choisir plusieurs photos</button>
        <small>Jusqu’à 40 photos · aucun crédit débité à l’ajout</small>
      </div>
      <input ref={champ} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => ajouter(event.target.files)}/>
      {!!lien.trim() && lienValide(lien) && photos.length === 0 && <button type="button" className="batch-save-link" onClick={() => void enregistrerLien()} disabled={occupe}>Enregistrer l’annonce et ajouter les photos plus tard <ArrowRight size={16}/></button>}
    </div>
    {photos.length > 0 && <section className="batch-card" aria-label="Photos à importer"><div className="batch-section-head"><h2>Vos photos</h2><button type="button" onClick={() => setPhotos(photos.map(photo => ({ ...photo, selected: photos.some(p => !p.selected) })))} disabled={occupe}>{photos.some(p => !p.selected) ? "Tout sélectionner" : "Tout désélectionner"}</button></div><div className="batch-grid">{photos.map((photo, index) => <button type="button" key={photo.preview} className={`batch-photo ${photo.selected ? "selected" : ""}`} aria-pressed={photo.selected} aria-label={`Photo ${index + 1}, ${photo.selected ? "sélectionnée" : "non sélectionnée"}`} disabled={occupe} onClick={() => setPhotos(previous => previous.map(p => p.preview === photo.preview ? { ...p, selected: !p.selected } : p))}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.preview} alt=""/><span className="batch-check">{photo.selected && <Check size={16}/>}</span><small>Photo {index + 1}</small>
    </button>)}</div></section>}
    <div className="batch-summary" role="status"><div><strong>{retenues.length} photo{retenues.length > 1 ? "s" : ""} sélectionnée{retenues.length > 1 ? "s" : ""}</strong><p>Si vous gardez toutes leurs retouches en HD : {credits} crédit{credits > 1 ? "s" : ""}{compte.photo_offerte_disponible && retenues.length ? " après votre photo offerte" : ""}. Vous déciderez photo par photo.</p></div><button type="button" className="button dark" disabled={occupe || !retenues.length || !lienValide(lien)} onClick={() => void importer()}>{occupe ? `Ajout ${envoi.fait}/${envoi.total}…` : "Ajouter mes photos"}<ArrowRight size={17}/></button></div>
    {erreur && <p className="batch-error" role="alert">{erreur}{logementCree && <button onClick={() => router.push(`/app/logement/?id=${logementCree.id}`)}>Voir les photos déjà ajoutées</button>}</p>}
  </main>;
}

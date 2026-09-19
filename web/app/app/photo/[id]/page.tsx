"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Send, Sparkles, RotateCcw, Eye } from "lucide-react";
import { api, ErreurApi, type Photo, type Version } from "@/lib/api";
import { Bouton, Message, Pastille } from "@/components/ui";

type Bulle = { de: "ia" | "moi"; texte: string };

export default function Atelier(props: PageProps<"/app/photo/[id]">) {
  const [id, setId] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [courante, setCourante] = useState<Version | null>(null);
  const [voirAvant, setVoirAvant] = useState(false);
  const [demande, setDemande] = useState("");
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [occupe, setOccupe] = useState<"analyse" | "essai" | "hd" | null>(null);
  const [erreur, setErreur] = useState("");
  const bas = useRef<HTMLDivElement>(null);

  useEffect(() => { props.params.then((p) => setId(p.id)); }, [props.params]);
  useEffect(() => {
    if (!id) return;
    api<Photo>(`/photos/${id}`).then(async (p) => {
      if (!p.analyse) { setOccupe("analyse"); p = await api<Photo>(`/photos/${id}/analyser`, { method: "POST" }); setOccupe(null); }
      poser(p, p.versions.at(-1) || null);
      const a = p.analyse!;
      setBulles([{ de: "ia", texte: `${a.piece}. Ce que je vois à corriger : ${a.defauts.join(", ")}.` },
                 { de: "ia", texte: p.versions.length ? "Continuez : dites-moi ce que vous voulez changer." : "Je vous fais la version annonce ? Lumière pro, désordre retiré, rien d'autre ne bouge." + (a.question ? ` Et une question : ${a.question}` : "") }]);
    }).catch((e) => setErreur(e.message));
  }, [id]);
  useEffect(() => { bas.current?.scrollIntoView({ behavior: "smooth" }); }, [bulles, occupe]);

  function poser(p: Photo, v: Version | null) { setPhoto(p); setCourante(v); setVoirAvant(false); }

  async function essai(texte: string) {
    if (!photo) return;
    setErreur(""); setOccupe("essai");
    if (texte) setBulles((b) => [...b, { de: "moi", texte }]);
    try {
      const p = await api<Photo>(`/photos/${photo.id}/essai`, { method: "POST", body: JSON.stringify({ demande: texte, depuis_version_id: courante?.id || null }) });
      poser(p, p.versions.at(-1) || null);
      setDemande("");
      const restants = p.essais_restants;
      setBulles((b) => [...b, { de: "ia", texte: (texte ? "Voilà. " : "Voilà la version annonce. ") + (p.alerte ? `Il vous reste ${restants} essai${restants > 1 ? "s" : ""} sur cette photo.` : "Ça vous plaît ? Sinon dites-moi quoi changer.") }]);
    } catch (e) {
      const err = e as ErreurApi; setErreur(err.message);
      if (err.statut === 402) setBulles((b) => [...b, { de: "ia", texte: err.message }]);
    } finally { setOccupe(null); }
  }

  async function telecharger() {
    if (!photo || !courante) return;
    setErreur(""); setOccupe("hd");
    try {
      const blob = await api<Blob>(`/photos/${photo.id}/versions/${courante.id}/telecharger`, { method: "POST" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `photo-${photo.ordre + 1}.jpg`; a.click(); URL.revokeObjectURL(url);
      const p = await api<Photo>(`/photos/${photo.id}`); poser(p, p.versions.find((v) => v.id === courante.id) || courante);
      setBulles((b) => [...b, { de: "ia", texte: photo.offerte && !photo.credite_le ? "C'était votre photo offerte : téléchargée en HD, gratuitement." : "Téléchargée en HD. Vous pouvez encore la modifier pendant 7 jours sans nouveau crédit." }]);
    } catch (e) { setErreur((e as ErreurApi).message); } finally { setOccupe(null); }
  }

  const original = photo?.vignette.replace("vignette.webp", "original.jpg");
  const image = voirAvant || !courante ? original : courante.apercu;

  return (
    <div className="apparait grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-3">
        <Link href={photo ? `/app/logement/${photo.logement_id}` : "/app"} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Retour au logement</Link>
        <div className="relative rounded-3xl overflow-hidden bg-surface border border-line">
          {image ? <img src={image} alt="" className="w-full max-h-[78vh] object-contain bg-black" /> : <div className="aspect-[3/4] grid place-items-center text-fg-muted">Chargement…</div>}
          {occupe === "essai" && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm grid place-items-center text-sm"><span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 border border-line"><Sparkles className="size-4 text-accent animate-pulse" /> Retouche en cours, une dizaine de secondes…</span></div>}
          {courante && <button onMouseDown={() => setVoirAvant(true)} onMouseUp={() => setVoirAvant(false)} onMouseLeave={() => setVoirAvant(false)} onTouchStart={() => setVoirAvant(true)} onTouchEnd={() => setVoirAvant(false)}
            className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 h-9 text-xs border border-white/10 select-none"><Eye className="size-3.5" /> {voirAvant ? "Avant" : "Maintenir pour voir l'avant"}</button>}
          {courante && !voirAvant && <span className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur px-3 h-9 inline-flex items-center text-xs border border-white/10">Aperçu filigrané · la HD est nette</span>}
        </div>
        {photo && photo.versions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCourante(null)} className={`shrink-0 rounded-xl overflow-hidden border-2 ${!courante ? "border-accent" : "border-transparent"}`}><img src={original} alt="Original" className="h-16 w-12 object-cover" /></button>
            {photo.versions.map((v) => (
              <button key={v.id} onClick={() => setCourante(v)} title={v.consigne} className={`shrink-0 relative rounded-xl overflow-hidden border-2 ${courante?.id === v.id ? "border-accent" : "border-transparent"}`}>
                <img src={v.apercu} alt={`Essai ${v.numero}`} className="h-16 w-12 object-cover" />
                <span className="absolute bottom-0 inset-x-0 text-[10px] bg-black/60 text-center">{v.numero}</span>
              </button>))}
          </div>
        )}
      </div>

      <aside className="rounded-3xl bg-surface border border-line flex flex-col h-[78vh] lg:sticky lg:top-20">
        <div className="p-4 border-b border-line flex items-center gap-2 flex-wrap">
          <span className="font-medium">{photo?.analyse?.piece || "Analyse…"}</span>
          {photo && <Pastille ton={photo.alerte ? "alerte" : "neutre"}>{photo.essais_restants} essai{photo.essais_restants > 1 ? "s" : ""} restant{photo.essais_restants > 1 ? "s" : ""}</Pastille>}
          {photo?.offerte && !photo.credite_le && <Pastille ton="accent">photo offerte</Pastille>}
          {photo?.credite_le && <Pastille ton="ok">gardée</Pastille>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          {bulles.map((b, i) => (
            <div key={i} className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${b.de === "ia" ? "bg-surface-2" : "bg-accent text-accent-fg ml-auto"}`}>{b.texte}</div>))}
          {occupe === "analyse" && <div className="max-w-[90%] rounded-2xl px-4 py-2.5 bg-surface-2 text-fg-muted">Je regarde la photo…</div>}
          <Message texte={erreur} />
          <div ref={bas} />
        </div>
        <div className="p-3 border-t border-line space-y-2">
          {photo && photo.versions.length === 0 && !occupe && (
            <Bouton className="w-full" onClick={() => essai("")}><Sparkles className="size-4" /> Oui, fais la version annonce</Bouton>)}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (demande.trim()) essai(demande.trim()); }}>
            <input value={demande} onChange={(e) => setDemande(e.target.value)} placeholder="Enlève le vélo, meuble la chambre, mur en beige…" disabled={!!occupe}
                   className="flex-1 h-11 rounded-full bg-surface-2 border border-line px-4 text-sm outline-none focus:border-accent" />
            <button type="submit" disabled={!!occupe || !demande.trim()} className="size-11 rounded-full bg-accent text-accent-fg grid place-items-center disabled:opacity-40"><Send className="size-4" /></button>
          </form>
          <div className="flex gap-2">
            <Bouton variante="secondaire" className="flex-1" onClick={() => setCourante(null)} disabled={!courante}><RotateCcw className="size-4" /> Repartir de l&apos;original</Bouton>
            <Bouton className="flex-1" onClick={telecharger} disabled={!courante} chargement={occupe === "hd"}><Download className="size-4" /> {photo?.credite_le || photo?.offerte ? "Télécharger en HD" : "Garder · 1 crédit"}</Bouton>
          </div>
        </div>
      </aside>
    </div>
  );
}

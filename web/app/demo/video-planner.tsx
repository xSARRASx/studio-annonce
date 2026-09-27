"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Film, Images, Info, Sparkles } from "lucide-react";
import { BriefAssistant } from "./brief-assistant";
import { type DemoLibrary, type DemoProject, type DemoVersion } from "./library";
import "./video-planner.css";

const STORAGE_KEY = "studio-annonce.video-plan.v1";
type Source = (project: DemoProject, version?: DemoVersion) => string;

export function VideoPlanner({ library, source, onPhoto }: { library: DemoLibrary; source: Source; onPhoto: () => void }) {
  const [property, setProperty] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState("");
  const [restored, setRestored] = useState(false);
  const photos = library.projects.filter(project => project.kind === "photo" && !project.sample);
  const properties = [...new Set(photos.map(project => project.property))];
  const currentProperty = properties.includes(property) ? property : properties[0] || "";
  const available = photos.filter(project => project.property === currentProperty);
  const selected = available.filter(project => selectedIds.includes(project.id)).sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && typeof saved === "object") {
          if (typeof saved.property === "string") setProperty(saved.property.slice(0, 500));
          if (typeof saved.idea === "string") setIdea(saved.idea.slice(0, 4000));
          if (typeof saved.brief === "string") setBrief(saved.brief.slice(0, 5000));
          if (Array.isArray(saved.selectedIds)) setSelectedIds(saved.selectedIds.filter((value: unknown): value is string => typeof value === "string").slice(0, 20));
        }
      } catch { /* Le brouillon reste utilisable si le stockage est indisponible. */ }
      setRestored(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ property: currentProperty, selectedIds, idea, brief })); }
    catch { /* Aucun appel distant ni perte du texte affiché. */ }
  }, [restored, currentProperty, selectedIds, idea, brief]);

  function toggle(id: string) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }
  const context = selected.length
    ? `${idea.trim() || "Présenter le logement dans une visite vidéo"} Photos sources choisies, dans cet ordre : ${selected.map(project => project.title).join(" ; ")}. Logement : ${currentProperty}.`
    : idea;

  return <main className="st-main st-video-plan">
    <p className="eyebrow">VISITE VIDÉO · APERÇU</p>
    <h1>Racontez votre logement en images.</h1>
    <p className="st-video-intro">Décrivez la visite en quelques mots. L’assistant vous pose quatre questions et prépare un brief vidéo à relire.</p>

    <section className="st-step" aria-labelledby="video-source-title">
      <h2 id="video-source-title"><span className="st-step-number">1</span> Les photos du logement</h2>
      {properties.length ? <>
        <label className="st-video-property">Logement<select value={currentProperty} onChange={event => { setProperty(event.target.value); setSelectedIds([]); }}>{properties.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <div className="st-video-photos" aria-label="Photos à inclure dans la visite">{available.map(project => <button type="button" key={project.id} aria-pressed={selectedIds.includes(project.id)} onClick={() => toggle(project.id)}><span className="st-video-thumb"><Image src={source(project)} alt="" fill sizes="120px" unoptimized/></span><span>{project.title}</span>{selectedIds.includes(project.id) && <CheckCircle2 size={19}/>}</button>)}</div>
        <p className="st-video-hint">{selected.length ? `${selected.length} photo${selected.length > 1 ? "s" : ""} choisie${selected.length > 1 ? "s" : ""}.` : "Choisissez les photos qui doivent guider la visite."} Vous pourrez ajuster l’ordre des plans au moment du montage.</p>
      </> : <div className="st-video-empty"><Images size={23}/><p>Ajoutez d’abord une photo de votre logement pour préparer les plans. Vous pouvez déjà essayer l’assistant ci-dessous.</p><button type="button" className="text-action" onClick={onPhoto}>Ajouter une photo <ArrowRight size={15}/></button></div>}
    </section>

    <section className="st-step" aria-labelledby="video-idea-title">
      <h2 id="video-idea-title"><span className="st-step-number">2</span> Votre idée</h2>
      <label className="st-video-label" htmlFor="video-idea">Décrivez le trajet ou l’ambiance que vous imaginez</label>
      <textarea id="video-idea" value={idea} maxLength={4000} rows={5} onChange={event => setIdea(event.target.value)} placeholder="Ex. : une caméra flotte du salon vers la cuisine, s’attarde sur la lumière et termine sur la chambre…"/>
      <BriefAssistant kind="video" request={context} onUse={setBrief}/>
    </section>

    {brief && <section className="st-step" aria-labelledby="video-brief-title"><h2 id="video-brief-title"><span className="st-step-number">3</span> Votre brief vidéo</h2><p className="st-video-label">Relisez et ajustez ce texte avant toute génération future.</p><textarea aria-label="Brief vidéo modifiable" value={brief} maxLength={5000} rows={10} onChange={event => setBrief(event.target.value)}/></section>}

    <section className="st-video-next" aria-label="Suite de la création vidéo"><div className="st-video-next-icon"><Film size={22}/></div><div><h2>Votre brief reste modifiable.</h2><p>La génération Higgsfield et l’estimation du coût seront proposées ici lorsque le moteur sera connecté. Une visite longue devra être testée en plusieurs plans puis assemblée ; la continuité de la caméra ne peut pas être garantie à partir de photos seules.</p></div><span><Sparkles size={15}/> Démonstration</span></section>
    <p className="st-video-local"><Info size={15}/> Votre brouillon reste dans ce navigateur si son stockage est disponible. Aucune photo ni demande n’est envoyée à Higgsfield depuis cet aperçu.</p>
  </main>;
}

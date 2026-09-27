"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Film, Images, Info, Search, Sparkles, X } from "lucide-react";
import { BriefAssistant } from "./brief-assistant";
import { type DemoLibrary, type DemoProject, type DemoVersion } from "./library";
import "./video-planner.css";

const STORAGE_KEY = "studio-annonce.video-plan.v1";
type Source = (project: DemoProject, version?: DemoVersion) => string;
const searchText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");

export function VideoPlanner({ library, source, onPhoto }: { library: DemoLibrary; source: Source; onPhoto: () => void }) {
  const [property, setProperty] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState("");
  const [briefIdea, setBriefIdea] = useState<string | null>(null);
  const [briefContext, setBriefContext] = useState<string | null>(null);
  const [photoSearch, setPhotoSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [restored, setRestored] = useState(false);
  const photos = library.projects.filter(project => project.kind === "photo" && !project.sample);
  const properties = [...new Set(photos.map(project => project.property))];
  const currentProperty = properties.includes(property) ? property : properties[0] || "";
  const available = photos.filter(project => project.property === currentProperty);
  const selected = available.filter(project => selectedIds.includes(project.id)).sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
  const search = searchText(photoSearch.trim());
  const visiblePhotos = available.filter(project => (!selectedOnly || selectedIds.includes(project.id)) && (!search || searchText(project.title).includes(search)));

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && typeof saved === "object") {
          if (typeof saved.property === "string") setProperty(saved.property.slice(0, 500));
          if (typeof saved.idea === "string") setIdea(saved.idea.slice(0, 4000));
          if (typeof saved.brief === "string") setBrief(saved.brief);
          if (typeof saved.briefIdea === "string") setBriefIdea(saved.briefIdea);
          if (typeof saved.briefContext === "string") setBriefContext(saved.briefContext);
          if (Array.isArray(saved.selectedIds)) setSelectedIds([...new Set((saved.selectedIds as unknown[]).filter((value: unknown): value is string => typeof value === "string"))]);
        }
      } catch { /* Le brouillon reste utilisable si le stockage est indisponible. */ }
      setRestored(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ property: currentProperty, selectedIds, idea, brief, briefIdea, briefContext })); }
    catch { /* Aucun appel distant ni perte du texte affiché. */ }
  }, [restored, currentProperty, selectedIds, idea, brief, briefIdea, briefContext]);

  function toggle(id: string) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }
  const context = selected.length
    ? `Photos sources choisies, dans cet ordre : ${selected.map(project => project.title).join(" ; ")}. Logement : ${currentProperty}.`
    : "Aucune photo source choisie. La vidéo est à imaginer à partir de la demande.";

  return <main className="st-main st-video-plan">
    <p className="eyebrow">VISITE VIDÉO · APERÇU</p>
    <h1>Racontez votre logement en images.</h1>
    <p className="st-video-intro">Partez d’une idée, avec ou sans photos. L’assistant vous aide à choisir les bases de la vidéo, puis à préciser ce qui compte pour votre demande.</p>

    <section className="st-step" aria-labelledby="video-source-title">
      <h2 id="video-source-title"><span className="st-step-number">1</span> Les photos du logement <span className="st-video-optional">Facultatif</span></h2>
      {properties.length ? <>
        <label className="st-video-property">Logement<select value={currentProperty} onChange={event => { setProperty(event.target.value); setSelectedIds([]); }}>{properties.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <div className="st-video-photo-tools">
          <div className="st-video-search">
            <label htmlFor="video-photo-search">Retrouver une photo</label>
            <div><Search size={17} aria-hidden="true"/><input id="video-photo-search" type="search" value={photoSearch} onChange={event => setPhotoSearch(event.target.value)} placeholder="Salon, cuisine, terrasse…"/>{photoSearch && <button type="button" aria-label="Effacer la recherche de photos" onClick={() => setPhotoSearch("")}><X size={15}/></button>}</div>
          </div>
          <button type="button" className="st-video-selected-filter" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(value => !value)}><CheckCircle2 size={16}/>Sélection uniquement <span>{selected.length}</span></button>
        </div>
        <p className="st-video-photo-count" role="status">{selected.length} photo{selected.length > 1 ? "s" : ""} choisie{selected.length > 1 ? "s" : ""} sur {available.length}<span>{visiblePhotos.length} affichée{visiblePhotos.length > 1 ? "s" : ""}</span></p>
        {visiblePhotos.length ? <div className="st-video-photos" aria-label="Photos à inclure dans la visite">{visiblePhotos.map(project => <button type="button" key={project.id} aria-pressed={selectedIds.includes(project.id)} onClick={() => toggle(project.id)}><span className="st-video-thumb"><Image src={source(project)} alt="" fill sizes="120px" unoptimized/></span><span>{project.title}</span>{selectedIds.includes(project.id) && <span className="st-video-selection-order" aria-label={`Position ${selected.findIndex(item => item.id === project.id) + 1}`}>{selected.findIndex(item => item.id === project.id) + 1}</span>}</button>)}</div> : <div className="st-video-no-results"><Search size={22}/><p>{photoSearch.trim() ? "Aucune photo ne correspond à votre recherche." : "Aucune photo sélectionnée pour le moment."}</p><button type="button" className="text-action" onClick={() => { setPhotoSearch(""); setSelectedOnly(false); }}>Afficher toutes les photos</button></div>}
        <p className="st-video-hint">Les numéros suivent votre ordre de sélection. La recherche conserve tous vos choix. Vous pouvez aussi continuer sans photo.</p>
      </> : <div className="st-video-empty"><Images size={23}/><p>Une idée suffit pour préparer votre vidéo. Vous pouvez aussi ajouter des photos pour guider le résultat.</p><button type="button" className="text-action" onClick={onPhoto}>Ajouter une photo <ArrowRight size={15}/></button></div>}
    </section>

    <section className="st-step" aria-labelledby="video-idea-title">
      <h2 id="video-idea-title"><span className="st-step-number">2</span> Votre idée</h2>
      <label className="st-video-label" htmlFor="video-idea">Décrivez le trajet ou l’ambiance que vous imaginez</label>
      <textarea id="video-idea" value={idea} maxLength={4000} rows={5} onChange={event => setIdea(event.target.value)} placeholder="Ex. : une caméra flotte du salon vers la cuisine, s’attarde sur la lumière et termine sur la chambre…"/>
      <BriefAssistant kind="video" request={idea} context={context} onUse={value => { setBrief(value); setBriefIdea(idea); setBriefContext(context); }}/>
    </section>

    {brief && <section className="st-step" aria-labelledby="video-brief-title"><h2 id="video-brief-title"><span className="st-step-number">3</span> Votre brief vidéo</h2><p className="st-video-label">Votre idée et vos réponses sont réunies. Vous pouvez relire le texte complet et le modifier.</p>{(briefIdea !== idea || briefContext !== context) && <p className="st-video-changed" role="status">{briefIdea === null || briefContext === null ? "Ce brief est ancien. Vérifiez qu’il correspond encore à votre idée et aux photos choisies." : "L’idée ou les photos ont changé depuis ce brief. Reprenez l’assistant pour l’actualiser, ou ajustez le texte ci-dessous."}</p>}<details className="st-video-brief-details"><summary><span><CheckCircle2 size={19}/>Voir et modifier le brief complet</span><ChevronDown size={18}/></summary><textarea aria-label="Brief vidéo modifiable" value={brief} rows={10} onChange={event => setBrief(event.target.value)}/></details></section>}

    <section className="st-video-next" aria-label="Suite de la création vidéo"><div className="st-video-next-icon"><Film size={22}/></div><div><h2>Votre brief reste modifiable.</h2><p>La génération Higgsfield et l’estimation du coût seront proposées ici lorsque le moteur sera connecté. Une visite longue devra être testée en plusieurs plans puis assemblée ; la continuité de la caméra ne peut pas être garantie à partir de photos seules.</p></div><span><Sparkles size={15}/> Démonstration</span></section>
    <p className="st-video-local"><Info size={15}/> Votre brouillon reste dans ce navigateur si son stockage est disponible. Aucune photo ni demande n’est envoyée à Higgsfield depuis cet aperçu.</p>
  </main>;
}

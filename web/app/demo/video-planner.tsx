"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Film, Images, Info, Search, Sparkles, Upload, X } from "lucide-react";
import { BriefAssistant } from "./brief-assistant";
import { videoVisitContext } from "../../../shared/video-visit";
import { storageError, type DemoLibrary, type DemoProject, type DemoVersion } from "./library";
import { CreationBack } from "./creation-hub";
import { UNASSIGNED_PROPERTY } from "./studio-screens";
import "./video-planner.css";

const STORAGE_KEY = "studio-annonce.video-plan.v1";
type Source = (project: DemoProject, version?: DemoVersion) => string;
const searchText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");

export function VideoPlanner({ library, source, onBack, onAddPhotos, storageKey = STORAGE_KEY }: { storageKey?: string; library: DemoLibrary; source: Source; onBack: () => void; onAddPhotos: (files: File[], property: string) => Promise<DemoProject[]> }) {
  const [property, setProperty] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idea, setIdea] = useState("");
  const [cleanup, setCleanup] = useState("");
  const [route, setRoute] = useState("");
  const [brief, setBrief] = useState("");
  const [briefIdea, setBriefIdea] = useState<string | null>(null);
  const [briefContext, setBriefContext] = useState<string | null>(null);
  const [photoSearch, setPhotoSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [restored, setRestored] = useState(false);
  const [adding, setAdding] = useState(false);
  const [importError, setImportError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const briefPanel = useRef<HTMLElement>(null);
  const photos = library.projects.filter(project => project.kind === "photo" && !project.sample);
  const properties = [...new Set(photos.map(project => project.property))];
  const currentProperty = properties.includes(property) ? property : "";
  const available = currentProperty ? photos.filter(project => project.property === currentProperty) : photos;
  const selected = photos.filter(project => selectedIds.includes(project.id)).sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
  const search = searchText(photoSearch.trim());
  const visiblePhotos = available.filter(project => (!selectedOnly || selectedIds.includes(project.id)) && (!search || searchText(project.title).includes(search)));

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved === "object") {
          if (typeof saved.property === "string") setProperty(saved.property.slice(0, 500));
          if (typeof saved.idea === "string") setIdea(saved.idea.slice(0, 4000));
          if (typeof saved.cleanup === "string") setCleanup(saved.cleanup.slice(0, 2500));
          if (typeof saved.route === "string") setRoute(saved.route.slice(0, 2500));
          if (typeof saved.brief === "string") setBrief(saved.brief);
          if (typeof saved.briefIdea === "string") setBriefIdea(saved.briefIdea);
          if (typeof saved.briefContext === "string") setBriefContext(saved.briefContext);
          if (Array.isArray(saved.selectedIds)) setSelectedIds([...new Set((saved.selectedIds as unknown[]).filter((value: unknown): value is string => typeof value === "string"))]);
        }
      } catch { /* Le brouillon reste utilisable si le stockage est indisponible. */ }
      setRestored(true);
    });
    return () => { active = false; };
  }, [storageKey]);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ property: currentProperty, selectedIds, idea, cleanup, route, brief, briefIdea, briefContext })); }
    catch { /* Aucun appel distant ni perte du texte affiché. */ }
  }, [storageKey, restored, currentProperty, selectedIds, idea, cleanup, route, brief, briefIdea, briefContext]);

  function toggle(id: string) {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }
  function move(id: string, direction: -1 | 1) {
    setSelectedIds(ids => {
      const from = ids.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ids.length) return ids;
      const ordered = [...ids];
      [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
      return ordered;
    });
  }
  async function addPhotos(files: File[]) {
    const logement = currentProperty || UNASSIGNED_PROPERTY;
    if (!files.length || adding) return;
    setAdding(true); setImportError("");
    try {
      const projects = await onAddPhotos(files, logement);
      setSelectedIds(ids => [...ids, ...projects.map(project => project.id)]);
      setPhotoSearch(""); setSelectedOnly(false);
    } catch (cause) { setImportError(storageError(cause)); }
    finally { setAdding(false); }
  }
  const context = videoVisitContext(selected.map(project => {
    const version = project.versions.find(item => item.id === project.selected) || project.versions[0];
    return `${project.title}${project.property !== UNASSIGNED_PROPERTY ? ` (${project.property})` : ""} — ${version.label}`;
  }), cleanup, route);

  return <main className="st-main st-video-plan">
    <CreationBack onClick={onBack}/>
    <p className="eyebrow">PRÉPARER UNE VIDÉO</p>
    <h1>Photos → vidéo</h1>
    <p className="st-video-intro">Choisissez vos photos, puis décrivez le mouvement souhaité. Vous pouvez aussi partir d’une idée, sans photo.</p>

    <section className="st-step" aria-labelledby="video-source-title">
      <h2 id="video-source-title"><span className="st-step-number">1</span> Vos photos <span className="st-video-optional">Facultatif</span></h2>
      <div className="st-video-upload"><button type="button" className="button outlined" disabled={adding} onClick={() => input.current?.click()}><Upload size={17}/>{adding ? "Ajout en cours…" : "Ajouter des photos"}</button><span>Depuis votre appareil, sans quitter cette vidéo.</span><input ref={input} type="file" multiple hidden accept="image/jpeg,image/png,image/webp" onChange={event => { void addPhotos(Array.from(event.target.files || [])); event.target.value = ""; }}/></div>
      {properties.length > 1 && <label className="st-video-property">Photos à afficher<select value={currentProperty} disabled={adding} onChange={event => setProperty(event.target.value)}><option value="">Tous les logements</option>{properties.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
      {importError && <p className="st-error" role="alert">{importError}</p>}
      {available.length ? <>
        <div className="st-video-photo-tools">
          <div className="st-video-search">
            <label htmlFor="video-photo-search">Retrouver une photo</label>
            <div><Search size={17} aria-hidden="true"/><input id="video-photo-search" type="search" value={photoSearch} onChange={event => setPhotoSearch(event.target.value)} placeholder="Salon, cuisine, terrasse…"/>{photoSearch && <button type="button" aria-label="Effacer la recherche de photos" onClick={() => setPhotoSearch("")}><X size={15}/></button>}</div>
          </div>
          <button type="button" className="st-video-selected-filter" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(value => !value)}><CheckCircle2 size={16}/>Sélection uniquement <span>{selected.length}</span></button>
        </div>
        <p className="st-video-photo-count" role="status">{selected.length} photo{selected.length > 1 ? "s" : ""} choisie{selected.length > 1 ? "s" : ""} sur {photos.length}<span>{visiblePhotos.length} affichée{visiblePhotos.length > 1 ? "s" : ""}</span></p>
        {visiblePhotos.length ? <div className="st-video-photos" aria-label="Photos à inclure dans la visite">{visiblePhotos.map(project => <button type="button" key={project.id} aria-pressed={selectedIds.includes(project.id)} onClick={() => toggle(project.id)}><span className="st-video-thumb"><Image src={source(project)} alt="" fill sizes="120px" unoptimized/></span><span>{project.title}</span>{selectedIds.includes(project.id) && <span className="st-video-selection-order" aria-label={`Position ${selected.findIndex(item => item.id === project.id) + 1}`}>{selected.findIndex(item => item.id === project.id) + 1}</span>}</button>)}</div> : <div className="st-video-no-results"><Search size={22}/><p>{photoSearch.trim() ? "Aucune photo ne correspond à votre recherche." : "Aucune photo sélectionnée pour le moment."}</p><button type="button" className="text-action" onClick={() => { setPhotoSearch(""); setSelectedOnly(false); }}>Afficher toutes les photos</button></div>}
        <p className="st-video-hint">La recherche conserve tous vos choix. Vous pouvez aussi continuer sans photo.</p>
        {selected.length > 1 && <div className="st-video-order"><strong>Ordre de la visite</strong><ol>{selected.map((project, index) => <li key={project.id}><span>{index + 1}. {project.title}</span><div><button type="button" aria-label={`Monter ${project.title}`} disabled={index === 0} onClick={() => move(project.id, -1)}><ArrowUp size={15}/></button><button type="button" aria-label={`Descendre ${project.title}`} disabled={index === selected.length - 1} onClick={() => move(project.id, 1)}><ArrowDown size={15}/></button></div></li>)}</ol></div>}
      </> : <div className="st-video-empty"><Images size={23}/><p>Les photos ajoutées apparaîtront ici. Une idée seule suffit aussi pour préparer votre vidéo.</p></div>}
    </section>

    <section className="st-step" aria-labelledby="video-prep-title">
      <h2 id="video-prep-title"><span className="st-step-number">2</span> Préparer la visite</h2>
      <p className="st-video-prep-note">Une vidéo propre part de photos rangées et d’un trajet vérifié. Indiquez ce qui doit disparaître ; gardez les murs, portes et équipements fidèles au logement. Dans cet aperçu, ces consignes alimentent le brief : les photos ne sont pas encore retouchées automatiquement.</p>
      <label className="st-video-label" htmlFor="video-cleanup">À ranger ou à retoucher avant l’animation</label>
      <textarea id="video-cleanup" value={cleanup} maxLength={2500} rows={3} onChange={event => setCleanup(event.target.value)} placeholder="Ex. : faire le lit rose, enlever les valises et chaussures, vider l’îlot de cuisine ; garder les meubles et les matériaux."/>
      <label className="st-video-label" htmlFor="video-route">Portes réelles et ordre des pièces</label>
      <textarea id="video-route" value={route} maxLength={2500} rows={3} onChange={event => setRoute(event.target.value)} placeholder="Ex. : piscine → baie du séjour → cuisine → escalier intérieur. Si la porte d’une chambre n’est pas visible, faire une coupe."/>
      <p className="st-video-hint">Si une ouverture n’est pas démontrée par les images, le brief demande une coupe nette au lieu d’un passage inventé.</p>
    </section>

    <section className="st-step" aria-labelledby="video-idea-title">
      <h2 id="video-idea-title"><span className="st-step-number">3</span> Votre idée</h2>
      <label className="st-video-label" htmlFor="video-idea">Décrivez le trajet ou l’ambiance que vous imaginez</label>
      <textarea id="video-idea" value={idea} maxLength={4000} rows={5} onChange={event => setIdea(event.target.value)} placeholder="Ex. : une caméra flotte du salon vers la cuisine, s’attarde sur la lumière et termine sur la chambre…"/>
      <BriefAssistant kind="video" request={idea} context={context} onUse={value => { setBrief(value); setBriefIdea(idea); setBriefContext(context); requestAnimationFrame(() => briefPanel.current?.scrollIntoView({ behavior: "smooth", block: "center" })); }}/>
    </section>

    {brief && <section ref={briefPanel} className="st-step" aria-labelledby="video-brief-title"><h2 id="video-brief-title"><span className="st-step-number">4</span> Votre demande vidéo complète</h2><p className="st-video-label">Voici le texte préparé à partir de votre idée et de vos réponses. Rien à recopier : les autres champs servent seulement à ajouter des précisions si vous le souhaitez.</p>{(briefIdea !== idea || briefContext !== context) && <p className="st-video-changed" role="status">{briefIdea === null || briefContext === null ? "Ce brief est ancien. Vérifiez qu’il correspond encore à votre idée et aux photos choisies." : "L’idée, l’ordre des photos ou les consignes de préparation ont changé. Reprenez l’assistant pour actualiser le brief, ou ajustez le texte ci-dessous."}</p>}<div className="st-video-brief-details"><p className="st-video-label"><CheckCircle2 size={19}/> Votre texte reste modifiable ci-dessous.</p><textarea aria-label="Brief vidéo modifiable" value={brief} rows={10} onChange={event => setBrief(event.target.value)}/></div></section>}

    <section className="st-video-next" aria-label="Suite de la création vidéo"><div className="st-video-next-icon"><Film size={22}/></div><div><h2>Votre brief reste modifiable.</h2><p>La retouche des photos, la génération des plans et l’estimation du coût seront proposées ici lorsque les moteurs seront connectés. Une visite longue devra être testée en plusieurs plans puis assemblée ; la continuité de la caméra ne peut pas être garantie à partir de photos seules.</p></div><span><Sparkles size={15}/> Démonstration</span></section>
    <p className="st-video-local"><Info size={15}/> Votre brouillon reste dans ce navigateur si son stockage est disponible. Aucune photo ni demande n’est envoyée à un moteur distant depuis cet aperçu.</p>
  </main>;
}

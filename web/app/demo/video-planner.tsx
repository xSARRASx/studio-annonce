"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Film, Images, Info, Search, Sparkles, Upload, X } from "lucide-react";
import { BriefAssistant } from "./brief-assistant";
import { CAMERA_MOVES, cameraMove, cameraDescription, readCameraMoves, DYNAMIC_VIDEO_EXAMPLE, DEFAULT_VIDEO_REQUEST, type CameraMove } from "../../../shared/video-direction";
import { videoVisitContext } from "../../../shared/video-visit";
import { storageError, type DemoLibrary, type DemoProject, type DemoVersion } from "./library";
import { CreationBack } from "./creation-hub";
import { VideoGeneration } from "@/components/video-generation";
import { UNASSIGNED_PROPERTY } from "./studio-screens";
import "./video-planner.css";

import { saveVideoDraft } from "@/lib/video-draft";
import { api } from "@/lib/api";
import { extraireVues } from "../../../shared/video-reperage-web";
import { finalVideoDuration, durationFromBrief, VIDEO_DURATIONS, VIDEO_REQUEST_MAX, videoDuration } from "../../../shared/video-duration";
import type { VideoEditing, VideoQuality } from "../../../shared/video-options";

const STORAGE_KEY = "studio-annonce.video-plan.v1";
type Source = (project: DemoProject, version?: DemoVersion) => string;
const searchText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
type Reperage = { pieces: string[]; passages: { depart: string; arrivee: string; porte: string; preuve: "visible" | "incertain" }[]; avertissement: string; agencement: string };
const PORTES: Record<string, string> = { coupe: "passage non confirmé : faire une coupe", meme: "même pièce : rester dans cet espace", gauche: "porte à gauche depuis la photo de départ", centre: "ouverture en face depuis la photo de départ", droite: "porte à droite depuis la photo de départ" };

export function VideoPlanner({ library, source, onBack, onAddPhotos, connected, storageKey = STORAGE_KEY }: { connected?: { enabled: boolean; free: boolean; videoCredits: number; paymentEnabled: boolean }; storageKey?: string; library: DemoLibrary; source: Source; onBack: () => void; onAddPhotos: (files: File[], property: string, onProgress?: (project: DemoProject) => void) => Promise<DemoProject[]> }) {
  const isConnected = !!connected;
  const saveScope = useRef(0);
  const [assistantRevision, setAssistantRevision] = useState(0);
  useEffect(() => { const changed = (event: Event) => { if ((event as CustomEvent).detail === `${storageKey}:assistant`) setAssistantRevision(n => n + 1); }; window.addEventListener("studio:assistant-draft", changed); return () => window.removeEventListener("studio:assistant-draft", changed); }, [storageKey]);
  const [generationRevision, setGenerationRevision] = useState(0);
  const [property, setProperty] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [movements, setMovements] = useState<Record<string, CameraMove>>({});
  const [saveNotice, setSaveNotice] = useState("");
  const launchedSnapshot = useRef("");
  const saveQueue = useRef(Promise.resolve());
  const [chosenDuration, setChosenDuration] = useState<number | null>(null);
  const [quality, setQuality] = useState<VideoQuality>("720p");
  const [editing, setEditing] = useState<VideoEditing>("montage");
  const [idea, setIdea] = useState(DEFAULT_VIDEO_REQUEST);
  const [cleanup, setCleanup] = useState("");
  const [route, setRoute] = useState("");
  const [liaisons, setLiaisons] = useState<Record<string, string>>({});
  const [videoRepere, setVideoRepere] = useState<File | null>(null);
  const [reperage, setReperage] = useState<Reperage | null>(null);
  const [reperageBusy, setReperageBusy] = useState(false);
  const [reperageError, setReperageError] = useState("");
  const [brief, setBrief] = useState("");
  const [briefIdea, setBriefIdea] = useState<string | null>(null);
  const [briefContext, setBriefContext] = useState<string | null>(null);
  const [photoSearch, setPhotoSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [addingTotal, setAddingTotal] = useState(0);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [restored, setRestored] = useState(false);
  const [adding, setAdding] = useState(false);
  const [importError, setImportError] = useState("");
  const [retryFiles, setRetryFiles] = useState<File[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const briefPanel = useRef<HTMLElement>(null);
  const photos = library.projects.filter(project => project.kind === "photo" && !project.sample);
  const properties = [...new Set(photos.map(project => project.property))];
  const currentProperty = properties.includes(property) ? property : "";
  const available = (currentProperty ? photos.filter(project => project.property === currentProperty) : photos).sort((a, b) =>
    a.property.localeCompare(b.property, "fr", { numeric: true }) ||
    a.title.localeCompare(b.title, "fr", { numeric: true }) || a.createdAt - b.createdAt);
  const selected = photos.filter(project => selectedIds.includes(project.id)).sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
  const search = searchText(photoSearch.trim());
  const visiblePhotos = available.filter(project => (!selectedOnly || selectedIds.includes(project.id)) && (!search || searchText(project.title).includes(search)));

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        launchedSnapshot.current = localStorage.getItem(`${storageKey}:launched-snapshot`) || "";
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved === "object") {
          if (typeof saved.property === "string") setProperty(saved.property.slice(0, 500));
          setChosenDuration(videoDuration(saved.duration));
          if (saved.quality === "720p" || saved.quality === "1080p") setQuality(saved.quality);
          if (saved.editing === "montage" || saved.editing === "continue") setEditing(saved.editing);
          setMovements(readCameraMoves(saved.movements));
          if (typeof saved.idea === "string") setIdea(saved.idea.slice(0, 4000));
          if (typeof saved.cleanup === "string") setCleanup(saved.cleanup.slice(0, 2500));
          if (typeof saved.route === "string") setRoute(saved.route.slice(0, isConnected ? 1200 : 2500));
          if (saved.liaisons && typeof saved.liaisons === "object") setLiaisons(Object.fromEntries(Object.entries(saved.liaisons).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] in PORTES)));
          if (typeof saved.brief === "string") setBrief(saved.brief);
          if (typeof saved.briefIdea === "string") setBriefIdea(saved.briefIdea);
          if (typeof saved.briefContext === "string") setBriefContext(saved.briefContext);
          if (saved.selectedVersions && typeof saved.selectedVersions === "object") setSelectedVersions(Object.fromEntries(Object.entries(saved.selectedVersions).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[0].length <= 24).map(([key, value]) => [key, value || "original"])));
          if (Array.isArray(saved.selectedIds)) setSelectedIds([...new Set((saved.selectedIds as unknown[]).filter((value: unknown): value is string => typeof value === "string"))]);
        }
      } catch { /* Le brouillon reste utilisable si le stockage est indisponible. */ }
      setRestored(true);
    });
    return () => { active = false; };
  }, [storageKey, isConnected]);
  useEffect(() => {
    if (!restored) return;
    let assistant = null; try { assistant = JSON.parse(localStorage.getItem(`${storageKey}:assistant`) || "null"); } catch {}
    const data = { assistant, duration: chosenDuration, quality, editing, property: currentProperty, selectedIds, selectedVersions, movements, idea, cleanup, route, liaisons, brief, briefIdea, briefContext };
    const snapshot = JSON.stringify(data);
    try { localStorage.setItem(storageKey, snapshot); } catch { /* La sauvegarde dans le compte reste possible. */ }
    if (!isConnected || ((idea === DEFAULT_VIDEO_REQUEST || !idea.trim()) && !brief.trim() && !selectedIds.length) || launchedSnapshot.current === snapshot) return;
    setSaveNotice("Enregistrement du brouillon…");
    // Envois sérialisés : une ancienne réponse ne peut pas remplacer la dernière saisie.
    const scope = saveScope.current;
    const timer = window.setTimeout(() => {
      if(scope !== saveScope.current)return;
      saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
        if (scope !== saveScope.current || launchedSnapshot.current === snapshot) return;
        await saveVideoDraft(storageKey, data);
        setSaveNotice("Brouillon enregistré dans Mes créations → Brouillons.");
      }).catch(() => setSaveNotice("Sauvegarde dans le compte interrompue. Votre préparation reste sur ce navigateur ; réessayez avant de changer d’appareil."));
    }, 350);
    return () => clearTimeout(timer);
  }, [isConnected, storageKey, restored, assistantRevision, chosenDuration, quality, editing, currentProperty, selectedIds, selectedVersions, movements, idea, cleanup, route, liaisons, brief, briefIdea, briefContext]);

  async function newVideo() {
    saveScope.current += 1;
    try {
      await saveQueue.current;
      const previous = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (JSON.stringify(previous) !== launchedSnapshot.current && (previous.idea || previous.brief || previous.selectedIds?.length)) await saveVideoDraft(storageKey, previous);
      for (const suffix of ["", ":draft-id", ":assistant", ":generation", ":launched-snapshot"]) localStorage.removeItem(`${storageKey}${suffix}`);
      launchedSnapshot.current = "";
      setSelectedIds([]); setSelectedVersions({}); setMovements({}); setIdea(DEFAULT_VIDEO_REQUEST); setCleanup(""); setRoute(""); setLiaisons({}); setVideoRepere(null); setReperage(null); setBrief(""); setBriefIdea(null); setBriefContext(null); setChosenDuration(null); setQuality("720p"); setEditing("montage");
      setGenerationRevision(value => value + 1); setSaveNotice("Nouvelle préparation. Vos anciennes vidéos restent dans Mes créations.");
    } catch { setSaveNotice("Enregistrez votre brouillon avant de commencer une nouvelle vidéo : la sauvegarde est momentanément indisponible."); }
  }

  function toggle(id: string) {
    setReperage(null);
    if (!selectedIds.includes(id) && selectedIds.length >= Math.min(6, (duration / 5) * 2)) {
      setImportError(`Pour ${duration} secondes, choisissez au maximum ${Math.min(6, (duration / 5) * 2)} photos. Allongez la vidéo ou retirez une photo.`);
      return;
    }
    setImportError("");
    setSelectedIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }
  function move(id: string, direction: -1 | 1) {
    setReperage(null);
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
    setReperage(null);
    const logement = currentProperty || UNASSIGNED_PROPERTY;
    if (!files.length || adding) return;
    setAdding(true); setAddingTotal(files.length); setImportError("");
    try {
      setAddedCount(0);
      const imported = await onAddPhotos(files, logement, project => {
        setSelectedIds(ids => ids.includes(project.id) || ids.length >= Math.min(6, (duration / 5) * 2) ? ids : [...ids, project.id]);
        setAddedCount(count => count + 1);
      });
      setSelectedIds(ids => [...new Set([...ids, ...imported.map(project => project.id)])].slice(0, Math.min(6, (duration / 5) * 2)));
      setPhotoSearch(""); setSelectedOnly(false);
      setRetryFiles([]);
    } catch (cause) { setImportError(storageError(cause)); setRetryFiles(files); }
    finally { setAdding(false); }
  }
  const duration = finalVideoDuration(chosenDuration, selected.length, brief);
  const portesConfirmees = selected.slice(1).map((photo, index) => {
    const depart = selected[index];
    const choix = liaisons[`${depart.id}:${photo.id}`] || "coupe";
    return `${depart.title} → ${photo.title} : ${PORTES[choix] || PORTES.coupe}.`;
  }).join(" ");
  const agencementVideo = route.slice(0, 1200);
  const passagesVideo = selected.slice(1).map((photo, index) => liaisons[`${selected[index].id}:${photo.id}`] || "coupe");
  const passagesManquants = passagesVideo.filter(value => value === "coupe").length;
  const context = videoVisitContext(selected.map(project => {
    const version = project.versions.find(item => item.id === (selectedVersions[project.id] || project.selected)) || project.versions[0];
    return `${project.title} — ${cameraDescription(movements[project.id], selectedIds.indexOf(project.id))}${project.property !== UNASSIGNED_PROPERTY ? ` (${project.property})` : ""} — ${version.label}`;
  }), cleanup, `${portesConfirmees}\n${route}`);

  async function analyserVideo() {
    if (!videoRepere || !selected.length || reperageBusy) return;
    setReperageBusy(true); setReperageError(""); setReperage(null);
    try {
      const images = await extraireVues(videoRepere);
      const result = await api<Reperage>("/videos/reperage", { method: "POST", body: JSON.stringify({ photos: selected.map(photo => photo.id), images }) });
      setReperage(result);
    } catch (erreur) { setReperageError(erreur instanceof Error ? erreur.message : "Le repérage n'a pas abouti."); }
    finally { setReperageBusy(false); }
  }

  return <main className="st-main st-video-plan">
    <CreationBack onClick={onBack}/>
    {connected && <div className="st-draft-status"><span role="status">{saveNotice || "Votre préparation est enregistrée automatiquement. Aucun crédit utilisé avant confirmation."}</span><a className="button outlined" href="#brouillons">Mes brouillons</a><button type="button" className="button outlined" onClick={() => void newVideo()}>Nouvelle vidéo</button></div>}
    <p className="eyebrow">PRÉPARER UNE VIDÉO</p>
    <h1>Photos → vidéo</h1>
    <p className="st-video-intro">Choisissez vos photos, puis décrivez le mouvement souhaité. {connected ? "Choisissez jusqu’à 2 photos pour 5 secondes, et jusqu’à 6 photos pour une vidéo plus longue de 30 secondes au maximum." : "Vous pouvez aussi partir d’une idée, sans photo."}</p>

    <section className="st-step" aria-labelledby="video-source-title">
      <h2 id="video-source-title"><span className="st-step-number">1</span> Vos photos {!connected && <span className="st-video-optional">Facultatif</span>}</h2>
      <div className="st-video-upload"><button type="button" className="button outlined" disabled={adding} onClick={() => input.current?.click()}><Upload size={17}/>{adding ? `Ajout ${addedCount}/${addingTotal}…` : "Ajouter des photos"}</button><span>Depuis votre appareil. Vos images sont sélectionnées dans l’ordre d’ajout.</span><input ref={input} type="file" multiple hidden accept="image/jpeg,image/png,image/webp" onChange={event => { void addPhotos(Array.from(event.target.files || [])); event.target.value = ""; }}/></div>
      <Link className="st-video-import-link" href="/app/importer/?suite=video">Enregistrer le lien de mon annonce et ajouter ses photos →</Link>
      {photos.length > 0 && <button type="button" className="st-video-picker-toggle" aria-expanded={pickerOpen} onClick={() => setPickerOpen(open => !open)}><Images size={18}/>{pickerOpen ? "Masquer mes photos" : `Choisir parmi mes photos (${photos.length})`}</button>}
      {pickerOpen && properties.length > 1 && <label className="st-video-property">Photos à afficher<select value={currentProperty} disabled={adding} onChange={event => setProperty(event.target.value)}><option value="">Tous les logements</option>{properties.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
      {importError && <p className="st-error" role="alert">{importError}</p>}
      {retryFiles.length > 0 && <button type="button" className="button outlined" disabled={adding} onClick={() => void addPhotos(retryFiles)}>Reprendre les envois restants</button>}
      {selected.length > 0 && <p className="st-video-photo-count" role="status">{selected.length} photo{selected.length > 1 ? "s" : ""} choisie{selected.length > 1 ? "s" : ""} pour cette vidéo, dans l’ordre ci-dessous.</p>}
      {pickerOpen && available.length ? <>
        <div className="st-video-photo-tools">
          <div className="st-video-search">
            <label htmlFor="video-photo-search">Retrouver une photo</label>
            <div><Search size={17} aria-hidden="true"/><input id="video-photo-search" type="search" value={photoSearch} onChange={event => setPhotoSearch(event.target.value)} placeholder="Salon, cuisine, terrasse…"/>{photoSearch && <button type="button" aria-label="Effacer la recherche de photos" onClick={() => setPhotoSearch("")}><X size={15}/></button>}</div>
          </div>
          <button type="button" className="st-video-selected-filter" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(value => !value)}><CheckCircle2 size={16}/>Sélection uniquement <span>{selected.length}</span></button>
        </div>
        <p className="st-video-photo-count" role="status">{selected.length} photo{selected.length > 1 ? "s" : ""} choisie{selected.length > 1 ? "s" : ""} sur {photos.length}<span>{visiblePhotos.length} affichée{visiblePhotos.length > 1 ? "s" : ""}</span></p>
        {visiblePhotos.length ? <div className="st-video-photos" aria-label="Photos à inclure dans la visite">{visiblePhotos.map(project => <button type="button" key={project.id} aria-pressed={selectedIds.includes(project.id)} onClick={() => toggle(project.id)}><span className="st-video-thumb"><Image src={source(project)} alt="" fill sizes="120px" unoptimized/></span><span>{project.title}</span>{selectedIds.includes(project.id) && <span className="st-video-selection-order" aria-label={`Position ${selected.findIndex(item => item.id === project.id) + 1}`}>{selected.findIndex(item => item.id === project.id) + 1}</span>}</button>)}</div> : <div className="st-video-no-results"><Search size={22}/><p>{photoSearch.trim() ? "Aucune photo ne correspond à votre recherche." : "Aucune photo sélectionnée pour le moment."}</p><button type="button" className="text-action" onClick={() => { setPhotoSearch(""); setSelectedOnly(false); }}>Afficher toutes les photos</button></div>}
        <p className="st-video-hint">La recherche conserve tous vos choix. {connected ? `Pour ${duration} secondes, choisissez au plus ${Math.min(6, (duration / 5) * 2)} photos d’un seul logement.` : "Vous pouvez aussi continuer sans photo."}</p>
      </> : pickerOpen && <div className="st-video-empty"><Images size={23}/><p>Ajoutez des photos depuis votre appareil ou l’annonce, puis choisissez celles de la vidéo.</p></div>}
      {selected.length > 0 && <div className="st-video-order"><strong>Vos plans, dans cet ordre</strong><ol>{selected.map((project, index) => {
        const version = project.versions.find(item => item.id === (selectedVersions[project.id] || project.selected)) || project.versions[0];
        return <li key={project.id}><span className="st-video-ordered-photo"><Image src={source(project, version)} alt="" width={64} height={48} unoptimized/><span>{index + 1}. {project.title}<small>{project.property}</small></span></span><div>{connected && <label className="st-video-motion-label">Mouvement<select aria-label={`Mouvement pour le plan ${index + 1}`} value={movements[project.id] || "auto"} onChange={event => setMovements(values => ({ ...values, [project.id]: cameraMove(event.target.value) }))}>{CAMERA_MOVES.map(move => <option key={move.id} value={move.id}>{move.label}</option>)}</select><small>{cameraDescription(movements[project.id], index)}</small></label>}{project.versions.length > 1 && <select aria-label={`Version pour le plan ${index + 1}`} value={version.id} onChange={event => setSelectedVersions(values => ({ ...values, [project.id]: event.target.value }))}>{project.versions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}<button type="button" aria-label={`Monter ${project.title}`} disabled={index === 0} onClick={() => move(project.id, -1)}><ArrowUp size={15}/></button><button type="button" aria-label={`Descendre ${project.title}`} disabled={index === selected.length - 1} onClick={() => move(project.id, 1)}><ArrowDown size={15}/></button><button type="button" aria-label={`Retirer le plan ${index + 1}`} onClick={() => toggle(project.id)}><X size={15}/></button></div></li>;
      })}</ol></div>}

    </section>

    <section className="st-step" aria-labelledby="video-prep-title">
      <h2 id="video-prep-title"><span className="st-step-number">2</span> Préparer la visite</h2>
      {connected && <label className="st-video-property">Durée totale de la vidéo<select aria-label="Durée totale de la vidéo" value={duration} onChange={event => setChosenDuration(Number(event.target.value))}>{VIDEO_DURATIONS.map(seconds => <option key={seconds} value={seconds}>{seconds} secondes</option>)}</select><span>Maximum {Math.min(6, (duration / 5) * 2)} photos pour {duration} secondes. Le moteur prépare une seule visite à partir de vos photos, dans l’ordre choisi.</span></label>}
      {connected && <div className="st-video-options"><fieldset><legend>Comment passer d’une pièce à l’autre ?</legend><label><input type="radio" name="video-editing" value="montage" checked={editing === "montage"} onChange={() => setEditing("montage")}/><span><strong>Plans avec raccords</strong><small>Des mouvements dans chaque pièce, avec des coupes nettes entre les pièces.</small></span></label><label><input type="radio" name="video-editing" value="continue" checked={editing === "continue"} onChange={() => setEditing("continue")}/><span><strong>Visite fluide façon drone</strong><small>Demander un passage par les vraies portes. Précisez le trajet juste après ; le résultat continu dépend des images.</small></span></label></fieldset><fieldset><legend>Qualité du fichier final</legend><label><input type="radio" name="video-quality" value="720p" checked={quality === "720p"} onChange={() => setQuality("720p")}/><span><strong>HD · 720p</strong><small>1 crédit vidéo par 5 secondes.</small></span></label><label><input type="radio" name="video-quality" value="1080p" checked={quality === "1080p"} onChange={() => setQuality("1080p")}/><span><strong>Full HD · 1080p</strong><small>2 crédits vidéo par 5 secondes, coût indiqué avant confirmation.</small></span></label></fieldset></div>}
      {connected && selected.length > Math.min(6, (duration / 5) * 2) && <p className="st-error" role="alert">Retirez {selected.length - Math.min(6, (duration / 5) * 2)} photo{selected.length - Math.min(6, (duration / 5) * 2) > 1 ? "s" : ""} ou choisissez une durée plus longue avant de lancer.</p>}
      <p className="st-video-prep-note">{connected ? "La vidéo anime les versions sélectionnées ci-dessus. Pour changer le mobilier, ranger ou améliorer la lumière, retouchez d’abord les photos dans Mes créations. Le moteur suit votre ordre et doit conserver chaque pièce à sa vraie place." : "Une vidéo propre part de photos rangées et d’un trajet vérifié. Indiquez ce qui doit disparaître ; gardez les murs, portes et équipements fidèles au logement. Dans cet aperçu, ces consignes alimentent le brief : les photos ne sont pas encore retouchées automatiquement."}</p>
      {connected && <Link className="button outlined" href="/app/">Retoucher mes photos d’abord →</Link>}
      {connected && <div className="st-video-layout" aria-label="Repérage du logement">
        <details>
        <summary><strong>Ajouter le trajet réel du logement <em>facultatif</em></strong><span>Ouvrir pour indiquer quelle porte mène à chaque pièce ou joindre une courte vidéo de repérage →</span></summary>
        <p>Une courte vidéo filmée en passant par les portes aide à repérer les pièces. Elle reste sur votre appareil : seules quelques images légères sont analysées. La vidéo n’est jamais envoyée à Higgsfield.</p>
        <div className="st-video-layout-actions"><label className="button outlined">Choisir une vidéo du logement<input type="file" accept="video/*" hidden disabled={!connected.enabled} onChange={event => { setVideoRepere(event.target.files?.[0] || null); setReperage(null); setReperageError(""); }}/></label>{videoRepere && <span>{videoRepere.name}</span>}<button type="button" className="button outlined" disabled={!connected.enabled || !videoRepere || !selected.length || reperageBusy} onClick={() => void analyserVideo()}>{reperageBusy ? "Repérage en cours…" : "Analyser le trajet"}</button></div>
        {!connected.enabled && <p className="st-video-hint">Le repérage automatique est momentanément indisponible sur ce compte. Vous pouvez décrire les portes ci-dessous et conserver cette préparation.</p>}
        {reperageError && <p className="st-error" role="alert">{reperageError}</p>}
        {reperage && <div className="st-video-layout-result"><strong>Trajet proposé, à vérifier</strong><p>{reperage.agencement}</p>{reperage.avertissement && <small>{reperage.avertissement}</small>}<button type="button" className="button outlined" onClick={() => setRoute(reperage.agencement.slice(0, 800))}>Ajouter à ma visite</button></div>}
        {selected.length > 1 && <div className="st-video-layout-links"><strong>Quelle ouverture mène à la pièce suivante ?</strong>{selected.slice(1).map((photo, index) => { const previous = selected[index]; const key = `${previous.id}:${photo.id}`; return <label key={key}>{previous.title} → {photo.title}<select value={liaisons[key] || "coupe"} onChange={event => setLiaisons(value => ({ ...value, [key]: event.target.value }))}><option value="coupe">Je ne sais pas · faire une coupe</option><option value="meme">C’est la même pièce</option><option value="gauche">Porte à gauche</option><option value="centre">Ouverture en face</option><option value="droite">Porte à droite</option></select></label>; })}</div>}
        <label className="st-video-label" htmlFor="video-route">Autres précisions sur les pièces · facultatif</label>
        <textarea id="video-route" value={route} maxLength={800} rows={3} onChange={event => setRoute(event.target.value)} placeholder="Ex. : dans le salon, la porte de gauche mène à la chambre ; celle de droite mène à la cuisine."/>
        <p className="st-video-hint">Vérifiez chaque porte avant de lancer. Si vous n’êtes pas sûr, gardez « faire une coupe » : le moteur ne doit pas inventer un passage. Le repérage ne lance aucune création payante.</p>
        </details>
        <p className="st-video-hint">{editing === "continue" && passagesManquants ? `Pour demander la visite fluide, ouvrez cette section et indiquez ${passagesManquants} passage${passagesManquants > 1 ? "s" : ""} encore inconnu${passagesManquants > 1 ? "s" : ""}.` : "Sans passage confirmé, la vidéo fait une coupe entre les pièces au lieu d’inventer une porte."}</p>
      </div>}
      {!connected && <>
      <label className="st-video-label" htmlFor="video-cleanup">À ranger ou à retoucher avant l’animation</label>
      <textarea id="video-cleanup" value={cleanup} maxLength={2500} rows={3} onChange={event => setCleanup(event.target.value)} placeholder="Ex. : faire le lit rose, enlever les valises et chaussures, vider l’îlot de cuisine ; garder les meubles et les matériaux."/>
      <label className="st-video-label" htmlFor="video-route">Portes réelles et ordre des pièces</label>
      <textarea id="video-route" value={route} maxLength={2500} rows={3} onChange={event => setRoute(event.target.value)} placeholder="Ex. : piscine → baie du séjour → cuisine → escalier intérieur. Si la porte d’une chambre n’est pas visible, faire une coupe."/>
      <p className="st-video-hint">Si une ouverture n’est pas démontrée par les images, le brief demande une coupe nette au lieu d’un passage inventé.</p></>}
    </section>

    <section className="st-step" aria-labelledby="video-idea-title">
      <h2 id="video-idea-title"><span className="st-step-number">3</span> Votre idée</h2>
      <label className="st-video-label" htmlFor="video-idea">Votre visite proposée · modifiable</label>
      <p className="st-video-hint">La demande est prête. Vous pouvez la changer ou l’effacer : sans texte, cette visite type s’applique avec les mouvements et les passages que vous avez choisis.</p>
      <textarea id="video-idea" value={idea} maxLength={connected ? VIDEO_REQUEST_MAX : 4000} rows={5} onChange={event => setIdea(event.target.value)} placeholder="Ex. : une visite façon drone : avance dans le salon, contourne la table, puis une coupe vers la chambre…"/>
      <button type="button" className="text-action" onClick={() => { setIdea(""); setBrief(""); }}>Effacer ma demande</button>
      <button type="button" className="button outlined" onClick={() => { setIdea(DYNAMIC_VIDEO_EXAMPLE); setBrief(""); setBriefIdea(null); setBriefContext(null); }}>Utiliser l’exemple « Visite dynamique »</button>
      <p className="st-video-hint">La caméra se déplace dans la pièce ; les meubles restent en place. Votre texte peut préciser le trajet et le rythme de chaque plan.</p>
      <BriefAssistant key={generationRevision} storageKey={`${storageKey}:assistant`} kind="video" request={idea} context={context} onUse={value => { const seconds = durationFromBrief(value); if (seconds) setChosenDuration(seconds); setBrief(value); setBriefIdea(idea); setBriefContext(context); requestAnimationFrame(() => briefPanel.current?.scrollIntoView({ behavior: "smooth", block: "center" })); }}/>
    </section>

    {brief && <section ref={briefPanel} className="st-step" aria-labelledby="video-brief-title"><h2 id="video-brief-title"><span className="st-step-number">4</span> Votre demande vidéo complète</h2><p className="st-video-label">Voici le texte préparé à partir de votre idée et de vos réponses. Rien à recopier : les autres champs servent seulement à ajouter des précisions si vous le souhaitez.</p>{(briefIdea !== idea || briefContext !== context) && <p className="st-video-changed" role="status">{briefIdea === null || briefContext === null ? "Ce brief est ancien. Vérifiez qu’il correspond encore à votre idée et aux photos choisies." : "L’idée, l’ordre des photos ou les consignes de préparation ont changé. Reprenez l’assistant pour actualiser le brief, ou ajustez le texte ci-dessous."}</p>}<div className="st-video-brief-details"><p className="st-video-label"><CheckCircle2 size={19}/> Votre texte reste modifiable ci-dessous.</p><textarea aria-label="Brief vidéo modifiable" value={brief} rows={10} onChange={event => setBrief(event.target.value)}/></div></section>}

    {connected ? <VideoGeneration key={generationRevision} onStarted={() => {
      launchedSnapshot.current = localStorage.getItem(storageKey) || "";
      localStorage.setItem(`${storageKey}:launched-snapshot`, launchedSnapshot.current);
      setSaveNotice("Vidéo lancée. Retrouvez son avancement dans Mes créations.");
    }} duration={duration} quality={quality} editing={editing} passages={passagesVideo} photos={selected} versions={selectedVersions} movements={movements} demande={brief && briefIdea === idea && briefContext === context ? brief : idea.trim() || DEFAULT_VIDEO_REQUEST} agencement={agencementVideo} storageKey={storageKey} enabled={connected.enabled} free={connected.free} videoCredits={connected.videoCredits} paymentEnabled={connected.paymentEnabled}/> : <><section className="st-video-next" aria-label="Suite de la création vidéo"><div className="st-video-next-icon"><Film size={22}/></div><div><h2>Votre brief reste modifiable.</h2><p>La retouche des photos, la génération des plans et l’estimation du coût seront proposées ici lorsque les moteurs seront connectés. Une visite longue devra être testée en plusieurs plans puis assemblée ; la continuité de la caméra ne peut pas être garantie à partir de photos seules.</p></div><span><Sparkles size={15}/> Démonstration</span></section>
    <p className="st-video-local"><Info size={15}/> Votre brouillon reste dans ce navigateur si son stockage est disponible. Aucune photo ni demande n’est envoyée à un moteur distant depuis cet aperçu.</p></>}
  </main>;
}

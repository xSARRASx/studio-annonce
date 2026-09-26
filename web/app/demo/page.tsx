"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Film, FolderOpen, Heart, History, Images, Info, Maximize2, Menu, Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Smartphone, Sparkles, Upload, Wallet, X } from "lucide-react";
import Landing from "./landing";
import { Brand, Compare, Modal } from "./studio-parts";
import { asset, beginDownload, dateText, importedProjects, isExpired, projectFrom, renewProject, sampleProject, storageError, type DemoLibrary, type DemoProject, type DemoVersion, type MediaKind } from "./library";
import { useLibrary } from "./use-library";
import "./studio.css";
import "./workspace.css";

type Source = (project: DemoProject, version?: DemoVersion) => string;
type Receipt = { title: string; free: boolean; until: number; renewal?: boolean };
const go = (hash: string) => { window.location.hash = hash; window.scrollTo({ top: 0 }); };
const selectedVersion = (project: DemoProject) => project.versions.find(item => item.id === project.selected) || project.versions[0];
const projectStatus = (project: DemoProject, now: number) => isExpired(project, now) ? "Retouches à renouveler" : project.editUntil ? "Retouches ouvertes" : project.saved ? "Version gardée" : project.kind === "video" ? "À regarder" : "À retoucher";
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export default function StudioDemo() {
  const { library, loading, error, update, source, refresh } = useLibrary();
  const [route, setRoute] = useState("");
  const [menu, setMenu] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<MediaKind | null>(null);
  const [rename, setRename] = useState<DemoProject | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [renew, setRenew] = useState<DemoProject | null>(null);
  const [large, setLarge] = useState<DemoProject | null>(null);
  const busyRef = useRef(false);
  useEffect(() => {
    const read = () => { setRoute(window.location.hash.slice(1)); setMenu(false); setNotice(""); };
    queueMicrotask(read);
    window.addEventListener("hashchange", read);
    const tick = () => setNow(Date.now());
    const clock = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => { window.removeEventListener("hashchange", read); window.clearInterval(clock); window.removeEventListener("focus", tick); document.removeEventListener("visibilitychange", tick); };
  }, []);
  const [screen, id] = route.split("/");
  const inStudio = ["studio", "versions", "photo", "video", "historique", "credits"].includes(screen);
  const project = id ? library.projects.find(item => item.id === id) : undefined;
  const activeLarge = large ? library.projects.find(item => item.id === large.id) || large : null;
  async function act(action: () => Promise<void>) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true);
    try { await action(); return true; } catch (cause) { setNotice(storageError(cause)); return false; }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function example(kind: MediaKind) {
    await act(async () => {
      const sample = sampleProject(kind);
      await update(state => { if (!state.projects.some(item => item.id === sample.id)) state.projects.unshift(sample); });
      go(`${kind === "photo" ? "photo" : "video"}/${sample.id}`);
    });
  }
  async function changeProject(projectId: string, change: (item: DemoProject) => void) {
    return act(async () => { await update(state => { const item = projectFrom(state, projectId); change(item); item.updatedAt = Date.now(); }); });
  }
  async function download(project: DemoProject) {
    const version = selectedVersion(project);
    await act(async () => {
      const response = await fetch(source(project, version));
      if (!response.ok) throw new Error("Le fichier ne peut pas être téléchargé pour le moment. Aucun crédit n’a été utilisé.");
      const blob = await response.blob();
      if (!blob.size) throw new Error("Le fichier est vide. Aucun crédit n’a été utilisé.");
      let firstReceipt: Receipt | null = null;
      await update(state => {
        const current = projectFrom(state, project.id);
        const first = !current.firstDownloadedAt && current.sample && current.kind === "photo" && version.id !== "original";
        beginDownload(state, project.id, version.id);
        if (first && current.editUntil) firstReceipt = { title: current.title, free: !!current.freeDownload, until: current.editUntil };
      });
      const extension = project.kind === "video" ? "mp4" : blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      const title = project.title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]+/g, "-").slice(0, 80) || "studio-annonce";
      downloadBlob(blob, project.fileName || `${title}-${version.id}.${extension}`);
      if (firstReceipt) setReceipt(firstReceipt);
      else setNotice(project.firstDownloadedAt ? "Téléchargement lancé. Aucun nouveau crédit utilisé." : "Votre fichier original est prêt. Aucun crédit utilisé.");
    });
  }
  async function doRenew() {
    if (!renew) return;
    await act(async () => {
      let nextReceipt: Receipt | null = null;
      await update(state => {
        const item = projectFrom(state, renew.id);
        if (!isExpired(item)) return;
        renewProject(state, item.id);
        nextReceipt = { title: item.title, free: false, until: item.editUntil!, renewal: true };
      });
      setRenew(null); setReceipt(nextReceipt);
    });
  }
  const nav = (hash: string) => { go(hash); setMenu(false); };
  return <div className="studio-demo">
    <div className="demo-ribbon"><span className="status-dot"/> Démonstration <span className="ribbon-detail">· aucune génération automatique ni facturation réelle</span></div>
    {!inStudio ? <Landing onStudio={() => go("studio")}/> : <div className="workspace studio-workspace">
      {menu && <button className="sidebar-scrim" aria-label="Fermer le menu" onClick={() => setMenu(false)}/>}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}><Brand onClick={() => nav("")}/><button className="close-menu icon-button" aria-label="Fermer le menu" onClick={() => setMenu(false)}><X/></button>
        <div className="sidebar-section-label">VOTRE ESPACE</div>
        <nav aria-label="Navigation du studio">
          <button className={["studio", "photo", "video"].includes(screen) ? "active" : ""} onClick={() => nav("studio")}><FolderOpen size={19}/> L’atelier <span>{library.projects.length || ""}</span></button>
          <button className={["versions", "historique"].includes(screen) ? "active" : ""} onClick={() => nav("versions")}><History size={19}/> Mes versions</button>
          <button className={screen === "credits" ? "active" : ""} onClick={() => nav("credits")}><Wallet size={19}/> Mes crédits</button>
        </nav>
        <div className="studio-sidebar-note"><ShieldCheck size={19}/><p>Votre espace à vous.<small>Projets enregistrés dans ce navigateur.</small></p></div>
        <div className="sidebar-bottom"><Link className="mobile-preview-link" href="/mobile-preview/"><Smartphone size={17}/> L’aperçu mobile <ArrowUpRight size={14}/></Link><Link className="studio-help-link" href="/demo/aide/">Une question ? Consulter l’aide</Link><button className="back-site" onClick={() => nav("")}><ArrowLeft size={15}/> Retour au site</button></div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header"><button className="mobile-menu icon-button" onClick={() => setMenu(!menu)} aria-label="Ouvrir le menu"><Menu/></button><div className="breadcrumb">Mon studio <ChevronRight size={13}/><strong>{screen === "credits" ? "Mes crédits" : screen === "versions" || screen === "historique" ? "Mes versions" : "L’atelier"}</strong></div><button className="workspace-credit" onClick={() => nav("credits")}><span className="status-dot"/>{library.credits} crédits démo</button></header>
        {notice && <div className="notice work-notice" role="status"><Info size={18}/><p>{notice}</p><button aria-label="Fermer le message" onClick={() => setNotice("")}><X size={18}/></button></div>}
        {error ? <main className="projects-main"><div className="storage-failure" role="alert"><Info size={28}/><h1>Votre espace est préservé.</h1><p>{error}</p><button className="button dark" onClick={() => void refresh()}>Réessayer</button></div></main> : loading ? <main className="projects-main"><div className="library-loading" role="status">Ouverture de votre studio…</div></main> : <>
          {(screen === "studio" || screen === "versions") && <LibraryView key={screen} library={library} source={source} now={now} history={screen === "versions"} busy={busy} onAdd={setUpload} onExample={example} onOpen={item => go(`${screen === "versions" && item.kind === "photo" ? "historique" : item.kind}/${item.id}`)}/>}
          {(screen === "photo" || screen === "historique") && project && <PhotoEditor key={project.id} project={project} source={source} busy={busy} now={now} history={screen === "historique"} onChange={change => changeProject(project.id, change)} onDownload={() => void download(project)} onRename={() => setRename(project)} onRenew={() => setRenew(project)} onLarge={() => setLarge(project)} onNotice={setNotice}/>}
          {screen === "video" && project && <VideoProject key={project.id} project={project} source={source} onDownload={() => void download(project)} onRename={() => setRename(project)} busy={busy}/>}
          {["photo", "video", "historique"].includes(screen) && !project && <main className="projects-main"><div className="storage-failure"><FolderOpen size={30}/><h1>Retrouvez vos projets.</h1><p>Ce lien ne correspond pas à un projet enregistré dans ce navigateur.</p><button className="button dark" onClick={() => go("studio")}>Ouvrir mon atelier</button></div></main>}
          {screen === "credits" && <Credits library={library}/>}
        </>}
      </div>
    </div>}
    {upload && <ImportDialog kind={upload} onClose={() => setUpload(null)} onImport={async files => {
      const projects = await importedProjects(files, upload);
      await update(state => {
        const total = [...state.projects, ...projects].reduce((sum, item) => sum + (item.file?.size || 0), 0);
        if (total > 300 * 1024 * 1024) throw new Error("Cette démo conserve jusqu’à 300 Mo de fichiers. Vos projets existants sont préservés ; choisissez un fichier plus léger.");
        state.projects.unshift(...projects);
      });
      setUpload(null); go("studio"); setNotice(`${projects.length} ${projects.length > 1 ? "fichiers ajoutés et enregistrés" : "fichier ajouté et enregistré"} sur cet appareil.`);
    }}/>}
    {rename && <RenameDialog project={rename} onClose={() => setRename(null)} onSave={async (title, property) => { await update(state => { const item = projectFrom(state, rename.id); item.title = title; item.property = property; }); setRename(null); }}/>}
    {receipt && <Modal title={receipt.renewal ? "Votre photo est de nouveau ouverte." : "Votre téléchargement est prêt."} mandatory returnFocusId="photo-download" onClose={() => setReceipt(null)}>
      <span className="receipt-icon"><CheckCircle2 size={32}/></span><p className="dialog-eyebrow">{receipt.title}</p>
      <p className="receipt-lead">{receipt.free ? "Cette première photo est offerte." : "1 crédit de démonstration a été utilisé."}</p>
      <p>Vous disposez de <strong>7 jours pour ajuster cette photo</strong> sans nouveau crédit.</p>
      <div className="receipt-deadline"><Clock3 size={21}/><span>Retouches ouvertes jusqu’au<strong>{dateText(receipt.until, true)}</strong></span></div>
      <p>Après cette date, un nouveau crédit sera nécessaire pour reprendre les modifications. Vos versions et vos téléchargements déjà obtenus restent disponibles.</p>
      <p className="receipt-demo">Simulation locale : aucun paiement ni appel IA n’a eu lieu.</p>
      <button className="button dark dialog-primary" onClick={() => setReceipt(null)}>J’ai compris <Check size={17}/></button>
    </Modal>}
    {renew && <Modal title="Reprendre cette photo" onClose={() => setRenew(null)} mandatory>
      <p>La période de retouche de <strong>{renew.title}</strong> est terminée.</p><div className="renew-cost"><span>Une nouvelle période de 7 jours</span><strong>1 crédit démo</strong></div><p>Toutes vos versions restent conservées. Vous pourrez continuer à télécharger vos anciennes versions sans reprendre les retouches.</p><p className="receipt-demo">Solde disponible : {library.credits} crédits de démonstration.</p><button disabled={busy || library.credits < 1} className="button dark dialog-primary" onClick={() => void doRenew()}>Utiliser 1 crédit démo <ArrowRight size={17}/></button><button className="dialog-secondary" onClick={() => setRenew(null)}>Garder mes versions actuelles</button>
    </Modal>}
    {activeLarge && <Modal title={selectedVersion(activeLarge).label} wide onClose={() => setLarge(null)}>
      <div className="large-photo"><Image src={source(activeLarge)} alt={`${activeLarge.title} — ${selectedVersion(activeLarge).label}`} fill unoptimized sizes="90vw"/></div><div className="large-photo-controls"><button className="button outlined" disabled={busy || activeLarge.versions.findIndex(item => item.id === activeLarge.selected) === 0} onClick={() => void changeProject(activeLarge.id, item => { item.selected = item.versions[Math.max(0, item.versions.findIndex(v => v.id === item.selected) - 1)].id; })}><ChevronLeft size={18}/> Précédente</button><span>{activeLarge.versions.findIndex(item => item.id === activeLarge.selected) + 1} / {activeLarge.versions.length}</span><button className="button outlined" disabled={busy || activeLarge.selected === activeLarge.versions.at(-1)?.id} onClick={() => void changeProject(activeLarge.id, item => { item.selected = item.versions[Math.min(item.versions.length - 1, item.versions.findIndex(v => v.id === item.selected) + 1)].id; })}>Suivante <ChevronRight size={18}/></button></div>
    </Modal>}
  </div>;
}

function LibraryView({ library, source, now, history, busy, onAdd, onExample, onOpen }: { library: DemoLibrary; source: Source; now: number; history: boolean; busy: boolean; onAdd: (kind: MediaKind) => void; onExample: (kind: MediaKind) => Promise<void>; onOpen: (project: DemoProject) => void }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("recent");
  const projects = library.projects.filter(item => !history || item.kind === "photo");
  const visible = projects.filter(item => (filter === "all" || filter === "saved" && !!item.saved || filter === item.kind) && `${item.title} ${item.property}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))).sort((a, b) => order === "name" ? a.title.localeCompare(b.title, "fr") : b.createdAt - a.createdAt);
  return <main className="projects-main">
    <div className="projects-heading"><div><p className="eyebrow">{history ? "CHAQUE ÉTAPE, CONSERVÉE" : "BIENVENUE DANS VOTRE ATELIER"}</p><h1>{history ? "Vos versions, par photo." : "Mes photos et vidéos"}</h1><p>{history ? "Choisissez une photo pour retrouver toutes ses versions." : "Vos intérieurs. Vos idées. Tout au même endroit."}</p></div>{projects.length > 0 && !history && <button className="button dark" onClick={() => onAdd("photo")}><Plus size={18}/> Ajouter des photos</button>}</div>
    {projects.length === 0 ? <section className="work-empty">
      <div className="empty-photo-art" aria-hidden="true"><div className="empty-photo-back"/><div className="empty-photo-front"><Image src={asset("salon-apres.png")} alt="" fill sizes="240px"/><span><Sparkles size={16}/> Tout commence ici</span></div><span className="empty-art-plus"><Plus size={27}/></span></div>
      <div className="empty-copy"><p className="section-kicker">UN NOUVEAU REGARD SUR VOTRE INTÉRIEUR</p><h2>{history ? "Votre première histoire reste à écrire." : "On commence par votre première photo ?"}</h2><p>Ajoutez les photos de votre logement. Vous pourrez les retrouver ici, puis ouvrir celle que vous voulez travailler.</p><div className="empty-main-actions"><button className="button dark" onClick={() => onAdd("photo")}><Plus size={18}/> Ajouter mes premières photos</button><button className="button outlined" onClick={() => onAdd("video")}><Film size={18}/> Ajouter une vidéo</button></div><span className="local-note"><ShieldCheck size={15}/> Vos fichiers restent sur cet appareil.</span></div>
    </section> : <>
      <div className="library-toolbar"><div className="library-filters" role="group" aria-label="Filtrer les projets">{(history ? [["all", "Toutes"], ["saved", "Gardées"]] : [["all", "Tout"], ["photo", "Photos"], ["video", "Vidéos"], ["saved", "Gardées"]]).map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? "selected" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div><label className="library-search"><Search size={17}/><input aria-label="Rechercher une photo ou un logement" placeholder="Rechercher…" value={query} onChange={event => setQuery(event.target.value)}/></label><select aria-label="Trier les projets" value={order} onChange={event => setOrder(event.target.value)}><option value="recent">Plus récents</option><option value="name">Nom A–Z</option></select></div>
      <div className="collection-title"><h2>{visible.length} {visible.length === 1 ? "projet" : "projets"}</h2>{!history && <button className="text-action" onClick={() => onAdd("video")}><Film size={16}/> Ajouter une vidéo</button>}</div>
      {visible.length ? <div className="project-cards work-project-cards">{visible.map(project => <button className="project-card" key={project.id} onClick={() => onOpen(project)}>
        <span className="project-card-preview">{project.kind === "photo" ? <Image src={source(project)} alt={project.title} fill unoptimized sizes="(max-width:650px) 90vw, (max-width:1100px) 45vw, 30vw"/> : project.sample ? <Image src={asset("visite/sejour.png")} alt="Séjour de la visite d’exemple" fill sizes="30vw"/> : <video src={source(project)} muted preload="metadata"/>}<span className="project-type">{project.kind === "photo" ? <Images size={14}/> : <Film size={14}/>} {project.kind === "photo" ? "Photo" : "Vidéo"}{project.sample ? " · exemple" : ""}</span>{project.saved && <span className="project-heart"><Heart size={16} fill="currentColor"/></span>}</span>
        <span className="project-card-copy"><small>{project.property}</small><strong>{project.title}</strong><span className="project-card-meta"><span>{project.versions.length} {project.versions.length === 1 ? "version" : "versions"}</span><span>{dateText(project.createdAt)}</span></span><span className={`project-status ${isExpired(project, now) ? "expired" : ""}`}><span className="status-dot"/>{history ? "Ouvrir l’historique" : projectStatus(project, now)}<ArrowUpRight size={16}/></span></span>
      </button>)}</div> : <div className="no-search-results"><Search size={25}/><p>Aucun projet ne correspond à cette recherche.</p><button className="text-action" onClick={() => { setFilter("all"); setQuery(""); }}>Afficher tous les projets</button></div>}
      <p className="projects-session-note"><ShieldCheck size={14}/> Enregistré dans ce navigateur · vos projets sont conservés au rechargement.</p>
    </>}
    {!history && <section className="sample-shelf"><div><p className="section-kicker">ENVIE D’EXPLORER D’ABORD ?</p><h2>Un aperçu de ce qui est possible.</h2></div><div className="sample-shelf-actions"><button disabled={busy} onClick={() => void onExample("photo")}><span className="sample-mini"><Image src={asset("salon-deco-complete.png")} alt="" fill sizes="72px"/></span><span><strong>Le salon, réinventé</strong><small>4 versions à comparer</small></span><ArrowUpRight size={19}/></button><button disabled={busy} onClick={() => void onExample("video")}><span className="sample-mini"><Image src={asset("visite/cuisine.png")} alt="" fill sizes="72px"/></span><span><strong>La visite en images</strong><small>Une maquette vidéo de 10 secondes</small></span><Film size={19}/></button></div></section>}
  </main>;
}

function PhotoEditor({ project, source, busy, now, history, onChange, onDownload, onRename, onRenew, onLarge, onNotice }: { project: DemoProject; source: Source; busy: boolean; now: number; history: boolean; onChange: (change: (project: DemoProject) => void) => Promise<boolean>; onDownload: () => void; onRename: () => void; onRenew: () => void; onLarge: () => void; onNotice: (text: string) => void }) {
  const [compare, setCompare] = useState(false);
  const [allVersions, setAllVersions] = useState(history);
  const [draft, setDraft] = useState(project.draft);
  const version = selectedVersion(project);
  const index = project.versions.findIndex(item => item.id === version.id);
  const expired = isExpired(project, now);
  return <main className="editor-main work-editor">
    <button className="text-action back-to-projects" onClick={() => go(history ? "versions" : "studio")}><ArrowLeft size={16}/> {history ? "Toutes mes photos" : "Mes photos et vidéos"}</button>
    <div className="editor-title"><div><p className="eyebrow">{project.property}</p><h1>{project.title}<button className="icon-button rename-button" onClick={onRename} aria-label="Renommer cette photo"><Pencil size={16}/></button></h1><p>{project.sample ? "Photo d’exemple · toutes les propositions sont conservées" : "Votre photo originale · conservée sur cet appareil"}</p></div><div className="editor-actions"><button className={`button outlined ${project.saved === version.id ? "is-kept" : ""}`} disabled={busy} onClick={() => void onChange(item => { item.saved = version.id; })}><Heart size={17} fill={project.saved === version.id ? "currentColor" : "none"}/>{project.saved === version.id ? "Version gardée" : "Garder"}</button><button id="photo-download" className="button dark" disabled={busy} onClick={onDownload}><Download size={17}/>{busy ? "Un instant…" : index === 0 ? "Télécharger l’original" : "Télécharger en HD"}</button></div></div>
    {project.editUntil && <div className={`edit-deadline ${expired ? "expired" : ""}`}><Clock3 size={18}/><span>{expired ? "La période de retouche est terminée. Vos versions restent disponibles." : `Retouches ouvertes jusqu’au ${dateText(project.editUntil, true)}.`}</span>{expired && <button onClick={onRenew}>Reprendre avec 1 crédit démo <ArrowRight size={15}/></button>}</div>}
    <div className="editor-grid"><section className="image-panel"><div className="result-status"><span><Check size={16}/>{version.label}</span><small>{index + 1} / {project.versions.length}</small></div>
      {compare && index > 0 ? <Compare compact before={source(project, project.versions[0])} result={source(project, version)}/> : <button className="full-result photo-zoom-button" onClick={onLarge} aria-label="Agrandir la version sélectionnée"><Image src={source(project, version)} alt={`${project.title} — ${version.label}`} fill unoptimized priority sizes="(max-width:1000px) 95vw, 60vw"/><span className="zoom-hint"><Maximize2 size={16}/> Agrandir</span></button>}
      <div className="image-bottom"><button disabled={index === 0} aria-pressed={compare} onClick={() => setCompare(!compare)}><SlidersHorizontal size={16}/>{compare ? "Photo entière" : "Comparer avec l’original"}</button><span>{version.virtual ? "Aménagement virtuel" : "Original préservé"}</span></div>
      <div className="version-gallery"><button className="history-toggle" aria-expanded={allVersions} aria-controls="photo-versions" onClick={() => setAllVersions(!allVersions)}><History size={18}/>{allVersions ? "Masquer les versions" : "Voir toutes les versions"}<span>{project.versions.length}</span></button>
        {allVersions && <div className="work-version-list" id="photo-versions">{project.versions.map((item, number) => <button key={item.id} className={item.id === version.id ? "version-row is-selected" : "version-row"} aria-pressed={item.id === version.id} disabled={busy} onClick={() => { setCompare(false); void onChange(photo => { photo.selected = item.id; }); }}><Image src={source(project, item)} alt="" width={92} height={62} unoptimized/><span><small>{number === 0 ? "LE POINT DE DÉPART" : `VERSION ${number}`}</small><strong>{item.label}</strong><span>{item.note}</span></span>{project.saved === item.id ? <Heart size={17} fill="currentColor"/> : item.id === version.id ? <CheckCircle2 size={19}/> : <ChevronRight size={18}/>}</button>)}</div>}
      </div>
    </section><aside className="edit-controls"><p className="section-kicker">VOTRE PROCHAINE IDÉE</p><h2>Qu’est-ce qu’on change ?</h2><p className="editor-description">Décrivez simplement le résultat que vous imaginez.</p>
      <form className="draft-form" onSubmit={event => { event.preventDefault(); if (isExpired(project)) { onRenew(); return; } void onChange(item => { if (isExpired(item)) throw new Error("La période de retouche vient de se terminer. Reprenez cette photo avec un crédit de démonstration pour enregistrer une nouvelle demande."); item.draft = draft.trim(); }).then(saved => { if (saved) onNotice("Votre demande est enregistrée avec cette photo. La génération automatique n’est pas encore connectée."); }); }}>
        <label htmlFor="photo-request">Votre demande</label><textarea id="photo-request" maxLength={2000} value={draft} disabled={expired} onChange={event => setDraft(event.target.value)} placeholder="Un salon plus lumineux, une déco plus chaleureuse…" rows={5}/><button className="button dark" type="submit" disabled={busy || (!expired && !draft.trim())}>{expired ? "Reprendre la retouche" : "Enregistrer ma demande"}<ArrowRight size={17}/></button>
      </form>
      {!expired && <div className="request-ideas" aria-label="Idées de retouche">{["Plus de lumière", "Retirer le désordre", "Changer toute la décoration"].map(idea => <button key={idea} onClick={() => setDraft(idea)}>{idea}<Plus size={14}/></button>)}</div>}
      <div className="generation-state"><Sparkles size={18}/><p><strong>Génération à connecter</strong>Les versions d’exemple sont déjà préparées. Vos demandes sont conservées pour la suite.</p></div>
      {version.virtual && <div className="virtual-note"><Info size={17}/><p>Ce mobilier est virtuel. Pensez à le préciser dans votre annonce.</p></div>}
      <Link className="text-action" href="/demo/aide/#credits">Comprendre les crédits et les 7 jours <ArrowUpRight size={15}/></Link>
    </aside></div>
  </main>;
}

function VideoProject({ project, source, onDownload, onRename, busy }: { project: DemoProject; source: Source; onDownload: () => void; onRename: () => void; busy: boolean }) {
  const [unreadable, setUnreadable] = useState(false);
  return <main className="video-project-main"><button className="text-action back-to-projects" onClick={() => go("studio")}><ArrowLeft size={16}/> Mes photos et vidéos</button><div className="video-title"><div><p className="eyebrow">{project.sample ? "LA VISITE EN IMAGES" : "VOTRE VIDÉO"}</p><h1>{project.title}</h1></div><button className="icon-button" aria-label="Renommer cette vidéo" onClick={onRename}><Pencil size={18}/></button></div><div className="video-preview-player"><video src={source(project)} controls playsInline preload="metadata" poster={project.sample ? asset("visite/sejour.png") : undefined} onError={() => setUnreadable(true)}/></div>{unreadable && <p className="file-error" role="alert">Ce format ne peut pas être lu par ce navigateur. Votre fichier est conservé et peut être téléchargé pour l’ouvrir sur votre appareil.</p>}
    <div className="video-project-bottom"><p>{project.sample ? "10 secondes · séjour, cuisine, chambre" : project.fileName}</p><button className="button dark" disabled={busy} onClick={onDownload}><Download size={17}/> Télécharger la vidéo</button></div>
    {project.sample && <><div className="video-coming-soon"><Film size={21}/><p>Une <strong>maquette animée à partir de photos fictives</strong>, pour explorer l’ambiance d’une visite. Le travelling IA continu reste à tester avec un moteur vidéo connecté.</p></div><section className="video-source-images"><h2>Les images de la visite</h2><div>{[["sejour", "Le séjour"], ["cuisine", "La cuisine"], ["chambre", "La chambre"]].map(([file, label]) => <figure key={file}><Image src={asset(`visite/${file}.png`)} alt={label} width={480} height={270}/><figcaption>{label}</figcaption></figure>)}</div></section></>}
    {!project.sample && <div className="video-coming-soon"><Film size={21}/><p>Votre vidéo est prête à être consultée. La génération et les outils de montage seront disponibles après connexion du moteur vidéo.</p></div>}
  </main>;
}

function Credits({ library }: { library: DemoLibrary }) {
  return <main className="work-credits"><p className="eyebrow">VOTRE COMPTE DE DÉMONSTRATION</p><h1>Simple, jusqu’au dernier crédit.</h1><p className="credits-intro">Gardez une version, puis téléchargez-la lorsque le résultat vous plaît.</p><div className="credit-summary"><div><span>Votre solde de démonstration</span><strong>{library.credits}<small>crédits</small></strong><p>Ces crédits permettent d’essayer le parcours. Ils n’ont aucune valeur monétaire.</p></div><div><span className="receipt-icon"><Sparkles size={26}/></span><h2>{library.freeUsed ? "Votre photo offerte a été utilisée." : "Votre première photo est offerte."}</h2><p>{library.freeUsed ? "Retrouvez-la dans votre atelier avec toutes ses versions." : "Le premier téléchargement d’une photo d’exemple est offert. Aucun crédit de démo ne sera déduit."}</p><button className="text-action" onClick={() => go("studio")}>Retour à l’atelier <ArrowRight size={17}/></button></div></div><div className="credit-rules"><article><Download size={23}/><h2>1 photo, 1 crédit</h2><p>Le crédit est utilisé au premier téléchargement HD. Garder une version ne débite rien.</p></article><article><Clock3 size={23}/><h2>7 jours pour ajuster</h2><p>La période commence au premier téléchargement. Après l’échéance, reprendre les retouches demande un nouveau crédit.</p></article><article><History size={23}/><h2>Tout reste à vous</h2><p>Les anciennes versions restent disponibles. Les télécharger à nouveau ne consomme pas de nouveau crédit.</p></article></div><section className="credit-ledger"><div className="collection-title"><h2>Votre activité</h2><span>{library.events.length} {library.events.length === 1 ? "opération" : "opérations"}</span></div>{library.events.length ? library.events.map(event => <div className="credit-event" key={event.id}><span><strong>{event.label}</strong><small>{event.project} · {dateText(event.at, true)}</small></span><b>{event.amount === 0 ? "Offerte" : `${event.amount} crédit`}</b></div>) : <p>Aucun crédit utilisé. Votre premier projet vous attend.</p>}</section><div className="credit-pricing-link"><p>À la recherche des prix ? Les formules sont sur la page publique des tarifs.</p><Link href="/demo/tarifs/" className="button outlined">Découvrir les tarifs <ArrowUpRight size={17}/></Link></div><p className="credits-footnote">Les achats et la facturation réelle ne sont pas activés dans cette démonstration.</p></main>;
}

function ImportDialog({ kind, onClose, onImport }: { kind: MediaKind; onClose: () => void; onImport: (files: File[]) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  async function receive(files: File[]) {
    if (!files.length || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await onImport(files); } catch (cause) { setError(storageError(cause)); } finally { lock.current = false; setBusy(false); }
  }
  return <Modal title={kind === "photo" ? "Ajoutez vos photos." : "Ajoutez vos vidéos."} mandatory={busy} onClose={() => { if (!busy) onClose(); }}><p>Choisissez les fichiers de votre logement. Vous pourrez ouvrir chaque projet séparément.</p><div className={`import-dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void receive(Array.from(event.dataTransfer.files)); }}><span className="import-icon">{kind === "photo" ? <Images size={30}/> : <Film size={30}/>}</span><strong>{busy ? "Enregistrement sur votre appareil…" : "Glissez vos fichiers ici"}</strong><span>ou</span><button className="button dark" disabled={busy} onClick={() => input.current?.click()}><Upload size={17}/>{kind === "photo" ? "Choisir mes photos" : "Choisir mes vidéos"}</button><small>{kind === "photo" ? "JPG, PNG, WebP · 20 Mo par photo" : "MP4, MOV, WebM · 100 Mo par vidéo"}<br/>Jusqu’à 20 fichiers à la fois</small><input ref={input} type="file" multiple hidden accept={kind === "photo" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm"} onChange={event => { void receive(Array.from(event.target.files || [])); event.target.value = ""; }}/></div>{error && <p role="alert" className="file-error">{error}</p>}<p className="local-note"><ShieldCheck size={16}/> Enregistré dans ce navigateur, sans envoi à un serveur.</p><p className="import-disclosure">Gardez aussi vos originaux : effacer les données du navigateur efface cette sauvegarde locale. Le site et l’aperçu mobile ont des espaces séparés.</p></Modal>;
}

function RenameDialog({ project, onClose, onSave }: { project: DemoProject; onClose: () => void; onSave: (title: string, property: string) => Promise<void> }) {
  const [title, setTitle] = useState(project.title);
  const [property, setProperty] = useState(project.property);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <Modal title="Les petits détails qui aident." onClose={onClose}><form className="rename-form" onSubmit={async event => { event.preventDefault(); if (!title.trim() || !property.trim() || busy) return; setBusy(true); try { await onSave(title.trim(), property.trim()); } catch (cause) { setError(storageError(cause)); setBusy(false); } }}><label>Nom du projet<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} required placeholder="Ex. : Salon, lumière du matin"/></label><label>Logement<input value={property} onChange={event => setProperty(event.target.value)} maxLength={100} required placeholder="Ex. : Appartement Lumière"/></label>{error && <p className="file-error" role="alert">{error}</p>}<button type="submit" className="button dark dialog-primary" disabled={busy || !title.trim() || !property.trim()}>Enregistrer <Check size={17}/></button></form></Modal>;
}

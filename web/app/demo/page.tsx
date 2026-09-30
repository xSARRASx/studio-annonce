"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Film, FolderOpen, Heart, History, Images, Info, Maximize2, Menu, Pencil, Plus,  ShieldCheck, SlidersHorizontal, Smartphone, Sparkles, Upload, Wallet, X } from "lucide-react";
import Landing from "./landing";
import { Brand, Compare, Modal } from "./studio-parts";
import { asset, beginDownload, dateText, importedProjects, isExpired, projectFrom, renewProject, sampleProject, storageError, type DemoProject, type DemoVersion, type MediaKind } from "./library";
import { useLibrary } from "./use-library";
import { Billing, CreateView, PhotoList } from "./studio-screens";
import { VideoPlanner } from "./video-planner";
import { ImagePlanner } from "./image-planner";
import { BriefAssistant } from "./brief-assistant";
import { VideoFrames } from "./video-frames";
import { CreationHub } from "./creation-hub";
import "./studio.css";
import "./workspace.css";

type Source = (project: DemoProject, version?: DemoVersion) => string;
type Receipt = { title: string; free: boolean; until: number; renewal?: boolean };
const go = (hash: string) => { window.location.hash = hash; window.scrollTo({ top: 0 }); };
const selectedVersion = (project: DemoProject) => project.versions.find(item => item.id === project.selected) || project.versions[0];
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export default function StudioDemo() {
  const { library, loading, error, update, source, refresh } = useLibrary();
  const [route, setRoute] = useState("");
  const [visitedTools, setVisitedTools] = useState<string[]>([]);
  const [photoCreationId, setPhotoCreationId] = useState("");
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
    const read = () => {
      const next = window.location.hash.slice(1);
      const [tool, propertyId = ""] = next.split("/");
      setRoute(next); setMenu(false); setNotice("");
      if (["nouvelle", "creer-image", "visite", "video-photos"].includes(tool)) setVisitedTools(previous => previous.includes(tool) ? previous : [...previous, tool]);
      if (tool === "nouvelle" && propertyId) setPhotoCreationId(propertyId);
    };
    queueMicrotask(read);
    window.addEventListener("hashchange", read);
    const tick = () => setNow(Date.now());
    const clock = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => { window.removeEventListener("hashchange", read); window.clearInterval(clock); window.removeEventListener("focus", tick); document.removeEventListener("visibilitychange", tick); };
  }, []);
  const [ecran, id] = route.split("/");
  // Conserver les anciennes adresses et les liens vers les créations existantes.
  const screen = ({ versions: "studio", historique: "photo", credits: "facturation" } as Record<string, string>)[ecran] || ecran;
  const creating = ["creer", "nouvelle", "creer-image", "video-photos", "visite"].includes(screen);
  const screenTitle = ({ creer: "Créer", nouvelle: "Retoucher une photo", "creer-image": "Créer une image", "video-photos": "Vidéo → photos", visite: "Photos → vidéo", facturation: "Facturation", photo: "Votre photo", video: "Votre vidéo" } as Record<string, string>)[screen] || "Mes créations";
  const inStudio = creating || ["studio", "photo", "video", "facturation"].includes(screen);
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
          <button className={`nav-create ${creating ? "active" : ""}`} aria-current={creating ? "page" : undefined} onClick={() => nav("creer")}><Plus size={19}/> Créer</button>
          <button className={["studio", "photo", "video"].includes(screen) ? "active" : ""} aria-current={["studio", "photo", "video"].includes(screen) ? "page" : undefined} onClick={() => nav("studio")}><FolderOpen size={19}/> Mes créations <span>{library.projects.filter(p => !p.sample).length || ""}</span></button>
          <button className={screen === "facturation" ? "active" : ""} aria-current={screen === "facturation" ? "page" : undefined} onClick={() => nav("facturation")}><Wallet size={19}/> Facturation</button>
        </nav>
        <div className="studio-sidebar-note"><ShieldCheck size={19}/><p>Votre espace à vous.<small>Projets enregistrés dans ce navigateur.</small></p></div>
        <div className="sidebar-bottom"><Link className="mobile-preview-link" href="/mobile-preview/"><Smartphone size={17}/> L’aperçu mobile <ArrowUpRight size={14}/></Link><Link className="studio-help-link" href="/demo/aide/">Une question ? Consulter l’aide</Link><button className="back-site" onClick={() => nav("")}><ArrowLeft size={15}/> Retour au site</button></div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header"><button className="mobile-menu icon-button" onClick={() => setMenu(!menu)} aria-label="Ouvrir le menu"><Menu/></button><div className="breadcrumb">{creating && screen !== "creer" ? <button onClick={() => go("creer")}>Créer</button> : <button onClick={() => go("studio")}>Mon studio</button>}<ChevronRight size={13}/><strong>{screenTitle}</strong></div><button className="workspace-credit" onClick={() => nav("facturation")}><span className="status-dot"/>{library.credits} crédits démo</button></header>
        {notice && <div className="notice work-notice" role="status"><Info size={18}/><p>{notice}</p><button aria-label="Fermer le message" onClick={() => setNotice("")}><X size={18}/></button></div>}
        {error ? <main className="projects-main"><div className="storage-failure" role="alert"><Info size={28}/><h1>Votre espace est préservé.</h1><p>{error}</p><button className="button dark" onClick={() => void refresh()}>Réessayer</button></div></main> : loading ? <main className="projects-main"><div className="library-loading" role="status">Ouverture de votre studio…</div></main> : <>
          {screen === "studio" && <PhotoList library={library} source={source} now={now} busy={busy} onCreate={() => go("creer")} onAddPhoto={logement => go(`nouvelle/${encodeURIComponent(logement)}`)} onExample={kind => void example(kind)} onOpen={item => go(`${item.kind}/${item.id}`)}/>}
          {screen === "creer" && <CreationHub onChoose={go} onImportVideo={() => setUpload("video")}/>}
          {visitedTools.includes("nouvelle") && <div hidden={screen !== "nouvelle"}><CreateView key={photoCreationId || "nouvelle"} library={library} busy={busy} initial={photoCreationId ? decodeURIComponent(photoCreationId) : undefined} onCancel={() => go("creer")} onImagine={() => go("creer-image")} onExample={() => void example("photo")} onCreate={async (files, logement, demande) => {
            const projects = await importedProjects(files, "photo");
            for (const item of projects) { item.property = logement; item.draft = demande; }
            await update(state => {
              const total = [...state.projects, ...projects].reduce((sum, item) => sum + (item.file?.size || 0), 0);
              if (total > 300 * 1024 * 1024) throw new Error("Cette démo conserve jusqu’à 300 Mo de fichiers. Vos projets existants sont préservés ; choisissez des photos plus légères.");
              state.projects.unshift(...projects);
            });
            go(projects.length === 1 ? `photo/${projects[0].id}` : "studio");
            setVisitedTools(tools => tools.filter(tool => tool !== "nouvelle"));
            setPhotoCreationId("");
            setNotice(projects.length === 1 ? `Retouche créée dans « ${logement} ».` : `${projects.length} retouches créées dans « ${logement} ».`);
          }}/></div>}
          {visitedTools.includes("visite") && <div hidden={screen !== "visite"}>
            <VideoPlanner library={library} source={source} onBack={() => go("creer")} onAddPhotos={async (files, property) => {
              const projects = await importedProjects(files, "photo");
              for (const item of projects) item.property = property;
              await update(state => {
                const total = [...state.projects, ...projects].reduce((sum, item) => sum + (item.file?.size || 0), 0);
                if (total > 300 * 1024 * 1024) throw new Error("L’espace de démonstration est limité à 300 Mo. Choisissez des photos plus légères.");
                state.projects.unshift(...projects);
              });
              return projects;
            }}/>
          </div>}
          {visitedTools.includes("creer-image") && <div hidden={screen !== "creer-image"}><ImagePlanner onBack={() => go("creer")} onPhoto={() => go("nouvelle")}/></div>}
          {visitedTools.includes("video-photos") && <div hidden={screen !== "video-photos"}>
            <VideoFrames library={library} busy={busy} active={screen === "video-photos"} onCancel={() => go("creer")} onCreate={async (files, logement, videoName, request) => {
            const projects = await importedProjects(files, "photo");
            for (const item of projects) { item.property = logement; item.draft = request || `Image extraite de la vidéo « ${videoName} ».`; }
            await update(state => {
              const total = [...state.projects, ...projects].reduce((sum, item) => sum + (item.file?.size || 0), 0);
              if (total > 300 * 1024 * 1024) throw new Error("Cette démo conserve jusqu’à 300 Mo de fichiers. Vos projets existants sont préservés ; choisissez moins d’images.");
              state.projects.unshift(...projects);
            });
            go(projects.length === 1 ? `photo/${projects[0].id}` : "studio");
            setVisitedTools(tools => tools.filter(tool => tool !== "video-photos"));
            setNotice(`${projects.length} ${projects.length > 1 ? "photos extraites" : "photo extraite"} de la vidéo et rangées dans « ${logement} ».`);
            }}/>
          </div>}
          {screen === "photo" && project && <PhotoEditor key={project.id} project={project} source={source} busy={busy} now={now} onChange={change => changeProject(project.id, change)} onDownload={() => void download(project)} onRename={() => setRename(project)} onRenew={() => setRenew(project)} onLarge={() => setLarge(project)} onNotice={setNotice}/>}
          {screen === "video" && project && <VideoProject key={project.id} project={project} source={source} onDownload={() => void download(project)} onRename={() => setRename(project)} busy={busy}/>}
          {["photo", "video"].includes(screen) && !project && <main className="projects-main"><div className="storage-failure"><FolderOpen size={30}/><h1>Retrouvez vos projets.</h1><p>Ce lien ne correspond pas à un projet enregistré dans ce navigateur.</p><button className="button dark" onClick={() => go("studio")}>Voir mes créations</button></div></main>}
          {screen === "facturation" && <Billing library={library} onCreate={() => go("nouvelle")}/>}
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
      <p>La correction incluse, si elle reste disponible, est utilisable pendant <strong>7 jours après le téléchargement</strong>.</p>
      <div className="receipt-deadline"><Clock3 size={21}/><span>Retouches ouvertes jusqu’au<strong>{dateText(receipt.until, true)}</strong></span></div>
      <p>Chaque correction supplémentaire coûte 1 crédit et donne droit à une seule génération. Vos versions et vos téléchargements déjà obtenus restent disponibles.</p>
      <p className="receipt-demo">Simulation locale : aucun paiement ni appel IA n’a eu lieu.</p>
      <button className="button dark dialog-primary" onClick={() => setReceipt(null)}>J’ai compris <Check size={17}/></button>
    </Modal>}
    {renew && <Modal title="Reprendre cette photo" onClose={() => setRenew(null)} mandatory>
      <p>La période de retouche de <strong>{renew.title}</strong> est terminée.</p><div className="renew-cost"><span>Une correction, valable 7 jours</span><strong>1 crédit démo</strong></div><p>Toutes vos versions restent conservées. Vous pourrez continuer à télécharger vos anciennes versions sans reprendre les retouches.</p><p className="receipt-demo">Solde disponible : {library.credits} crédits de démonstration.</p><button disabled={busy || library.credits < 1} className="button dark dialog-primary" onClick={() => void doRenew()}>Utiliser 1 crédit démo <ArrowRight size={17}/></button><button className="dialog-secondary" onClick={() => setRenew(null)}>Garder mes versions actuelles</button>
    </Modal>}
    {activeLarge && <Modal title={selectedVersion(activeLarge).label} wide onClose={() => setLarge(null)}>
      <div className="large-photo"><Image src={source(activeLarge)} alt={`${activeLarge.title} — ${selectedVersion(activeLarge).label}`} fill unoptimized sizes="90vw"/></div><div className="large-photo-controls"><button className="button outlined" disabled={busy || activeLarge.versions.findIndex(item => item.id === activeLarge.selected) === 0} onClick={() => void changeProject(activeLarge.id, item => { item.selected = item.versions[Math.max(0, item.versions.findIndex(v => v.id === item.selected) - 1)].id; })}><ChevronLeft size={18}/> Précédente</button><span>{activeLarge.versions.findIndex(item => item.id === activeLarge.selected) + 1} / {activeLarge.versions.length}</span><button className="button outlined" disabled={busy || activeLarge.selected === activeLarge.versions.at(-1)?.id} onClick={() => void changeProject(activeLarge.id, item => { item.selected = item.versions[Math.min(item.versions.length - 1, item.versions.findIndex(v => v.id === item.selected) + 1)].id; })}>Suivante <ChevronRight size={18}/></button></div>
    </Modal>}
  </div>;
}

function PhotoEditor({ project, source, busy, now, onChange, onDownload, onRename, onRenew, onLarge, onNotice }: { project: DemoProject; source: Source; busy: boolean; now: number; onChange: (change: (project: DemoProject) => void) => Promise<boolean>; onDownload: () => void; onRename: () => void; onRenew: () => void; onLarge: () => void; onNotice: (text: string) => void }) {
  const [compare, setCompare] = useState(false);
  const [allVersions, setAllVersions] = useState(true);
  const [draft, setDraft] = useState(project.draft);
  const version = selectedVersion(project);
  const index = project.versions.findIndex(item => item.id === version.id);
  const expired = isExpired(project, now);
  return <main className="editor-main work-editor">
    <button className="text-action back-to-projects" onClick={() => go("studio")}><ArrowLeft size={16}/> Mes créations</button>
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
        <label htmlFor="photo-request">Votre demande</label><textarea id="photo-request" maxLength={20000} value={draft} disabled={expired} onChange={event => setDraft(event.target.value)} placeholder="Un salon plus lumineux, une déco plus chaleureuse…" rows={5}/>{!expired && <BriefAssistant kind="photo" request={draft} onUse={setDraft}/>}<button className="button dark" type="submit" disabled={busy || (!expired && !draft.trim())}>{expired ? "Reprendre la retouche" : "Enregistrer ma demande"}<ArrowRight size={17}/></button>
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
  return <main className="video-project-main"><button className="text-action back-to-projects" onClick={() => go("studio")}><ArrowLeft size={16}/> Mes créations</button><div className="video-title"><div><p className="eyebrow">{project.sample ? "LA VISITE EN IMAGES" : "VOTRE VIDÉO"}</p><h1>{project.title}</h1></div><button className="icon-button" aria-label="Renommer cette vidéo" onClick={onRename}><Pencil size={18}/></button></div><div className="video-preview-player"><video src={source(project)} controls playsInline preload="metadata" poster={project.sample ? asset("visite/sejour.png") : undefined} onError={() => setUnreadable(true)}/></div>{unreadable && <p className="file-error" role="alert">Ce format ne peut pas être lu par ce navigateur. Votre fichier est conservé et peut être téléchargé pour l’ouvrir sur votre appareil.</p>}
    <div className="video-project-bottom"><p>{project.sample ? "10 secondes · séjour, cuisine, chambre" : project.fileName}</p><button className="button dark" disabled={busy} onClick={onDownload}><Download size={17}/> Télécharger la vidéo</button></div>
    {project.sample && <><div className="video-coming-soon"><Film size={21}/><p>Une <strong>maquette animée à partir de photos fictives</strong>, pour explorer l’ambiance d’une visite. Le travelling IA continu reste à tester avec un moteur vidéo connecté.</p></div><section className="video-source-images"><h2>Les images de la visite</h2><div>{[["sejour", "Le séjour"], ["cuisine", "La cuisine"], ["chambre", "La chambre"]].map(([file, label]) => <figure key={file}><Image src={asset(`visite/${file}.png`)} alt={label} width={480} height={270}/><figcaption>{label}</figcaption></figure>)}</div></section></>}
    {!project.sample && <div className="video-coming-soon"><Film size={21}/><p>Votre vidéo est prête à être consultée. La génération et les outils de montage seront disponibles après connexion du moteur vidéo.</p></div>}
  </main>;
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

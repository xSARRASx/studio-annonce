"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Info } from "lucide-react";
import { api, type Logement } from "@/lib/api";
import { loadProjects, photoProject, projectSource, summaryProjects } from "@/lib/studio-library";
import { envoyerPhoto } from "@/lib/photo-upload";
import { useStudioAccount } from "@/components/studio-account";
import { CreationLimits } from "@/components/creation-limits";
import { CreateView, PhotoList } from "../demo/studio-screens";
import { CreationHub } from "../demo/creation-hub";
import { ImagePlanner } from "../demo/image-planner";
import { VideoPlanner } from "../demo/video-planner";
import { VideoFrames } from "../demo/video-frames";
import { Compare, Modal } from "../demo/studio-parts";
import { sampleProject, type DemoLibrary, type DemoProject } from "../demo/library";

export default function MonStudio() {
  const router = useRouter();
  const { compte, sante, screen } = useStudioAccount();
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [now, setNow] = useState(Date.now);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [property, setProperty] = useState("");
  const [example, setExample] = useState<"photo" | "video" | null>(null);
  const [exampleVersion, setExampleVersion] = useState("decor");
  const [visited, setVisited] = useState<string[]>([]);
  const homes = useRef<Logement[]>([]);
  const [homeList, setHomeList] = useState<Logement[]>([]);
  const uploaded = useRef(new WeakMap<File, DemoProject>());
  const importing = useRef(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);

  useEffect(() => {
    let active = true;
    api<Logement[]>("/logements").then(logements => {
      if (!active) return;
      homes.current = logements; setHomeList(logements); setProjects(summaryProjects(logements)); setLoading(false); setError("");
      if (logements.some(home => home.photos.some(photo => !photo.versions))) void loadProjects(logements).then(creations => {
        if (active) setProjects(previous => [...creations, ...previous.filter(project => !creations.some(detail => detail.id === project.id))]);
      }).catch(() => { /* La liste légère reste utilisable si un détail tarde. */ });
    }).catch(e => { if (active) { setError(e.message); setLoading(false); } });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    if (["nouvelle", "creer-image", "visite", "video-photos"].includes(screen)) {
      queueMicrotask(() => setVisited(previous => previous.includes(screen) ? previous : [...previous, screen]));
    }
  }, [screen]);

  const library: DemoLibrary = { schema: 1, credits: compte.solde, freeUsed: !compte.photo_offerte_disponible, events: [], projects };
  const go = (hash: string) => { window.location.hash = hash === "studio" ? "" : hash; window.scrollTo({ top: 0 }); };

  async function addPhotos(files: File[], logement: string, draft = "", onProgress?: (project: DemoProject) => void) {
    if (importing.current) throw new Error("Un envoi est déjà en cours.");
    importing.current = true; setBusy(true); setError("");
    const added: DemoProject[] = [];
    const failures: string[] = [];
    try {
      let home = homes.current.find(h => h.nom === logement);
      if (!home) {
        home = await api<Logement>("/logements", { method: "POST", body: JSON.stringify({ nom: logement }) });
        homes.current.push(home);
        setHomeList([...homes.current]);
      }
      for (const file of files) {
        try {
        const existing = uploaded.current.get(file);
        if (existing) { added.push(existing); onProgress?.(existing); continue; }
        if (file.size > 30 * 1024 * 1024) throw new Error("Choisissez une photo de moins de 30 Mo.");
        const photo = await envoyerPhoto(file, home.id, draft);
        const project = photoProject(photo, home);
        home.photos.push({ ...photo, gardee: !!photo.version_gardee, creditee: !!photo.credite_le });
        uploaded.current.set(file, project); added.push(project);
        if (draft) {
          try { sessionStorage.setItem(`studio:${compte.id}:photo:${photo.id}:draft`, draft); }
          catch { /* La photo reste disponible même si le navigateur refuse le brouillon. */ }
        }
        setProjects(previous => [project, ...previous]);
        onProgress?.(project);
        } catch (cause) { failures.push(`${file.name} : ${(cause as Error).message}`); }
      }
      if (failures.length) throw new Error(failures.join(" · "));
      return added;
    } catch (e) {
      const message = (e as Error).message;
      if (added.length) throw new Error(`${added.length} photo(s) déjà enregistrée(s) dans Mes créations. ${message}`);
      throw e;
    } finally {
      setBusy(false); importing.current = false;
      window.dispatchEvent(new Event("studio:credits-updated"));
    }
  }

  const sample = sampleProject(example || "photo");
  const sampleSelected = sample.versions.find(v => v.id === exampleVersion) || sample.versions.at(-1)!;
  if (loading) return <main className="st-main"><p role="status">Chargement de vos créations…</p></main>;
  if (error && !projects.length) return <main className="st-main"><p role="alert">{error}</p><button className="button outlined" onClick={() => { setLoading(true); setReload(r => r + 1); }}>Réessayer</button></main>;

  return <>
    {error && <div className="connected-service" role="alert"><Info size={17}/><p>{error}</p></div>}
    {["studio", "nouvelle", "creer-image"].includes(screen) && <div className="connected-limits"><CreationLimits limites={compte.limites}/></div>}
    {screen === "visite" && <div className="connected-limits"><CreationLimits limites={compte.limites} kind="video"/></div>}
    {screen === "studio" && <PhotoList library={library} source={projectSource} now={now} busy={busy} onCreate={() => go("creer")} onAddPhoto={name => { setProperty(name); go("nouvelle"); }} onManageProperty={photoId => { const home = homes.current.find(item => item.photos.some(photo => photo.id === photoId)); if (home) router.push(`/app/logement/?id=${home.id}`); }} onExample={setExample} onOpen={project => router.push(`/app/photo/?id=${project.id}`)}/>}
    {screen === "studio" && homeList.length > 0 && <details className="st-library-archives"><summary>Gérer mes logements et mes archives</summary><div>{homeList.map(home => <Link key={home.id} href={`/app/logement/?id=${home.id}&archives=true`}>{home.nom} · gérer les photos et archives →</Link>)}</div></details>}
    {screen === "creer" && <CreationHub onChoose={go} onImportPhotos={() => router.push("/app/importer/")}/>}
    {screen === "nouvelle" && sante && !sante.retouche_disponible && <div className="connected-service" role="status"><Info size={17}/><p>Vous pouvez préparer votre photo. La retouche IA est momentanément indisponible ; aucun crédit n’est consommé.</p></div>}
    {visited.includes("nouvelle") && <div hidden={screen !== "nouvelle"}><CreateView maxRequest={4000} key={property} library={library} busy={busy} initial={property} onCancel={() => go("creer")} onImagine={() => go("creer-image")} onBatch={() => router.push("/app/importer/")} onExample={() => setExample("photo")} onCreate={async (files, home, draft) => {
      const added = await addPhotos(files, home, draft);
      router.push(`/app/photo/?id=${added[0].id}`);
    }}/></div>}
    {visited.includes("creer-image") && <div hidden={screen !== "creer-image"}><ImagePlanner storageKey={`studio:${compte.id}:image-plan`} onBack={() => go("creer")} onPhoto={() => go("nouvelle")}/></div>}
    {visited.includes("visite") && <div hidden={screen !== "visite"}><VideoPlanner connected={compte.gratuit_illimite ? { enabled: !!sante?.video_disponible } : { enabled: false }} storageKey={`studio:${compte.id}:video-plan`} library={library} source={projectSource} onBack={() => go("creer")} onAddPhotos={(files, home, progress) => addPhotos(files, home, "", progress)}/></div>}
    {visited.includes("video-photos") && <div hidden={screen !== "video-photos"}><VideoFrames library={library} busy={busy} active={screen === "video-photos"} onCancel={() => go("creer")} onCreate={async (files, home, _name, request) => {
      await addPhotos(files, home, request); setVisited(previous => previous.filter(tool => tool !== "video-photos")); go("studio");
    }}/></div>}
    {example && <Modal title={example === "photo" ? "Le salon — exemple" : "La visite — exemple"} wide onClose={() => setExample(null)}><div className="connected-example">
      {example === "photo" ? <><Compare before={sample.versions[0].src} result={sampleSelected.src}/><div className="connected-example-options">{sample.versions.slice(1).map(v => <button key={v.id} aria-pressed={sampleSelected.id === v.id} onClick={() => setExampleVersion(v.id)}>{v.label}</button>)}</div></> : <video controls playsInline src={sample.versions[0].src}/>}
      <p>Un exemple pour découvrir le rendu. Vos propres photos restent dans Mes créations. Aucun crédit utilisé.</p>
    </div></Modal>}
  </>;
}

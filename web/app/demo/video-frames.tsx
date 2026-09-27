"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock3, Film, Images, Plus, ShieldCheck, Upload, X } from "lucide-react";
import { logementsDe } from "./studio-screens";
import { storageError, type DemoLibrary } from "./library";
import { BriefAssistant } from "./brief-assistant";
import "./video-frames.css";

type ExtractedFrame = { id: string; time: number; file: File; url: string; selected: boolean };

function timeLabel(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function suggestedTimes(duration: number) {
  const ratios = [.08, .24, .4, .56, .72, .88];
  return ratios.map(ratio => Math.min(Math.max(.01, duration * ratio), Math.max(.01, duration - .04)));
}

async function seek(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < .02 && video.readyState >= 2) return;
  await new Promise<void>((resolve, reject) => {
    const done = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("Cette image de la vidéo ne peut pas être lue.")); };
    const cleanup = () => { video.removeEventListener("seeked", done); video.removeEventListener("error", failed); };
    video.addEventListener("seeked", done);
    video.addEventListener("error", failed);
    video.currentTime = time;
  });
}

async function frameAt(video: HTMLVideoElement, time: number, index: number) {
  await seek(video, time);
  if (!video.videoWidth || !video.videoHeight) throw new Error("La vidéo ne contient aucune image lisible.");
  const scale = Math.min(1, 2048 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Votre navigateur ne permet pas d’extraire cette image.");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .94));
  if (!blob?.size) throw new Error("L’image n’a pas pu être créée. Essayez un autre moment de la vidéo.");
  const name = `photo-video-${String(index + 1).padStart(2, "0")}-${timeLabel(time).replace(":", "-")}.jpg`;
  const file = new File([blob], name, { type: "image/jpeg", lastModified: Date.now() + index });
  return { id: crypto.randomUUID(), time, file, url: URL.createObjectURL(file), selected: true } satisfies ExtractedFrame;
}

export function VideoFrames({ library, busy, onCancel, onCreate }: {
  library: DemoLibrary;
  busy: boolean;
  onCancel: () => void;
  onCreate: (files: File[], logement: string, videoName: string, request: string) => Promise<void>;
}) {
  const logements = logementsDe(library, false);
  const [choix, setChoix] = useState(logements[0] || "__nouveau");
  const [nouveau, setNouveau] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [request, setRequest] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());
  const logement = choix === "__nouveau" ? nouveau.trim() : choix;
  const selected = frames.filter(frame => frame.selected);

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    for (const url of urls.current) URL.revokeObjectURL(url);
  }, [videoUrl]);

  function clearFrames() {
    setFrames(current => {
      for (const frame of current) { URL.revokeObjectURL(frame.url); urls.current.delete(frame.url); }
      return [];
    });
  }

  function choose(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/") || file.size > 500 * 1024 * 1024) {
      setError("Choisissez une vidéo MP4, MOV ou WebM de moins de 500 Mo.");
      return;
    }
    clearFrames();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file); setVideoUrl(URL.createObjectURL(file)); setDuration(0); setError("");
  }

  async function extractSuggested() {
    if (!video.current || !duration || working) return;
    setWorking(true); setError(""); clearFrames();
    try {
      const extracted: ExtractedFrame[] = [];
      for (const [index, time] of suggestedTimes(duration).entries()) extracted.push(await frameAt(video.current, time, index));
      for (const frame of extracted) urls.current.add(frame.url);
      setFrames(extracted);
    } catch (cause) { setError(storageError(cause)); }
    finally { setWorking(false); }
  }

  async function captureCurrent() {
    if (!video.current || !duration || working) return;
    const time = video.current.currentTime;
    if (frames.some(frame => Math.abs(frame.time - time) < .12)) { setError("Cette image est déjà dans votre sélection."); return; }
    setWorking(true); setError("");
    try {
      const frame = await frameAt(video.current, time, frames.length);
      urls.current.add(frame.url);
      setFrames(current => [...current, frame].sort((a, b) => a.time - b.time));
    } catch (cause) { setError(storageError(cause)); }
    finally { setWorking(false); }
  }

  async function save() {
    if (!selected.length || !logement || working || busy || !videoFile) return;
    setWorking(true); setError("");
    try { await onCreate(selected.map(frame => frame.file), logement, videoFile.name, request.trim()); }
    catch (cause) { setError(storageError(cause)); setWorking(false); }
  }

  return <main className="st-main vf-main">
    <button className="text-action st-back" onClick={onCancel}>← Mes photos</button>
    <p className="eyebrow">PHOTOS DEPUIS UNE VIDÉO</p>
    <h1>Choisissez les meilleurs instants.</h1>
    <p className="vf-intro">Ajoutez une vidéo du logement. Le studio en extrait six images, puis vous gardez seulement celles qui mettent les pièces en valeur.</p>

    <section className="vf-step"><div className="vf-step-title"><span>1</span><div><h2>Dans quel logement ?</h2><p>Les photos seront rangées avec les autres.</p></div></div>
      <div className="st-homes" role="radiogroup" aria-label="Logement">
        {logements.map(name => <button type="button" role="radio" aria-checked={choix === name} key={name} onClick={() => setChoix(name)}>{name}</button>)}
        <button type="button" role="radio" aria-checked={choix === "__nouveau"} onClick={() => setChoix("__nouveau")}><Plus size={16}/> Nouveau logement</button>
      </div>
      {choix === "__nouveau" && <label className="st-field">Nom du logement<input value={nouveau} onChange={event => setNouveau(event.target.value)} maxLength={100} placeholder="Ex. : Villa avec piscine"/></label>}
    </section>

    <section className="vf-step"><div className="vf-step-title"><span>2</span><div><h2>Ajoutez votre vidéo</h2><p>Le traitement reste sur cet appareil.</p></div></div>
      {!videoUrl ? <button className="vf-drop" onClick={() => input.current?.click()}><span><Upload size={26}/></span><strong>Choisir une vidéo</strong><small>MP4, MOV ou WebM · 500 Mo maximum</small></button> : <div className="vf-video-wrap">
        <video ref={video} src={videoUrl} controls playsInline preload="metadata" onLoadedMetadata={event => { const value = event.currentTarget.duration; setDuration(Number.isFinite(value) ? value : 0); }} onError={() => setError("Cette vidéo ne peut pas être lue par votre navigateur.")}/>
        <div className="vf-video-meta"><span><Film size={16}/><strong>{videoFile?.name}</strong>{duration > 0 && <small>{timeLabel(duration)}</small>}</span><button aria-label="Retirer la vidéo" onClick={() => { clearFrames(); if (videoUrl) URL.revokeObjectURL(videoUrl); setVideoUrl(""); setVideoFile(null); setDuration(0); }}><X size={16}/> Changer</button></div>
        <div className="vf-video-actions"><button className="button dark" disabled={!duration || working} onClick={() => void extractSuggested()}><Images size={17}/>{working ? "Extraction…" : frames.length ? "Recréer 6 propositions" : "Extraire 6 photos"}</button><button className="button outlined" disabled={!duration || working} onClick={() => void captureCurrent()}><Clock3 size={17}/> Ajouter l’image affichée</button></div>
      </div>}
      <input ref={input} hidden type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={event => { choose(event.target.files?.[0]); event.target.value = ""; }}/>
    </section>

    {videoFile && <section className="vf-step"><div className="vf-step-title"><span>3</span><div><h2>Quel résultat voulez-vous ?</h2><p>Écrivez librement, puis demandez un peu d’aide si vous le souhaitez.</p></div></div>
      <label className="vf-request">Votre demande<textarea value={request} onChange={event => setRequest(event.target.value)} maxLength={20000} rows={4} placeholder="Ex. : rends les images plus lumineuses, enlève les objets qui traînent et garde un rendu naturel pour Airbnb…"/></label>
      <BriefAssistant kind="photo" request={request} onUse={setRequest}/>
      <p className="vf-request-note">Ce brief sera appliqué à toutes les photos choisies. Vous pourrez ensuite ajuster chaque photo séparément.</p>
    </section>}

    {frames.length > 0 && <section className="vf-step"><div className="vf-step-title"><span>4</span><div><h2>Gardez les bonnes photos</h2><p>Cliquez sur une image pour la sélectionner ou l’enlever.</p></div><strong className="vf-selection-count">{selected.length} / {frames.length}</strong></div>
      <div className="vf-grid">{frames.map(frame => <button key={frame.id} className={`vf-frame ${frame.selected ? "selected" : ""}`} aria-pressed={frame.selected} onClick={() => setFrames(current => current.map(item => item.id === frame.id ? { ...item, selected: !item.selected } : item))}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frame.url} alt={`Image à ${timeLabel(frame.time)}`}/><span className="vf-frame-time">{timeLabel(frame.time)}</span><span className="vf-check">{frame.selected ? <Check size={16}/> : <Plus size={16}/>}</span>
      </button>)}</div>
      <div className="vf-save"><button className="button dark st-big" disabled={!selected.length || !logement || working || busy} onClick={() => void save()}>{working || busy ? "Enregistrement…" : `Ajouter ${selected.length} ${selected.length > 1 ? "photos" : "photo"} à « ${logement || "…"} »`}</button><p><ShieldCheck size={16}/> La vidéo reste locale. Les images sont enregistrées dans ce navigateur.</p></div>
    </section>}
    {error && <p className="st-error" role="alert">{error}</p>}
  </main>;
}

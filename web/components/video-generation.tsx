"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import { api, ErreurApi, type VideoCreee } from "@/lib/api";
import type { DemoProject } from "@/app/demo/library";
import { cameraDescription, cameraMove, type CameraMove } from "../../shared/video-direction";
import { saveVideoDraft } from "@/lib/video-draft";
import { VIDEO_REQUEST_MAX } from "../../shared/video-duration";
import { GenerationWait } from "./generation-wait";
import { CreditDialog } from "./credit-dialog";

const pending = (video: VideoCreee | null) => !!video && ["preparation", "en_attente", "clips", "montage"].includes(video.statut);

export function VideoGeneration({ photos, demande, storageKey, enabled, free, videoCredits, paymentEnabled, versions, movements, duration, onStarted }: {
  duration: number; onStarted?: (id: string) => void; photos: DemoProject[]; demande: string; storageKey: string; enabled: boolean; free: boolean; videoCredits: number; paymentEnabled: boolean; versions: Record<string, string>; movements: Record<string, CameraMove>;
}) {
  const [video, setVideo] = useState<VideoCreee | null>(null);
  const [completedBefore, setCompletedBefore] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [creditDialog, setCreditDialog] = useState(false);
  const launching = useRef(false);
  const request = useRef<{ signature: string; cle: string } | null>(null);
  const sources = photos.map(photo => {
    const version = photo.versions.find(item => item.id === (versions[photo.id] || photo.selected)) || photo.versions[0];
    return { mouvement: cameraMove(movements[photo.id]), photo_id: photo.id, version_id: version.id === "original" ? "" : version.id };
  });
  const signature = JSON.stringify({ photos: sources, demande: demande.trim(), duree: duration });
  const sameProperty = new Set(photos.map(photo => photo.property)).size <= 1;
  const cost = duration / 5;
  const readyToConfirm = enabled && photos.length > 0 && photos.length <= 6 && sameProperty && demande.trim().length >= 3 && demande.trim().length <= VIDEO_REQUEST_MAX && !starting && !pending(video) && !completedBefore;
  const canStart = readyToConfirm && (free || videoCredits >= cost);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(`${storageKey}:generation`) || "{}");
        if (saved.request?.signature && saved.request?.cle) request.current = saved.request;
        if (typeof saved.id === "string") {
          const value = await api<VideoCreee>(`/videos/${encodeURIComponent(saved.id)}`);
          if (active) { if(pending(value)) setVideo(value); else setCompletedBefore(true); }
        }
      } catch { /* Le serveur protège aussi la confirmation si le suivi tarde. */ }
      finally { if (active) setRestored(true); }
    })();
    return () => { active = false; };
  }, [storageKey]);

  const videoId = video?.id;
  const isPending = pending(video);
  useEffect(() => {
    if (video && ["prete", "echec"].includes(video.statut)) window.dispatchEvent(new Event("studio:credits-updated"));
  }, [video?.id, video?.statut]);
  useEffect(() => {
    if (!videoId || !isPending) return;
    let active = true;
    let timer: number;
    const refresh = async () => {
      try {
        const value = await api<VideoCreee>(`/videos/${videoId}`);
        if (active) { setVideo(value); setError(""); }
      } catch { if (active) setError("Le suivi est momentanément indisponible. Le même projet sera vérifié, sans relancer les plans terminés."); }
      finally { if (active) timer = window.setTimeout(refresh, 5000); }
    };
    timer = window.setTimeout(refresh, 5000);
    return () => { active = false; clearTimeout(timer); };
  }, [videoId, isPending]);
  useEffect(() => {
    if (!videoId) return;
    let active = true;
    const refresh = () => { void api<VideoCreee>(`/videos/${videoId}`).then(value => { if (active) setVideo(value); }).catch(() => {}); };
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, [videoId]);

  async function start() {
    if (launching.current || !canStart) return;
    launching.current = true; setStarting(true); setError("");
    if (!request.current || request.current.signature !== signature || video && !pending(video)) request.current = { signature, cle: crypto.randomUUID() };
    const intent = request.current;
    const save = (id?: string) => {
      try { localStorage.setItem(`${storageKey}:generation`, JSON.stringify({ request: intent, id })); }
      catch { /* L'idempotence de l'intention en cours reste en mémoire. */ }
    };
    save();
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
      let draftId: string;
      try { draftId = await saveVideoDraft(storageKey, data); }
      catch (cause) {
        const existingId = localStorage.getItem(`${storageKey}:draft-id`);
        if ((cause as ErreurApi).statut !== 409 || !existingId) throw cause;
        draftId = existingId; // Le POST idempotent retrouve la confirmation déjà reçue.
      }
      let result: VideoCreee;
      try { result = await api<VideoCreee>("/videos/visites", { method: "POST", body: JSON.stringify({ photos: sources, demande: demande.trim(), duree: duration, brouillon_id: draftId, cle_demande: intent.cle }) }); }
      catch (cause) {
        if ((cause as ErreurApi).statut !== 0) throw cause;
        // Le même jeton de confirmation retrouve le projet si la réponse a été perdue.
        result = await api<VideoCreee>("/videos/visites", { method: "POST", body: JSON.stringify({ photos: sources, demande: demande.trim(), duree: duration, brouillon_id: draftId, cle_demande: intent.cle }) });
      }
      setVideo(result); save(result.id); onStarted?.(result.id);
      window.dispatchEvent(new Event("studio:credits-updated"));
    } catch (cause) {
      setError((cause as Error).message);
      if ((cause as ErreurApi).statut === 409 && photos[0]) {
        try {
          const existing = await api<VideoCreee | null>(`/videos/photos/${photos[0].id}/derniere`);
          if (existing && pending(existing)) { setVideo(existing); save(existing.id); window.dispatchEvent(new Event("studio:credits-updated")); }
        } catch { /* Le message conserve la possibilité de retrouver le projet. */ }
      }
    } finally { launching.current = false; setStarting(false); }
  }

  return <section className="st-video-generation" aria-labelledby="video-confirm-title">
    <h2 id="video-confirm-title">Relire, puis lancer.</h2>
    {completedBefore && <p>Cette préparation a déjà été lancée. Retrouvez son résultat dans Mes créations, ou utilisez « Nouvelle vidéo » en haut pour repartir de zéro.</p>}
    <p>{photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""} · ${duration} secondes prévues · 720p` : "Choisissez au moins une photo pour créer votre vidéo."} Toutes vos photos sont conservées. La durée est répartie entre les plans. Les plans sont assemblés dans votre ordre, avec une coupe entre les pièces.</p>
    {!!demande.trim() && <details className="st-video-final-prompt"><summary>Relire ma demande et les mouvements</summary><p>{demande}</p><ol>{photos.map((photo, index) => <li key={photo.id}><strong>{photo.title}</strong> : {cameraDescription(movements[photo.id], index)}</li>)}</ol></details>}
    {!sameProperty && <p role="alert">Choisissez les photos d’un seul logement pour cette vidéo.</p>}
    {photos.length > 6 && <p role="alert">Gardez jusqu’à 6 photos pour une vidéo de 30 secondes au maximum.</p>}
    {demande.trim().length > VIDEO_REQUEST_MAX && <p role="alert">Raccourcissez votre demande à 6 000 caractères maximum avant de lancer.</p>}
    {enabled ? <><p className="st-video-hint">{free ? "Création offerte sur votre compte propriétaire." : `Cette vidéo de ${duration} secondes utilise ${cost} crédit${cost > 1 ? "s" : ""} vidéo. Solde actuel : ${videoCredits} crédit${videoCredits > 1 ? "s" : ""}, soit ${videoCredits * 5} secondes. Le reste demeure disponible pour d’autres vidéos.`} Jusqu’à 5 projets par logement sur 24 heures. La génération démarre seulement lorsque vous confirmez ci-dessous.</p>{!free && videoCredits < cost && <p role="alert">Votre solde ne suffit pas pour cette durée. Choisissez une vidéo plus courte ou consultez les packs.</p>}<div className="connected-next-buttons"><button type="button" className="button dark" disabled={!restored || !readyToConfirm} onClick={() => free || videoCredits >= cost ? void start() : setCreditDialog(true)}>{starting ? "Confirmation…" : `Confirmer et créer ${photos.length ? `ma vidéo de ${duration} s` : "ma vidéo"}`} <ArrowRight size={17}/></button><Link href="/app/" className="button outlined">Continuer mes retouches</Link></div></> : <p className="st-video-hint">Vous pouvez conserver cette préparation. La création vidéo n’est pas encore ouverte sur ce compte ; aucun crédit n’est utilisé.</p>}
    <CreditDialog open={creditDialog} onClose={() => setCreditDialog(false)} paiementDisponible={paymentEnabled} nature="video"/>
    {(starting || isPending) && <><GenerationWait type="video"/>{video && <p role="status">{video.plans_prets || 0} plan{(video.plans_prets || 0) > 1 ? "s" : ""} prêt{(video.plans_prets || 0) > 1 ? "s" : ""} sur {video.plans_total || photos.length}{video.statut === "montage" ? " · Assemblage de la vidéo" : ""}. Vous pouvez quitter cette page ou fermer le navigateur : la création continue. Retrouvez-la dans Mes créations.</p>}</>}
    {video?.statut === "prete" && video.url && <div className="st-video-created"><h3>Votre vidéo de {video.duree} secondes est prête.</h3><video controls playsInline preload="metadata" src={video.url} aria-label="Votre vidéo créée"/><a className="button dark" href={video.url} target="_blank" rel="noopener noreferrer"><Download size={17}/> Ouvrir et télécharger la vidéo</a></div>}
    {video?.statut === "echec" && <p role="alert">{video.erreur}</p>}
    {video?.statut === "echec" && !!video.clips?.length && <div className="st-video-surviving-clips">{video.clips.map((clip, index) => <a key={clip.photo_id} href={clip.url} target="_blank" rel="noopener noreferrer">Voir le plan {index + 1} déjà terminé →</a>)}</div>}
    {error && <p role="alert" className="st-error">{error}</p>}
  </section>;
}

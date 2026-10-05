"use client";
import { appendPhotoRequest } from "../../../../shared/photo-request";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, History, Info, Plus, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { api, telechargerPhoto, ErreurApi, type Photo, type Version, type VideoCreee } from "@/lib/api";
import { Bouton, Message, Pastille } from "@/components/ui";

import { useStudioAccount } from "@/components/studio-account";
import { CreationLimits } from "@/components/creation-limits";
import { PreviewWatermark } from "@/components/preview-watermark";
import { Compare } from "../../demo/studio-parts";
import { BriefAssistant } from "../../demo/brief-assistant";
import { GenerationWait } from "@/components/generation-wait";
import { CreditDialog } from "@/components/credit-dialog";

type Bulle = { de: "ia" | "moi"; texte: string };

function dateLisible(date: string | null): string | null {
  if (!date || Number.isNaN(Date.parse(date))) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(date));
}

function Atelier() {
  const { compte, sante } = useStudioAccount();
  const gratuit = compte.gratuit_illimite;
  const retoucheDisponible = !!sante?.retouche_disponible;
  const parametres = useSearchParams();
  const id = parametres.get("id") || "";
  const lot = (parametres.get("lot") || "").split(",").filter(Boolean);
  const suivante = lot[lot.indexOf(id) + 1];
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [courante, setCourante] = useState<Version | null>(null);
  const [voirAvant, setVoirAvant] = useState(false);
  const [demande, setDemande] = useState("");
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [occupe, setOccupe] = useState<"analyse" | "essai" | "hd" | "reprise" | null>(null);
  const [erreur, setErreur] = useState("");
  const [infoTelechargement, setInfoTelechargement] = useState<{ offerte: boolean; dateLimite: string | null; reprise?: boolean } | null>(null);
  const [confirmationReprise, setConfirmationReprise] = useState(false);
  const [creditDialog, setCreditDialog] = useState(false);
  const [video, setVideo] = useState<VideoCreee | null>(null);
  const [videoErreur, setVideoErreur] = useState("");
  const [horloge, setHorloge] = useState(() => Date.now());
  const dialogue = useRef<HTMLDialogElement>(null);
  const retourFocus = useRef<HTMLElement | null>(null);
  const actionEnCours = useRef(false);
  const draftWrites = useRef(Promise.resolve());


  useEffect(() => {
    if (!id) return;
    let annule = false;
    api<Photo>(`/photos/${id}`).then((p) => {
      if (annule) return;
      setErreur("");
      poser(p, p.versions.at(-1) || null);
      try { setDemande(sessionStorage.getItem(`studio:${compte.id}:photo:${id}:draft`) ?? p.demande_brouillon ?? ""); }
      catch { setDemande(p.demande_brouillon ?? ""); }
      if (annule) return;
      poser(p, p.versions.at(-1) || null);
      const a = p.analyse;
      setBulles([
        { de: "ia", texte: a ? `${a.piece}. Ce que je vois à corriger : ${a.defauts.join(", ")}.` : "Votre photo est prête à être retouchée." },
        { de: "ia", texte: p.versions.length ? "Retrouvez toutes vos versions ci-dessous et choisissez celle à poursuivre." : retoucheDisponible ? "Décrivez les changements souhaités pour préparer votre version annonce." + (a?.question ? ` ${a.question}` : "") : "Votre original est enregistré. Vous pouvez préparer votre demande en attendant la disponibilité des retouches." },
      ]);
    }).catch((e) => { if (!annule) setErreur(e.message); })
      .finally(() => { if (!annule) setOccupe(null); });
    return () => { annule = true; };
  }, [id, compte.id, retoucheDisponible]);
  useEffect(() => {
    const minuterie = window.setInterval(() => setHorloge(Date.now()), 30_000);
    return () => window.clearInterval(minuterie);
  }, []);
  useEffect(() => {
    if (!id) return;
    let active = true;
    const refresh = () => {
      if (actionEnCours.current) return;
      api<Photo>(`/photos/${id}`).then(p => {
        if (!active || actionEnCours.current) return;
        setPhoto(p);
        setCourante(current => current ? p.versions.find(v => v.id === current.id) || null : null);
      }).catch(() => { /* Les actions sont toujours vérifiées par le serveur. */ });
    };
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, [id]);
  useEffect(() => {
    if (!id || !gratuit) return;
    let actif = true;
    api<VideoCreee | null>(`/videos/photos/${id}/derniere`).then(v => { if (actif) setVideo(v); }).catch(() => {});
    return () => { actif = false; };
  }, [id, gratuit]);
  const videoId = video?.id;
  const videoStatus = video?.statut;
  useEffect(() => {
    if (!videoId || !videoStatus || !["preparation", "en_attente", "clips", "montage"].includes(videoStatus)) return;
    const minuterie = window.setInterval(() => {
      api<VideoCreee>(`/videos/${videoId}`).then(setVideo).catch(() => setVideoErreur("Le suivi vidéo est momentanément indisponible. Réessayez dans un instant."));
    }, 5000);
    return () => window.clearInterval(minuterie);
  }, [videoId, videoStatus]);

  function preparerVideo() {
    if (!photo) return;
    const key = `studio:${compte.id}:video-plan`;
    try {
      const previous = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...previous, selectedIds: [photo.id], selectedVersions: { [photo.id]: courante?.id || "original" } }));
    } catch { /* La sélection pourra être refaite sur l'écran vidéo. */ }
  }
  const dialogueOuvert = !!infoTelechargement || confirmationReprise;
  useEffect(() => {
    const element = dialogue.current;
    if (dialogueOuvert && element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, [dialogueOuvert]);

  function poser(p: Photo, v: Version | null) { setPhoto(p); setCourante(v); setVoirAvant(false); }

  async function essai(texte: string) {
    if (!photo || actionEnCours.current || occupe || repriseNecessaire || creationBloquee || creditManquant || !retoucheDisponible || texte.length > 4000) return;
    actionEnCours.current = true;
    setErreur(""); setOccupe("essai");
    const versionsAvant = photo.versions.length;
    if (texte) setBulles((b) => [...b, { de: "moi", texte }]);
    try {
      await draftWrites.current;
      await api(`/photos/${photo.id}/demande`, { method: "PATCH", body: JSON.stringify({ demande: texte }) });
      const p = await api<Photo>(`/photos/${photo.id}/essai`, { method: "POST", body: JSON.stringify({ demande: texte, depuis_version_id: courante?.id || null }) });
      poser(p, p.versions.at(-1) || null);
      setDemande(p.demande_brouillon || "");
      try { sessionStorage.removeItem(`studio:${compte.id}:photo:${id}:draft`); } catch {}
      const restants = p.essais_restants;
      window.dispatchEvent(new Event("studio:credits-updated"));
      setBulles((b) => [...b, { de: "ia", texte: `Votre version est prête. ${restants ? `Il vous reste ${restants} génération${restants > 1 ? "s" : ""} sur cette photo.` : gratuit ? "Vous pouvez ajouter gratuitement une correction." : "Une correction supplémentaire coûte 1 crédit."}` }]);
    } catch (e) {
      const err = e as ErreurApi;
      if (err.statut === 0) {
        // Passenger peut couper la réponse pendant que le fournisseur termine.
        // Rechercher le résultat avant de proposer un nouvel essai facturable.
        setBulles(b => [...b, { de: "ia", texte: "La retouche continue peut-être sur le serveur. Je vérifie son résultat avant tout nouvel essai." }]);
        let retrouvee = false;
        for (let tentative = 0; tentative < 36 && !retrouvee; tentative++) {
          await new Promise(resolve => window.setTimeout(resolve, 5000));
          try {
            const p = await api<Photo>(`/photos/${photo.id}`);
            if (p.versions.length > versionsAvant) {
              poser(p, p.versions.at(-1) || null);
              setBulles(b => [...b, { de: "ia", texte: "Votre retouche est prête. Vous pouvez la comparer avec l’original." }]);
              retrouvee = true;
            }
          } catch { /* Un contrôle peut échouer sans relancer la génération. */ }
        }
        if (!retrouvee) setErreur("Le résultat n’a pas encore pu être confirmé. Revenez dans Mes créations avant de relancer une retouche.");
      } else if ([402, 403, 429].includes(err.statut)) {
        setBulles((b) => [...b, { de: "ia", texte: err.message }]);
        try { await rafraichir(); } catch { /* L'erreur d'origine reste visible. */ }
      } else setErreur(err.message);
    } finally { setOccupe(null); actionEnCours.current = false; window.dispatchEvent(new Event("studio:credits-updated")); }
  }

  async function rafraichir(versionId: string | null = courante?.id || null) {
    if (!photo) return;
    const p = await api<Photo>(`/photos/${photo.id}`);
    poser(p, p.versions.find((v) => v.id === versionId) || null);
    setHorloge(Date.now());
  }

  async function telecharger(event: MouseEvent<HTMLButtonElement>) {
    if (!photo || !courante || actionEnCours.current || occupe) return;
    if (!gratuit && !photo.offerte && !photo.credite_le && compte.solde < 1) {
      setCreditDialog(true);
      return;
    }
    retourFocus.current = event.currentTarget;
    actionEnCours.current = true;
    setErreur(""); setOccupe("hd");
    try {
      const resultat = await telechargerPhoto(`/photos/${photo.id}/versions/${courante.id}/telecharger`);
      const url = URL.createObjectURL(resultat.fichier);
      const lien = document.createElement("a");
      lien.href = url; lien.download = `photo-${photo.ordre + 1}.jpg`;
      document.body.appendChild(lien); lien.click(); lien.remove();
      // Laisser le navigateur prendre en charge le fichier avant de libérer l'URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (resultat.creditConsomme || resultat.premierePhotoOfferte || (gratuit && !photo.credite_le)) {
        setInfoTelechargement({ offerte: resultat.premierePhotoOfferte, dateLimite: dateLisible(resultat.repriseJusquAu) });
        window.dispatchEvent(new Event("studio:credits-updated"));
      }
      const limite = dateLisible(resultat.repriseJusquAu);
      setBulles((b) => [...b, { de: "ia", texte: gratuit ? "Votre photo est prête en HD, sans débit de crédit."
        : resultat.premierePhotoOfferte
        ? "Votre photo offerte est prête en HD. Aucun crédit n'a été utilisé."
        : resultat.creditConsomme ? `Votre photo est prête en HD. Un crédit a été utilisé.${limite ? ` La correction incluse, si elle reste disponible, est utilisable jusqu’au ${limite}.` : ""}`
        : "Téléchargement HD relancé. Aucun crédit supplémentaire n'a été utilisé." }]);
      try { await rafraichir(); }
      catch { setErreur("Le téléchargement est prêt, mais l’état de la photo n’a pas pu être actualisé. Rechargez la page pour retrouver la période exacte."); }
    } catch (e) {
      const err = e as ErreurApi;
      if (err.statut === 0) {
        try {
          const p = await api<Photo>(`/photos/${photo.id}`);
          poser(p, p.versions.find(v => v.id === courante.id) || null);
          if (p.credite_le && p.versions.some(v => v.id === courante.id && v.hd)) {
            setErreur("La HD a été préparée, mais le téléchargement a été interrompu. Cliquez de nouveau sur « Télécharger en HD » : aucun crédit supplémentaire ne sera utilisé.");
          } else setErreur("Le téléchargement n’a pas pu être confirmé. Vérifiez cette photo avant de réessayer.");
        } catch { setErreur("Connexion interrompue. Revenez sur cette photo pour vérifier si la HD est prête avant de réessayer."); }
      } else setErreur(err.message);
    }
    finally { setOccupe(null); actionEnCours.current = false; }
  }

  async function reprendre() {
    if (!photo || actionEnCours.current || occupe) return;
    actionEnCours.current = true;
    setErreur(""); setOccupe("reprise");
    try {
      const p = await api<Photo>(`/photos/${photo.id}/reprendre`, {
        method: "POST", body: JSON.stringify({ cycle_id: photo.cycle_id }),
      });
      poser(p, p.versions.find((v) => v.id === courante?.id) || null);
      setHorloge(Date.now());
      setConfirmationReprise(false);
      if (p.cycle_id !== photo.cycle_id) {
        setInfoTelechargement({ offerte: false, reprise: true, dateLimite: dateLisible(p.reprise_jusqu_au) });
        window.dispatchEvent(new Event("studio:credits-updated"));
      }
    } catch (e) {
      setErreur((e as ErreurApi).message);
      setConfirmationReprise(false);
      if ((e as ErreurApi).statut === 409) {
        try { await rafraichir(); } catch { /* Conserver l'erreur qui explique l'action à faire. */ }
      }
    } finally { setOccupe(null); actionEnCours.current = false; }
  }

  function fermerDialogue() {
    if (occupe === "reprise") return;
    dialogue.current?.close();
    setInfoTelechargement(null);
    setConfirmationReprise(false);
    window.requestAnimationFrame(() => {
      const cible = retourFocus.current;
      if (cible?.isConnected && !cible.matches(":disabled")) cible.focus({ preventScroll: true });
      else document.querySelector<HTMLButtonElement>("[data-photo-download]")?.focus({ preventScroll: true });
    });
  }

  const periodeExpiree = !!photo && (photo.reprise_expiree || (!!photo.reprise_jusqu_au && horloge >= Date.parse(photo.reprise_jusqu_au)));
  const repriseNecessaire = !!photo && (periodeExpiree || photo.essais_restants === 0);
  const finPeriode = dateLisible(photo?.reprise_jusqu_au || null);
  const limites = photo?.limites || compte.limites;
  const creationBloquee = !!limites?.photo.bloque;
  const creditManquant = !!photo && !gratuit && !photo.offerte && !photo.credite_le && compte.solde < 1;
  const filigrane = !!courante && (photo?.filigrane ?? (!photo?.offerte && !photo?.credite_le));
  const original = photo?.original || photo?.vignette;
  const image = !courante ? original : courante.apercu;

  useEffect(() => {
    if (!photo || photo.id !== id || occupe) return;
    const original = photo.demande_brouillon || "";
    if (demande === original || demande.length > 4000) return;
    try { sessionStorage.setItem(`studio:${compte.id}:photo:${id}:draft`, demande); } catch { /* Serveur ci-dessous. */ }
    const timer = window.setTimeout(() => {
      draftWrites.current = draftWrites.current.catch(() => {}).then(() => api(`/photos/${id}/demande`, { method: "PATCH", body: JSON.stringify({ demande }) })).then(() => { window.dispatchEvent(new Event("studio:drafts-updated")); }).catch(() => setErreur("La demande reste sur cet appareil. Enregistrez le brouillon avant de changer d’appareil."));
    }, 350);
    return () => clearTimeout(timer);
  }, [photo, id, occupe, demande, compte.id]);

  async function saveDraft() {
    if (!photo || occupe) return;
    setErreur("");
    try {
      await api(`/photos/${photo.id}/demande`, { method: "PATCH", body: JSON.stringify({ demande }) });
      try { sessionStorage.setItem(`studio:${compte.id}:photo:${id}:draft`, demande); } catch { /* Le compte conserve la demande. */ }
      setBulles(b => [...b, { de: "ia", texte: "Demande enregistrée avec votre photo. Vous la retrouverez sur le site et dans l’application mobile." }]);
    } catch (e) { setErreur((e as ErreurApi).message); }
  }

  return (
    <main className="editor-main work-editor">
      <Link href="/app/" className="text-action back-to-projects"><ArrowLeft size={16}/> Mes créations</Link>
      <div className="editor-title"><div><p className="eyebrow">VOTRE PHOTO</p><h1>{photo?.analyse?.piece || "Votre photo"}</h1><p>Votre original est conservé avec toutes ses versions.</p></div><div className="editor-actions">
        <Bouton data-photo-download onClick={telecharger} disabled={!courante || !!occupe || (periodeExpiree && !courante.hd)} chargement={occupe === "hd"}><Download size={17}/> {gratuit || photo?.credite_le || photo?.offerte ? "Télécharger en HD" : "Garder en HD · 1 crédit"}</Bouton>
      </div></div>
      {occupe === "essai" && <GenerationWait/>}
      <div className="editor-grid"><section className="image-panel">
        <div className="result-status"><span><CheckCircle2 size={16}/>{courante ? `Version ${courante.numero}` : "Photo originale"}</span><small>{photo?.offerte && !photo.credite_le ? "Photo offerte" : "Original préservé"}</small></div>
        {image ? voirAvant && courante ? <Compare before={original} result={courante.apercu} watermarked={filigrane}/> : <div className="full-result connected-full-result"><img src={image} draggable={false} alt={courante ? "Votre photo retouchée" : "Votre photo originale"}/>{filigrane && <PreviewWatermark/>}{occupe === "essai" && <div role="status" className="connected-photo-pending"><Sparkles size={22}/> Retouche en cours…</div>}</div> : <div className="full-result connected-photo-pending">{erreur ? "La photo n’a pas pu être chargée." : "Chargement de votre photo…"}</div>}
        <div className="image-bottom"><button disabled={!courante} aria-pressed={voirAvant} onClick={() => setVoirAvant(!voirAvant)}><SlidersHorizontal size={16}/>{voirAvant ? "Photo entière" : "Comparer avec l’original"}</button><span>{filigrane ? "Aperçu protégé · HD sans filigrane à l’achat" : courante ? "Téléchargement HD sans filigrane" : "Original préservé"}</span></div>
        <div className="version-gallery"><div className="history-toggle"><History size={18}/> Toutes vos versions <span>{(photo?.versions.length || 0) + 1}</span></div>
          {photo && <div className="work-version-list">
            <button className={`version-row ${!courante ? "is-selected" : ""}`} aria-pressed={!courante} onClick={() => { setCourante(null); setVoirAvant(false); }}><img src={original} alt="" width={92} height={62}/><span><small>LE POINT DE DÉPART</small><strong>Photo originale</strong><span>Votre photo, toujours conservée.</span></span>{!courante && <CheckCircle2 size={19}/>}</button>
            {photo.versions.map(v => <button key={v.id} className={`version-row ${courante?.id === v.id ? "is-selected" : ""}`} aria-pressed={courante?.id === v.id} disabled={!!occupe} onClick={() => { setCourante(v); setVoirAvant(false); }}><img src={v.apercu} alt="" width={92} height={62}/><span><small>VERSION {v.numero}</small><strong>{v.hd ? "Version HD" : "Votre retouche"}</strong><span>{v.consigne}</span></span>{courante?.id === v.id && <CheckCircle2 size={19}/>}</button>)}
          </div>}
        </div>
      </section><aside className="edit-controls">
        <p className="section-kicker">VOTRE DEMANDE À VÉRIFIER</p><h2>Relisez, puis lancez la retouche.</h2><p className="editor-description">Décrivez simplement le résultat que vous imaginez.</p>
        {photo && <div className="connected-photo-tags"><Pastille>{photo.essais_restants} génération{photo.essais_restants > 1 ? "s" : ""} restante{photo.essais_restants > 1 ? "s" : ""}</Pastille>{photo.offerte && !photo.credite_le && <Pastille ton="accent">Photo offerte</Pastille>}</div>}
        <p className="demo-help">Première génération + 1 correction incluse. {gratuit ? "Vos corrections supplémentaires sont gratuites." : "Chaque correction supplémentaire coûte 1 crédit."}</p>
        <CreationLimits limites={limites} compact/>
        <form className="draft-form" onSubmit={event => { event.preventDefault(); if (retoucheDisponible) { if (creditManquant) setCreditDialog(true); else void essai(demande.trim()); } else void saveDraft(); }}>
          <label htmlFor="photo-request">Votre demande</label><textarea id="photo-request" maxLength={4000} value={demande} disabled={!!occupe || repriseNecessaire || creationBloquee} onChange={event => setDemande(event.target.value)} placeholder="Un salon plus lumineux, une déco plus chaleureuse…" rows={5}/>
          {!repriseNecessaire && !creationBloquee && <BriefAssistant storageKey={`studio:${compte.id}:photo:${id}:assistant`} kind="photo" request={demande} onUse={setDemande}/>}
          {demande.length > 4000 && <p className="st-error" role="alert">Raccourcissez votre demande à 4 000 caractères maximum. Votre texte est conservé.</p>}
          <button className="button dark" type="submit" disabled={!photo || !!occupe || repriseNecessaire || creationBloquee || !demande.trim() || demande.length > 4000}>{occupe === "essai" ? "Retouche en cours…" : retoucheDisponible ? "Créer ma photo retouchée" : "Enregistrer le brouillon"}<ArrowRight size={17}/></button>
          {retoucheDisponible && <button className="text-action" type="button" disabled={!photo || !!occupe || !demande.trim()} onClick={() => void saveDraft()}>Enregistrer le brouillon</button>}
        </form>
        {creditManquant && !repriseNecessaire && <div className="generation-state" role="status"><Info size={18}/><p><strong>Solde photo à zéro</strong>La création d’une nouvelle retouche attend au moins 1 crédit photo. Vous pouvez enregistrer votre demande en brouillon ; votre première photo offerte et les corrections déjà incluses restent disponibles.</p></div>}
        {!repriseNecessaire && !creationBloquee && <div className="request-ideas" aria-label="Idées de retouche">{["Plus de lumière", "Retirer le désordre", "Changer toute la décoration"].map(idea => <button key={idea} disabled={!!occupe} onClick={() => { const next = appendPhotoRequest(demande, idea); if(next===demande && demande.length + idea.length + 2 > 4000) setErreur("Votre brief est déjà très long. Raccourcissez-le avant d’ajouter cette précision ; aucun texte n’a été effacé."); else setDemande(next); }}>{idea}<Plus size={14}/></button>)}</div>}
        {!retoucheDisponible && <div className="generation-state"><Info size={18}/><p><strong>Retouche momentanément indisponible</strong>Préparez votre demande. Aucun crédit n’est consommé.</p></div>}
        {photo && repriseNecessaire && <div className="generation-state"><Info size={18}/><div><p><strong>{periodeExpiree ? "Période de retouche terminée" : "Générations disponibles utilisées"}</strong>{gratuit ? "Ajoutez gratuitement une correction, utilisable pendant 7 jours." : "1 crédit débloque une seule correction, utilisable pendant 7 jours."} Vos versions restent disponibles.</p><Bouton onClick={event => { retourFocus.current = event.currentTarget; if (!gratuit && compte.solde < 1) setCreditDialog(true); else setConfirmationReprise(true); }} disabled={!!occupe || !retoucheDisponible}>{gratuit ? "Ajouter 1 correction gratuite" : "Ajouter 1 correction · 1 crédit"}</Bouton></div></div>}
        {finPeriode && !repriseNecessaire && <p className="demo-help">Générations restantes utilisables jusqu’au {finPeriode}.</p>}
        <Message texte={erreur}/>
        {bulles.length > 0 && <p className="connected-photo-feedback" role="status">{bulles.at(-1)?.texte}</p>}
        <Link className="text-action" href="/aide/#credits">Comprendre les crédits et les 7 jours <ArrowRight size={15}/></Link>
      </aside></div>
      {photo && <section className="connected-next-actions" aria-labelledby="next-actions-title">
        <p className="eyebrow">LA SUITE DE VOTRE ANNONCE</p><h2 id="next-actions-title">Continuez à votre rythme.</h2>
        <p>Ajoutez d’autres photos de ce logement et retouchez celles que vous choisissez. La vidéo vient ensuite, si vous en avez envie.</p>
        <div className="connected-next-buttons">
          <Link className="button dark" href={`/app/logement/?id=${encodeURIComponent(photo.logement_id)}`}>Retoucher d’autres photos <ArrowRight size={17}/></Link>
          <Link className="button outlined" href="/app/#visite" onClick={preparerVideo}>Préparer une vidéo <ArrowRight size={17}/></Link>
        </div>
      </section>}
      {video && <section className="connected-video-offer" aria-labelledby="video-offer-title">
        <p className="eyebrow">VOTRE VIDÉO</p><h2 id="video-offer-title">Le suivi de votre vidéo.</h2>
        <p>{video.duree} secondes · retrouvez le projet à partir de cette photo ou dans Photos → vidéo.</p>
        {video && ["preparation", "en_attente", "clips", "montage"].includes(video.statut) && <GenerationWait type="video"/>}
        {video?.statut === "prete" && video.url && <video controls playsInline src={video.url} aria-label="Votre vidéo créée"/>}
        {video?.statut === "echec" && <p role="alert">{video.erreur || "La vidéo n'a pas abouti."}</p>}
        {videoErreur && <p role="alert">{videoErreur}</p>}
      </section>}
      {suivante && <div className="batch-next"><span>Photo {lot.indexOf(id) + 1} sur {lot.length} · votre sélection</span><Link className="button dark" href={`/app/photo/?id=${suivante}&lot=${encodeURIComponent(lot.join(","))}`}>Passer à la photo suivante <ArrowRight size={17}/></Link></div>}
      <CreditDialog open={creditDialog} onClose={() => setCreditDialog(false)} paiementDisponible={!!compte.paiement_photo_disponible}/>
      {dialogueOuvert && <dialog ref={dialogue} onCancel={(event) => { event.preventDefault(); fermerDialogue(); }}
        aria-labelledby="download-info-title" aria-describedby="download-info-copy"
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-line bg-surface p-7 text-fg shadow-2xl backdrop:bg-black/65 sm:p-9">
        <button type="button" onClick={fermerDialogue} disabled={occupe === "reprise"} aria-label="Fermer cette information"
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-fg-muted transition hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"><X className="size-5" /></button>
        <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent"><Download className="size-6" /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">{confirmationReprise ? "Avant de reprendre" : "Information importante"}</p>
        <h2 id="download-info-title" className="mt-2 pr-9 text-2xl font-semibold tracking-tight">{confirmationReprise ? "Ajouter une correction ?" : infoTelechargement?.reprise ? "Votre correction est disponible" : "Votre photo est prête en HD"}</h2>
        <div id="download-info-copy" className="mt-4 space-y-3 text-base leading-7 text-fg-muted">
          {confirmationReprise ? <>
            <p><strong className="text-fg">{gratuit ? "Cette correction est gratuite sur votre compte." : "1 crédit sera utilisé maintenant pour une seule correction."}</strong> Vous aurez 7 jours pour la lancer. Ses versions précédentes sont conservées et les téléchargements HD sont inclus.</p>
            <p className="text-sm">En cas d’échec de la génération, cette correction reste disponible dans la période en cours. La reprise remet le compteur de créations photo à zéro, sans modifier celui des vidéos.</p>
          </> : <>
            <p>{gratuit ? "Votre compte propriétaire crée et télécharge gratuitement." : infoTelechargement?.reprise ? "Un crédit a été utilisé pour ajouter une seule correction." : infoTelechargement?.offerte ? "C’est votre photo offerte : aucun crédit n’a été utilisé." : "Un crédit a été utilisé pour votre premier téléchargement HD."}</p>
            {infoTelechargement?.dateLimite ? <p>{infoTelechargement.reprise ? "Votre correction est utilisable" : "La correction incluse, si elle reste disponible, est utilisable"} jusqu’au <strong className="text-fg">{infoTelechargement.dateLimite}</strong>.</p> : <p>La date limite n’a pas été reçue du serveur. Rechargez la page pour consulter la période exacte ; aucun nouveau délai n’est créé par ce message.</p>}
            <p>{gratuit ? "Les corrections supplémentaires restent gratuites." : "Chaque correction supplémentaire coûte 1 crédit."} Un ancien téléchargement ne prolonge pas le délai et ne remet aucun compteur à zéro.</p>
          </>}
        </div>
        <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-fg-muted">Toutes vos versions restent dans l’historique. Les fichiers HD déjà préparés restent téléchargeables.</p>
        {confirmationReprise ? <div className="mt-6 flex gap-3">
          <Bouton variante="secondaire" onClick={fermerDialogue} disabled={occupe === "reprise"}>Annuler</Bouton>
          <Bouton onClick={reprendre} chargement={occupe === "reprise"} disabled={!!occupe}>{gratuit ? "Confirmer gratuitement" : "Confirmer · 1 crédit"}</Bouton>
        </div> : <Bouton className="mt-6 w-full" onClick={fermerDialogue}>J’ai compris</Bouton>}
      </dialog>}
    </main>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Atelier /></Suspense>;
}

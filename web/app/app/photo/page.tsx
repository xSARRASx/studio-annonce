"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, History, Info, Plus, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { api, telechargerPhoto, ErreurApi, type Photo, type Version } from "@/lib/api";
import { Bouton, Message, Pastille } from "@/components/ui";

import { useStudioAccount } from "@/components/studio-account";
import { CreationLimits } from "@/components/creation-limits";
import { PreviewWatermark } from "@/components/preview-watermark";
import { Compare } from "../../demo/studio-parts";
import { BriefAssistant } from "../../demo/brief-assistant";
import { GenerationWait } from "@/components/generation-wait";

type Bulle = { de: "ia" | "moi"; texte: string };

function dateLisible(date: string | null): string | null {
  if (!date || Number.isNaN(Date.parse(date))) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(date));
}

function Atelier() {
  const { compte, sante } = useStudioAccount();
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
  const [propositionVideo, setPropositionVideo] = useState(false);
  const [horloge, setHorloge] = useState(() => Date.now());
  const dialogue = useRef<HTMLDialogElement>(null);
  const retourFocus = useRef<HTMLElement | null>(null);
  const actionEnCours = useRef(false);


  useEffect(() => {
    if (!id) return;
    let annule = false;
    api<Photo>(`/photos/${id}`).then(async (p) => {
      if (annule) return;
      setErreur("");
      poser(p, p.versions.at(-1) || null);
      try { setDemande(p.demande_brouillon || sessionStorage.getItem(`studio:${compte.id}:photo:${id}:draft`) || ""); }
      catch { setDemande(p.demande_brouillon ?? ""); }
      if (!p.analyse && retoucheDisponible && !p.limites?.photo.bloque) {
        setOccupe("analyse");
        p = await api<Photo>(`/photos/${id}/analyser`, { method: "POST" });
      }
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
  const dialogueOuvert = !!infoTelechargement || confirmationReprise;
  useEffect(() => {
    const element = dialogue.current;
    if (dialogueOuvert && element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, [dialogueOuvert]);

  function poser(p: Photo, v: Version | null) { setPhoto(p); setCourante(v); setVoirAvant(false); }

  async function essai(texte: string) {
    if (!photo || actionEnCours.current || occupe || repriseNecessaire || creationBloquee || !retoucheDisponible || texte.length > 4000) return;
    actionEnCours.current = true;
    setErreur(""); setOccupe("essai");
    if (texte) setBulles((b) => [...b, { de: "moi", texte }]);
    try {
      await api(`/photos/${photo.id}/demande`, { method: "PATCH", body: JSON.stringify({ demande: texte }) });
      const p = await api<Photo>(`/photos/${photo.id}/essai`, { method: "POST", body: JSON.stringify({ demande: texte, depuis_version_id: courante?.id || null }) });
      poser(p, p.versions.at(-1) || null);
      const restants = p.essais_restants;
      window.dispatchEvent(new Event("studio:credits-updated"));
      setBulles((b) => [...b, { de: "ia", texte: `Votre version est prête. ${restants ? `Il vous reste ${restants} génération${restants > 1 ? "s" : ""} sur cette photo.` : "Une correction supplémentaire coûte 1 crédit."}` }]);
    } catch (e) {
      const err = e as ErreurApi;
      if ([402, 403, 429].includes(err.statut)) {
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
      setPropositionVideo(true);
      if (resultat.creditConsomme || resultat.premierePhotoOfferte) {
        setInfoTelechargement({ offerte: resultat.premierePhotoOfferte, dateLimite: dateLisible(resultat.repriseJusquAu) });
        window.dispatchEvent(new Event("studio:credits-updated"));
      }
      const limite = dateLisible(resultat.repriseJusquAu);
      setBulles((b) => [...b, { de: "ia", texte: resultat.premierePhotoOfferte
        ? "Votre photo offerte est prête en HD. Aucun crédit n'a été utilisé."
        : resultat.creditConsomme ? `Votre photo est prête en HD. Un crédit a été utilisé.${limite ? ` La correction incluse, si elle reste disponible, est utilisable jusqu’au ${limite}.` : ""}`
        : "Téléchargement HD relancé. Aucun crédit supplémentaire n'a été utilisé." }]);
      try { await rafraichir(); }
      catch { setErreur("Le téléchargement est prêt, mais l’état de la photo n’a pas pu être actualisé. Rechargez la page pour retrouver la période exacte."); }
    } catch (e) { setErreur((e as ErreurApi).message); }
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
  const filigrane = !!courante && (photo?.filigrane ?? (!photo?.offerte && !photo?.credite_le));
  const original = photo?.original || photo?.vignette;
  const image = !courante ? original : courante.apercu;

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
        <Bouton data-photo-download onClick={telecharger} disabled={!courante || !!occupe || (periodeExpiree && !courante.hd)} chargement={occupe === "hd"}><Download size={17}/> {photo?.credite_le || photo?.offerte ? "Télécharger en HD" : "Garder en HD · 1 crédit"}</Bouton>
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
        <p className="section-kicker">VOTRE PROCHAINE IDÉE</p><h2>Qu’est-ce qu’on change ?</h2><p className="editor-description">Décrivez simplement le résultat que vous imaginez.</p>
        {photo && <div className="connected-photo-tags"><Pastille>{photo.essais_restants} génération{photo.essais_restants > 1 ? "s" : ""} restante{photo.essais_restants > 1 ? "s" : ""}</Pastille>{photo.offerte && !photo.credite_le && <Pastille ton="accent">Photo offerte</Pastille>}</div>}
        <p className="demo-help">Première génération + 1 correction incluse. Chaque correction supplémentaire coûte 1 crédit.</p>
        <CreationLimits limites={limites} compact/>
        <form className="draft-form" onSubmit={event => { event.preventDefault(); if (retoucheDisponible) void essai(demande.trim()); else void saveDraft(); }}>
          <label htmlFor="photo-request">Votre demande</label><textarea id="photo-request" maxLength={4000} value={demande} disabled={!!occupe || repriseNecessaire || creationBloquee} onChange={event => setDemande(event.target.value)} placeholder="Un salon plus lumineux, une déco plus chaleureuse…" rows={5}/>
          {!repriseNecessaire && !creationBloquee && <BriefAssistant kind="photo" request={demande} onUse={setDemande}/>}
          {demande.length > 4000 && <p className="st-error" role="alert">Raccourcissez votre demande à 4 000 caractères maximum. Votre texte est conservé.</p>}
          <button className="button dark" type="submit" disabled={!photo || !!occupe || repriseNecessaire || creationBloquee || !demande.trim() || demande.length > 4000}>{occupe === "essai" ? "Retouche en cours…" : retoucheDisponible ? "Lancer la retouche" : "Enregistrer ma demande"}<ArrowRight size={17}/></button>
          {retoucheDisponible && <button className="text-action" type="button" disabled={!photo || !!occupe || !demande.trim()} onClick={() => void saveDraft()}>Enregistrer pour plus tard</button>}
        </form>
        {!repriseNecessaire && !creationBloquee && <div className="request-ideas" aria-label="Idées de retouche">{["Plus de lumière", "Retirer le désordre", "Changer toute la décoration"].map(idea => <button key={idea} disabled={!!occupe} onClick={() => setDemande(idea)}>{idea}<Plus size={14}/></button>)}</div>}
        {!retoucheDisponible && <div className="generation-state"><Info size={18}/><p><strong>Retouche momentanément indisponible</strong>Préparez votre demande. Aucun crédit n’est consommé.</p></div>}
        {photo && repriseNecessaire && <div className="generation-state"><Info size={18}/><div><p><strong>{periodeExpiree ? "Période de retouche terminée" : "Générations disponibles utilisées"}</strong>1 crédit débloque une seule correction, utilisable pendant 7 jours. Vos versions restent disponibles.</p><Bouton onClick={event => { retourFocus.current = event.currentTarget; setConfirmationReprise(true); }} disabled={!!occupe || !retoucheDisponible}>Ajouter 1 correction · 1 crédit</Bouton></div></div>}
        {finPeriode && !repriseNecessaire && <p className="demo-help">Générations restantes utilisables jusqu’au {finPeriode}.</p>}
        <Message texte={erreur}/>
        {bulles.length > 0 && <p className="connected-photo-feedback" role="status">{bulles.at(-1)?.texte}</p>}
        <Link className="text-action" href="/aide/#credits">Comprendre les crédits et les 7 jours <ArrowRight size={15}/></Link>
      </aside></div>
      {propositionVideo && <section className="connected-video-offer" aria-labelledby="video-offer-title"><div><p className="eyebrow">LA SUITE DE VOTRE ANNONCE</p><h2 id="video-offer-title">Et si vos photos devenaient une vidéo&nbsp;?</h2><p>Préparez une visite de 10, 20 ou 30 secondes. Vous choisissez la durée et voyez le prix avant tout achat.</p></div><Link className="button dark" href="/app/#visite">Préparer ma vidéo <ArrowRight size={17}/></Link></section>}
      {suivante && <div className="batch-next"><span>Photo {lot.indexOf(id) + 1} sur {lot.length} · votre sélection</span><Link className="button dark" href={`/app/photo/?id=${suivante}&lot=${encodeURIComponent(lot.join(","))}`}>Passer à la photo suivante <ArrowRight size={17}/></Link></div>}
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
            <p><strong className="text-fg">1 crédit sera utilisé maintenant pour une seule correction.</strong> Vous aurez 7 jours pour la lancer. Ses versions précédentes sont conservées et les téléchargements HD sont inclus.</p>
            <p className="text-sm">En cas d’échec de la génération, cette correction reste disponible dans la période en cours. Cet achat remet le compteur de créations photo à zéro, sans modifier celui des vidéos.</p>
          </> : <>
            <p>{infoTelechargement?.reprise ? "Un crédit a été utilisé pour ajouter une seule correction." : infoTelechargement?.offerte ? "C’est votre photo offerte : aucun crédit n’a été utilisé." : "Un crédit a été utilisé pour votre premier téléchargement HD."}</p>
            {infoTelechargement?.dateLimite ? <p>{infoTelechargement.reprise ? "Votre correction est utilisable" : "La correction incluse, si elle reste disponible, est utilisable"} jusqu’au <strong className="text-fg">{infoTelechargement.dateLimite}</strong>.</p> : <p>La date limite n’a pas été reçue du serveur. Rechargez la page pour consulter la période exacte ; aucun nouveau délai n’est créé par ce message.</p>}
            <p>Chaque correction supplémentaire coûte 1 crédit. Un ancien téléchargement ne prolonge pas le délai et ne remet aucun compteur à zéro.</p>
          </>}
        </div>
        <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-fg-muted">Toutes vos versions restent dans l’historique. Les fichiers HD déjà préparés restent téléchargeables.</p>
        {confirmationReprise ? <div className="mt-6 flex gap-3">
          <Bouton variante="secondaire" onClick={fermerDialogue} disabled={occupe === "reprise"}>Annuler</Bouton>
          <Bouton onClick={reprendre} chargement={occupe === "reprise"} disabled={!!occupe}>Confirmer · 1 crédit</Bouton>
        </div> : <Bouton className="mt-6 w-full" onClick={fermerDialogue}>J’ai compris</Bouton>}
      </dialog>}
    </main>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Atelier /></Suspense>;
}

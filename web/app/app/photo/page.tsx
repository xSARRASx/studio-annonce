"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, History, Info, Plus, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { api, telechargerPhoto, ErreurApi, type Photo, type Version } from "@/lib/api";
import { Bouton, Message, Pastille } from "@/components/ui";

import { useStudioAccount } from "@/components/studio-account";
import { Compare } from "../../demo/studio-parts";
import { BriefAssistant } from "../../demo/brief-assistant";

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
  const id = useSearchParams().get("id") || "";
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [courante, setCourante] = useState<Version | null>(null);
  const [voirAvant, setVoirAvant] = useState(false);
  const [demande, setDemande] = useState("");
  const [bulles, setBulles] = useState<Bulle[]>([]);
  const [occupe, setOccupe] = useState<"analyse" | "essai" | "hd" | "reprise" | null>(null);
  const [erreur, setErreur] = useState("");
  const [infoTelechargement, setInfoTelechargement] = useState<{ offerte: boolean; dateLimite: string | null; reprise?: boolean } | null>(null);
  const [confirmationReprise, setConfirmationReprise] = useState(false);
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
      try { setDemande(sessionStorage.getItem(`studio:${compte.id}:photo:${id}:draft`) || ""); } catch {}
      if (!p.analyse && retoucheDisponible) {
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
  const dialogueOuvert = !!infoTelechargement || confirmationReprise;
  useEffect(() => {
    const element = dialogue.current;
    if (dialogueOuvert && element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, [dialogueOuvert]);

  function poser(p: Photo, v: Version | null) { setPhoto(p); setCourante(v); setVoirAvant(false); }

  async function essai(texte: string) {
    if (!photo || actionEnCours.current || occupe || repriseNecessaire || !retoucheDisponible || texte.length > 4000) return;
    actionEnCours.current = true;
    setErreur(""); setOccupe("essai");
    if (texte) setBulles((b) => [...b, { de: "moi", texte }]);
    try {
      const p = await api<Photo>(`/photos/${photo.id}/essai`, { method: "POST", body: JSON.stringify({ demande: texte, depuis_version_id: courante?.id || null }) });
      poser(p, p.versions.at(-1) || null);
      setDemande("");
      const restants = p.essais_restants;
      setBulles((b) => [...b, { de: "ia", texte: (texte ? "Voilà. " : "Voilà la version annonce. ") + (p.alerte ? `Il vous reste ${restants} essai${restants > 1 ? "s" : ""} sur cette photo.` : "Ça vous plaît ? Sinon dites-moi quoi changer.") }]);
    } catch (e) {
      const err = e as ErreurApi;
      if (err.statut === 402) {
        setBulles((b) => [...b, { de: "ia", texte: err.message }]);
        try { await rafraichir(); } catch { /* L'erreur d'origine reste visible. */ }
      } else setErreur(err.message);
    } finally { setOccupe(null); actionEnCours.current = false; }
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
      if (resultat.creditConsomme || resultat.premierePhotoOfferte) {
        setInfoTelechargement({ offerte: resultat.premierePhotoOfferte, dateLimite: dateLisible(resultat.repriseJusquAu) });
        window.dispatchEvent(new Event("studio:credits-updated"));
      }
      const limite = dateLisible(resultat.repriseJusquAu);
      setBulles((b) => [...b, { de: "ia", texte: resultat.premierePhotoOfferte
        ? "Votre photo offerte est prête en HD. Aucun crédit n'a été utilisé."
        : resultat.creditConsomme ? `Votre photo est prête en HD. Un crédit a été utilisé.${limite ? ` Retouches incluses jusqu’au ${limite}.` : ""}`
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
  const original = photo?.original || photo?.vignette;
  const image = !courante ? original : courante.apercu;

  function saveDraft() {
    try { sessionStorage.setItem(`studio:${compte.id}:photo:${id}:draft`, demande); setBulles(b => [...b, { de: "ia", texte: "Votre demande est conservée dans ce navigateur. Vous pourrez lancer la retouche dès que le service sera disponible." }]); }
    catch { setErreur("Le navigateur n’a pas pu enregistrer la demande. Gardez une copie de votre texte."); }
  }

  return (
    <main className="editor-main work-editor">
      <Link href="/app/" className="text-action back-to-projects"><ArrowLeft size={16}/> Mes créations</Link>
      <div className="editor-title"><div><p className="eyebrow">VOTRE PHOTO</p><h1>{photo?.analyse?.piece || "Votre photo"}</h1><p>Votre original est conservé avec toutes ses versions.</p></div><div className="editor-actions">
        <Bouton data-photo-download onClick={telecharger} disabled={!courante || !!occupe || (periodeExpiree && !courante.hd)} chargement={occupe === "hd"}><Download size={17}/> {photo?.credite_le || photo?.offerte ? "Télécharger en HD" : "Garder en HD · 1 crédit"}</Bouton>
      </div></div>
      <div className="editor-grid"><section className="image-panel">
        <div className="result-status"><span><CheckCircle2 size={16}/>{courante ? `Version ${courante.numero}` : "Photo originale"}</span><small>{photo?.offerte && !photo.credite_le ? "Photo offerte" : "Original préservé"}</small></div>
        {image ? voirAvant && courante ? <Compare before={original} result={courante.apercu}/> : <div className="full-result connected-full-result"><img src={image} alt={courante ? "Votre photo retouchée" : "Votre photo originale"}/>{occupe === "essai" && <div role="status" className="connected-photo-pending"><Sparkles size={22}/> Retouche en cours…</div>}</div> : <div className="full-result connected-photo-pending">{erreur ? "La photo n’a pas pu être chargée." : "Chargement de votre photo…"}</div>}
        <div className="image-bottom"><button disabled={!courante} aria-pressed={voirAvant} onClick={() => setVoirAvant(!voirAvant)}><SlidersHorizontal size={16}/>{voirAvant ? "Photo entière" : "Comparer avec l’original"}</button><span>{courante ? "Aperçu · HD sans filigrane" : "Original préservé"}</span></div>
        <div className="version-gallery"><div className="history-toggle"><History size={18}/> Toutes vos versions <span>{(photo?.versions.length || 0) + 1}</span></div>
          {photo && <div className="work-version-list">
            <button className={`version-row ${!courante ? "is-selected" : ""}`} aria-pressed={!courante} onClick={() => { setCourante(null); setVoirAvant(false); }}><img src={original} alt="" width={92} height={62}/><span><small>LE POINT DE DÉPART</small><strong>Photo originale</strong><span>Votre photo, toujours conservée.</span></span>{!courante && <CheckCircle2 size={19}/>}</button>
            {photo.versions.map(v => <button key={v.id} className={`version-row ${courante?.id === v.id ? "is-selected" : ""}`} aria-pressed={courante?.id === v.id} disabled={!!occupe} onClick={() => { setCourante(v); setVoirAvant(false); }}><img src={v.apercu} alt="" width={92} height={62}/><span><small>VERSION {v.numero}</small><strong>{v.hd ? "Version HD" : "Votre retouche"}</strong><span>{v.consigne}</span></span>{courante?.id === v.id && <CheckCircle2 size={19}/>}</button>)}
          </div>}
        </div>
      </section><aside className="edit-controls">
        <p className="section-kicker">VOTRE PROCHAINE IDÉE</p><h2>Qu’est-ce qu’on change ?</h2><p className="editor-description">Décrivez simplement le résultat que vous imaginez.</p>
        {photo && <div className="connected-photo-tags"><Pastille>{photo.essais_restants} essais restants</Pastille>{photo.offerte && !photo.credite_le && <Pastille ton="accent">Photo offerte</Pastille>}</div>}
        <form className="draft-form" onSubmit={event => { event.preventDefault(); if (retoucheDisponible) void essai(demande.trim()); else saveDraft(); }}>
          <label htmlFor="photo-request">Votre demande</label><textarea id="photo-request" maxLength={4000} value={demande} disabled={!!occupe || repriseNecessaire} onChange={event => setDemande(event.target.value)} placeholder="Un salon plus lumineux, une déco plus chaleureuse…" rows={5}/>
          {!repriseNecessaire && <BriefAssistant kind="photo" request={demande} onUse={setDemande}/>}
          {demande.length > 4000 && <p className="st-error" role="alert">Raccourcissez votre demande à 4 000 caractères maximum. Votre texte est conservé.</p>}
          <button className="button dark" type="submit" disabled={!photo || !!occupe || repriseNecessaire || !demande.trim() || demande.length > 4000}>{occupe === "essai" ? "Retouche en cours…" : retoucheDisponible ? "Lancer la retouche" : "Enregistrer ma demande"}<ArrowRight size={17}/></button>
        </form>
        {!repriseNecessaire && <div className="request-ideas" aria-label="Idées de retouche">{["Plus de lumière", "Retirer le désordre", "Changer toute la décoration"].map(idea => <button key={idea} disabled={!!occupe} onClick={() => setDemande(idea)}>{idea}<Plus size={14}/></button>)}</div>}
        {!retoucheDisponible && <div className="generation-state"><Info size={18}/><p><strong>Retouche momentanément indisponible</strong>Préparez votre demande. Aucun crédit n’est consommé.</p></div>}
        {photo && repriseNecessaire && <div className="generation-state"><Info size={18}/><div><p><strong>{periodeExpiree ? "Période de retouche terminée" : "Tous les essais ont été utilisés"}</strong>Un crédit ouvre 7 jours supplémentaires. Vos versions restent disponibles.</p><Bouton onClick={event => { retourFocus.current = event.currentTarget; setConfirmationReprise(true); }} disabled={!!occupe || !retoucheDisponible}>Reprendre · 1 crédit</Bouton></div></div>}
        {finPeriode && !repriseNecessaire && <p className="demo-help">Retouches incluses jusqu’au {finPeriode}.</p>}
        <Message texte={erreur}/>
        {bulles.length > 0 && <p className="connected-photo-feedback" role="status">{bulles.at(-1)?.texte}</p>}
        <Link className="text-action" href="/demo/aide/#credits">Comprendre les crédits et les 7 jours <ArrowRight size={15}/></Link>
      </aside></div>
      {dialogueOuvert && <dialog ref={dialogue} onCancel={(event) => { event.preventDefault(); fermerDialogue(); }}
        aria-labelledby="download-info-title" aria-describedby="download-info-copy"
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-line bg-surface p-7 text-fg shadow-2xl backdrop:bg-black/65 sm:p-9">
        <button type="button" onClick={fermerDialogue} disabled={occupe === "reprise"} aria-label="Fermer cette information"
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-fg-muted transition hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"><X className="size-5" /></button>
        <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent"><Download className="size-6" /></div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">{confirmationReprise ? "Avant de reprendre" : "Information importante"}</p>
        <h2 id="download-info-title" className="mt-2 pr-9 text-2xl font-semibold tracking-tight">{confirmationReprise ? "Ouvrir une nouvelle période ?" : infoTelechargement?.reprise ? "Vos retouches sont réactivées" : "Votre photo est prête en HD"}</h2>
        <div id="download-info-copy" className="mt-4 space-y-3 text-base leading-7 text-fg-muted">
          {confirmationReprise ? <>
            <p><strong className="text-fg">1 crédit sera utilisé maintenant.</strong> Vous disposerez de 7 jours pour modifier cette photo. Ses versions précédentes sont conservées et les téléchargements HD sont inclus.</p>
            <p className="text-sm">La limite quotidienne d’essais continue de s’appliquer.</p>
          </> : <>
            <p>{infoTelechargement?.reprise ? "Un crédit a été utilisé pour ouvrir cette nouvelle période." : infoTelechargement?.offerte ? "C’est votre photo offerte : aucun crédit n’a été utilisé." : "Un crédit a été utilisé pour votre premier téléchargement HD."}</p>
            {infoTelechargement?.dateLimite ? <p>Vous pouvez modifier cette photo sans nouveau crédit jusqu’au <strong className="text-fg">{infoTelechargement.dateLimite}</strong>, dans la limite des essais disponibles.</p> : <p>La date limite n’a pas été reçue du serveur. Rechargez la page pour consulter la période exacte ; aucun nouveau délai n’est créé par ce message.</p>}
            <p>Après cette période, un nouveau crédit sera nécessaire pour reprendre les retouches. Télécharger à nouveau ne prolonge pas le délai.</p>
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

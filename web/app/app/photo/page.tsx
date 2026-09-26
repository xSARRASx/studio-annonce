"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Send, Sparkles, RotateCcw, Eye, X } from "lucide-react";
import { api, telechargerPhoto, ErreurApi, type Photo, type Version } from "@/lib/api";
import { Bouton, Message, Pastille } from "@/components/ui";

type Bulle = { de: "ia" | "moi"; texte: string };

function dateLisible(date: string | null): string | null {
  if (!date || Number.isNaN(Date.parse(date))) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(date));
}

function Atelier() {
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
  const bas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let annule = false;
    api<Photo>(`/photos/${id}`).then(async (p) => {
      if (annule) return;
      setErreur("");
      if (!p.analyse) {
        setOccupe("analyse");
        p = await api<Photo>(`/photos/${id}/analyser`, { method: "POST" });
      }
      if (annule) return;
      poser(p, p.versions.at(-1) || null);
      const a = p.analyse;
      setBulles([
        { de: "ia", texte: a ? `${a.piece}. Ce que je vois à corriger : ${a.defauts.join(", ")}.` : "Votre photo est prête à être retouchée." },
        { de: "ia", texte: p.versions.length ? "Retrouvez toutes vos versions ci-dessous et choisissez celle à poursuivre." : "Je vous fais la version annonce ? Lumière pro, désordre retiré, rien d'autre ne bouge." + (a?.question ? ` Et une question : ${a.question}` : "") },
      ]);
    }).catch((e) => { if (!annule) setErreur(e.message); })
      .finally(() => { if (!annule) setOccupe(null); });
    return () => { annule = true; };
  }, [id]);
  useEffect(() => { bas.current?.scrollIntoView({ behavior: "smooth" }); }, [bulles, occupe]);
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
    if (!photo || actionEnCours.current || occupe || repriseNecessaire) return;
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
  const original = photo?.vignette.replace("vignette.webp", "original.jpg");
  const image = voirAvant || !courante ? original : courante.apercu;

  return (
    <div className="apparait grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-3">
        <Link href={photo ? `/app/logement?id=${photo.logement_id}` : "/app"} className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Retour au logement</Link>
        <div className="relative rounded-3xl overflow-hidden bg-surface border border-line">
          {image ? <img src={image} alt="" className="w-full max-h-[78vh] object-contain bg-black" /> : <div className="aspect-[3/4] grid place-items-center text-fg-muted">Chargement…</div>}
          {occupe === "essai" && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm grid place-items-center text-sm"><span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 border border-line"><Sparkles className="size-4 text-accent animate-pulse" /> Retouche en cours, une dizaine de secondes…</span></div>}
          {courante && <button onMouseDown={() => setVoirAvant(true)} onMouseUp={() => setVoirAvant(false)} onMouseLeave={() => setVoirAvant(false)} onTouchStart={() => setVoirAvant(true)} onTouchEnd={() => setVoirAvant(false)}
            className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur px-3 h-9 text-xs border border-white/10 select-none"><Eye className="size-3.5" /> {voirAvant ? "Avant" : "Maintenir pour voir l'avant"}</button>}
          {courante && !voirAvant && <span className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur px-3 h-9 inline-flex items-center text-xs border border-white/10">Aperçu filigrané · la HD est nette</span>}
        </div>
        {photo && photo.versions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCourante(null)} className={`shrink-0 rounded-xl overflow-hidden border-2 ${!courante ? "border-accent" : "border-transparent"}`}><img src={original} alt="Original" className="h-16 w-12 object-cover" /></button>
            {photo.versions.map((v) => (
              <button key={v.id} onClick={() => setCourante(v)} title={v.consigne} className={`shrink-0 relative rounded-xl overflow-hidden border-2 ${courante?.id === v.id ? "border-accent" : "border-transparent"}`}>
                <img src={v.apercu} alt={`Essai ${v.numero}`} className="h-16 w-12 object-cover" />
                <span className="absolute bottom-0 inset-x-0 text-[10px] bg-black/60 text-center">{v.numero}</span>
              </button>))}
          </div>
        )}
      </div>

      <aside className="rounded-3xl bg-surface border border-line flex flex-col h-[78vh] lg:sticky lg:top-20">
        <div className="p-4 border-b border-line flex items-center gap-2 flex-wrap">
          <span className="font-medium">{photo?.analyse?.piece || "Analyse…"}</span>
          {photo && <Pastille ton={photo.alerte ? "alerte" : "neutre"}>{photo.essais_restants} essai{photo.essais_restants > 1 ? "s" : ""} restant{photo.essais_restants > 1 ? "s" : ""}</Pastille>}
          {photo?.offerte && !photo.credite_le && <Pastille ton="accent">photo offerte</Pastille>}
          {photo?.credite_le && <Pastille ton="ok">gardée</Pastille>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          {bulles.map((b, i) => (
            <div key={i} className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${b.de === "ia" ? "bg-surface-2" : "bg-accent text-accent-fg ml-auto"}`}>{b.texte}</div>))}
          {occupe === "analyse" && <div className="max-w-[90%] rounded-2xl px-4 py-2.5 bg-surface-2 text-fg-muted">Je regarde la photo…</div>}
          <Message texte={erreur} />
          <div ref={bas} />
        </div>
        <div className="p-3 border-t border-line space-y-2">
          {photo && repriseNecessaire && <div className="rounded-2xl border border-accent/35 bg-accent/10 p-3 text-sm space-y-2">
            <p className="font-medium">{periodeExpiree ? "Votre période de retouche est terminée" : "Tous les essais de cette période sont utilisés"}</p>
            <p className="text-fg-muted">Vos versions restent disponibles. Un crédit ouvre une nouvelle période de 7 jours avec de nouveaux essais et la HD incluse.</p>
            <Bouton className="w-full" onClick={(event) => { retourFocus.current = event.currentTarget; setConfirmationReprise(true); }} disabled={!!occupe}>Reprendre cette photo · 1 crédit</Bouton>
          </div>}
          {photo && !repriseNecessaire && finPeriode && <p className="px-1 text-xs text-fg-muted">Retouches incluses jusqu’au {finPeriode}. Les téléchargements ne prolongent pas cette date.</p>}
          {photo && photo.versions.length === 0 && !occupe && !repriseNecessaire && (
            <Bouton className="w-full" onClick={() => essai("")}><Sparkles className="size-4" /> Oui, fais la version annonce</Bouton>)}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (demande.trim()) essai(demande.trim()); }}>
            <input value={demande} onChange={(e) => setDemande(e.target.value)} aria-label="Votre demande de retouche" placeholder="Enlève le vélo, meuble la chambre, mur en beige…" disabled={!!occupe || repriseNecessaire}
                   className="min-w-0 flex-1 h-11 rounded-full bg-surface-2 border border-line px-4 text-sm outline-none focus:border-accent" />
            <button type="submit" aria-label="Envoyer la demande" disabled={!!occupe || repriseNecessaire || !demande.trim()} className="size-11 rounded-full bg-accent text-accent-fg grid place-items-center disabled:opacity-40"><Send className="size-4" /></button>
          </form>
          <div className="flex gap-2">
            <Bouton variante="secondaire" className="flex-1" onClick={() => setCourante(null)} disabled={!courante || !!occupe}><RotateCcw className="size-4" /> Repartir de l&apos;original</Bouton>
            <Bouton className="flex-1" data-photo-download onClick={telecharger} disabled={!courante || !!occupe || (periodeExpiree && !courante.hd)} chargement={occupe === "hd"}><Download className="size-4" /> {photo?.credite_le || photo?.offerte ? "Télécharger en HD" : "Garder · 1 crédit"}</Bouton>
          </div>
        </div>
      </aside>
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
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Atelier /></Suspense>;
}

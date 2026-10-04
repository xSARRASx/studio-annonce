"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, ImagePlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, ErreurApi, type Logement, type Photo } from "@/lib/api";
import { envoyerPhoto } from "@/lib/photo-upload";
import { useStudioAccount } from "@/components/studio-account";
import { CreationConfirmation, CreationNotice, type CreationAction } from "@/components/creation-actions";
import { Bouton, Message, Pastille } from "@/components/ui";

function PageLogement() {
  const router = useRouter();
  const { compte, sante } = useStudioAccount();
  const parametres = useSearchParams();
  const id = parametres.get("id") || "";
  const pourVideo = parametres.get("suite") === "video";
  const [logement, setLogement] = useState<Logement | null>(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null);
  const [glisse, setGlisse] = useState(false);
  const [selection, setSelection] = useState<string[]>(() => (parametres.get("selection") || "").split(",").filter(Boolean));
  const [afficherArchives, setAfficherArchives] = useState(parametres.get("archives") === "true");
  const [action, setAction] = useState<CreationAction | null>(null);
  const [notice, setNotice] = useState("");
  const [archiveOccupe, setArchiveOccupe] = useState(false);
  const [demandeCommune, setDemandeCommune] = useState("");
  const [lotEnCours, setLotEnCours] = useState(false);
  const [lotEtat, setLotEtat] = useState<Record<string, "attente" | "encours" | "prete" | "echec" | "incertain">>({});
  const [lotMessages, setLotMessages] = useState<Record<string, string>>({});
  const champ = useRef<HTMLInputElement>(null);
  const lancementLot = useRef(false);

  useEffect(() => { if (id) api<Logement>(`/logements/${id}?archives=${afficherArchives ? "true" : "false"}`).then(setLogement).catch((e) => setErreur(e.message)); }, [id, afficherArchives]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) { try { const draft = sessionStorage.getItem(`studio:${compte.id}:batch:${id}:draft`); if (draft) setDemandeCommune(draft); } catch { /* Le champ reste modifiable. */ } } });
    return () => { active = false; };
  }, [id, compte.id]);
  const choisies = logement?.photos.filter(photo => selection.includes(photo.id)) || [];
  const nouvellesChoisies = choisies.filter(photo => photo.essais === 0);
  const cout = compte.gratuit_illimite ? 0 : choisies.filter(photo => !photo.offerte && !photo.creditee).length;
  function basculer(photoId: string) {
    setSelection(current => current.includes(photoId) ? current.filter(id => id !== photoId) : [...current, photoId]);
  }
  function commencerSelection() {
    if (!selection.length) return;
    const ordre = logement?.photos.filter(photo => selection.includes(photo.id)).map(photo => photo.id) || [];
    if (ordre.length) router.push(`/app/photo/?id=${ordre[0]}&lot=${encodeURIComponent(ordre.join(","))}`);
  }
  function utiliserPourVideo() {
    if (!selection.length) return;
    const key = `studio:${compte.id}:video-plan`;
    try {
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...current, selectedIds: selection }));
    } catch { setErreur("Le choix n’a pas pu être conservé dans ce navigateur. Réessayez depuis Photos → vidéo."); return; }
    router.push("/app/#visite");
  }
  async function modifierArchive(photoId: string, archiver: boolean) {
    if (archiveOccupe || lotEnCours) return;
    setArchiveOccupe(true); setErreur("");
    try {
      await api(`/photos/${photoId}/${archiver ? "archiver" : "restaurer"}`, { method: "POST" });
      setSelection(ids => ids.filter(id => id !== photoId));
      setAction(null); setNotice(archiver ? "Photo archivée." : "Photo restaurée.");
      setLogement(await api<Logement>(`/logements/${id}?archives=${afficherArchives ? "true" : "false"}`));
      window.dispatchEvent(new Event("studio:credits-updated"));
    } catch (cause) { setErreur((cause as Error).message); }
    finally { setArchiveOccupe(false); }
  }

  async function lancerLot() {
    const photos = nouvellesChoisies.map(photo => photo.id);
    const demande = demandeCommune.trim();
    if (lancementLot.current || lotEnCours || photos.length < 2 || !demande || !sante?.retouche_disponible) return;
    lancementLot.current = true;
    setLotEnCours(true); setErreur("");
    setLotEtat(Object.fromEntries(photos.map(id => [id, "attente"])));
    setLotMessages({});
    let prochain = 0;
    async function traiter(photoId: string) {
      setLotEtat(avant => ({ ...avant, [photoId]: "encours" }));
      let nombreVersions = 0;
      try {
        const avant = await api<Photo>(`/photos/${photoId}`);
        nombreVersions = avant.versions.length;
        if (nombreVersions) throw new Error("Cette photo a déjà une retouche. Ouvrez-la pour choisir la version à corriger.");
        await api(`/photos/${photoId}/demande`, { method: "PATCH", body: JSON.stringify({ demande }) });
        await api<Photo>(`/photos/${photoId}/essai`, { method: "POST", body: JSON.stringify({ demande, depuis_version_id: null }) });
        setLotEtat(etat => ({ ...etat, [photoId]: "prete" }));
        setLogement(home => home && ({ ...home, photos: home.photos.map(photo => photo.id === photoId ? { ...photo, essais: photo.essais + 1 } : photo) }));
      } catch (cause) {
        const erreur = cause as ErreurApi;
        if (erreur.statut === 0 || erreur.statut === 409) {
          // Une réponse coupée ne signifie pas que la génération a échoué : ne jamais relancer à l'aveugle.
          for (let essai = 0; essai < 36; essai++) {
            await new Promise(resolve => window.setTimeout(resolve, 5000));
            try {
              const photo = await api<Photo>(`/photos/${photoId}`);
              if (photo.versions.length > nombreVersions) {
                setLotEtat(etat => ({ ...etat, [photoId]: "prete" }));
                setLogement(home => home && ({ ...home, photos: home.photos.map(item => item.id === photoId ? { ...item, essais: photo.essais } : item) }));
                return;
              }
            } catch { /* Le contrôle suivant relira l'état, sans créer une deuxième retouche. */ }
          }
          setLotEtat(etat => ({ ...etat, [photoId]: "incertain" }));
          setLotMessages(messages => ({ ...messages, [photoId]: "Résultat non confirmé. Ouvrez la photo avant de relancer." }));
        } else {
          setLotEtat(etat => ({ ...etat, [photoId]: "echec" }));
          setLotMessages(messages => ({ ...messages, [photoId]: erreur.message }));
        }
      }
    }
    async function ouvrier() {
      while (prochain < photos.length) await traiter(photos[prochain++]);
    }
    try { await Promise.all([ouvrier(), ouvrier()]); }
    finally { lancementLot.current = false; setLotEnCours(false); window.dispatchEvent(new Event("studio:credits-updated")); }
  }

  async function deposer(fichiers: FileList | File[]) {
    if (envoi || lotEnCours) return;
    const liste = Array.from(fichiers).filter((f) => f.type.startsWith("image/"));
    if (!liste.length) return;
    setErreur(""); setEnvoi({ fait: 0, total: liste.length });
    for (let i = 0; i < liste.length; i++) {
      try {
        const photo = await envoyerPhoto(liste[i], id);
        setLogement((l) => l && { ...l, photos: [...l.photos, { id: photo.id, vignette: photo.vignette, essais: 0, gardee: false, offerte: photo.offerte, creditee: !!photo.credite_le, archivee: false }] });
      } catch (e) { setErreur((e as Error).message); }
      setEnvoi({ fait: i + 1, total: liste.length });
    }
    setTimeout(() => setEnvoi(null), 800);
  }

  return (
    <div className="connected-legacy apparait space-y-6">
      <Link href="/app" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"><ArrowLeft className="size-4" /> Mes créations</Link>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{logement?.nom || "…"}</h1>
          <p className="text-fg-muted mt-1">{logement?.ville} {logement && <Pastille>{logement.type_annonce}</Pastille>}</p>
        </div>
        <Bouton className="ml-auto" onClick={() => champ.current?.click()}><ImagePlus className="size-4" /> Ajouter des photos</Bouton>
        <input ref={champ} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && deposer(e.target.files)} />
      </div>
      {logement?.source_url && <p className="text-sm text-fg-muted">Annonce liée : <a href={logement.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">voir le lien d’origine</a></p>}
      <Message texte={erreur} />
      <div className="batch-manage-bar"><button type="button" aria-pressed={afficherArchives} onClick={() => setAfficherArchives(value => !value)}>{afficherArchives ? "Masquer les archives" : "Voir les photos archivées"}</button><span>Une photo archivée disparaît de Mes créations, mais peut être restaurée ici.</span></div>
      {action && <CreationConfirmation key={`${action.id}-${action.action}`} item={action} onClose={() => setAction(null)} onDone={() => {
        setSelection(ids => ids.filter(item => item !== action.id));
        setLogement(home => home && ({ ...home, photos: home.photos.filter(item => item.id !== action.id) }));
        setNotice(action.action === "archiver" ? "Photo archivée. Cliquez sur Voir les photos archivées pour la retrouver." : "Photo déplacée dans la corbeille de Mes créations.");
        setAction(null);
      }}/>}<CreationNotice text={notice} onClose={() => setNotice("")}/>

      <div onDragOver={(e) => { e.preventDefault(); setGlisse(true); }} onDragLeave={() => setGlisse(false)}
           onDrop={(e) => { e.preventDefault(); setGlisse(false); deposer(e.dataTransfer.files); }}
           className={`rounded-3xl border-2 border-dashed transition p-8 text-center ${glisse ? "border-accent bg-accent/5" : "border-line"}`}>
        <Upload className="size-6 mx-auto text-fg-muted" />
        <p className="mt-2 text-sm text-fg-muted">Glissez vos photos ici, ou <button className="text-accent underline-offset-2 hover:underline" onClick={() => champ.current?.click()}>choisissez-les</button>. Toutes les pièces, même en désordre : c&apos;est le travail de l&apos;IA.</p>
        {envoi && <p className="mt-3 text-sm text-accent">Envoi {envoi.fait} / {envoi.total}…</p>}
      </div>
      {logement && logement.photos.length > 0 && (
        <>
        <div className="batch-property-bar"><div><strong>{selection.length} photo{selection.length > 1 ? "s" : ""} choisie{selection.length > 1 ? "s" : ""}</strong><p>{pourVideo ? "Choisissez les photos à mettre dans votre projet vidéo, dans l’ordre souhaité." : `Si vous gardez toutes ces retouches en HD : ${cout} crédit${cout > 1 ? "s" : ""}. Chaque photo se décide séparément.`}</p></div><button className="button dark" disabled={!selection.length || lotEnCours} onClick={pourVideo ? utiliserPourVideo : commencerSelection}>{pourVideo ? "Utiliser pour ma vidéo →" : "Ouvrir ma sélection →"}</button></div>
        {selection.length >= 2 && <section className="batch-retouch-panel" aria-labelledby="batch-retouch-title"><h2 id="batch-retouch-title">Retoucher plusieurs photos ensemble</h2><p>{nouvellesChoisies.length === 0 ? "Vos retouches sont prêtes. Ouvrez chaque photo pour comparer ses versions." : <>La même consigne s’applique aux {nouvellesChoisies.length} photo{nouvellesChoisies.length > 1 ? "s" : ""} sélectionnée{nouvellesChoisies.length > 1 ? "s" : ""} sans retouche. Deux retouches au maximum avancent en parallèle ; chaque résultat reste accessible séparément.</>}</p>
          <label htmlFor="batch-retouch-request">Ce que vous souhaitez améliorer</label><textarea id="batch-retouch-request" maxLength={4000} rows={3} value={demandeCommune} disabled={lotEnCours} onChange={event => setDemandeCommune(event.target.value)} placeholder="Ex. : rends chaque pièce plus lumineuse, range les objets visibles et conserve les ouvertures et les équipements fixes."/>
          <button type="button" className="button dark" disabled={lotEnCours || nouvellesChoisies.length < 2 || !demandeCommune.trim() || !sante?.retouche_disponible} onClick={() => void lancerLot()}>{lotEnCours ? "Retouches en cours…" : nouvellesChoisies.length ? `Lancer ${nouvellesChoisies.length} retouches` : "Retouches déjà réalisées"}</button>
          {!sante?.retouche_disponible && <p role="status">La retouche n’est pas disponible sur ce compte pour le moment.</p>}
          {nouvellesChoisies.length < selection.length && <p>Les photos déjà retouchées s’ouvrent une par une pour choisir la version de départ.</p>}
          {Object.keys(lotEtat).length > 0 && <ul className="batch-retouch-status" aria-live="polite">{logement.photos.filter(photo => lotEtat[photo.id]).map(photo => <li key={photo.id}><span>Photo {logement.photos.indexOf(photo) + 1} · {lotEtat[photo.id] === "prete" ? "Prête" : lotEtat[photo.id] === "encours" ? "En cours" : lotEtat[photo.id] === "attente" ? "En attente" : lotEtat[photo.id] === "incertain" ? "À vérifier" : "Échec"}</span>{lotMessages[photo.id] && <small>{lotMessages[photo.id]}</small>}<Link href={`/app/photo/?id=${photo.id}`}>Voir la photo →</Link></li>)}</ul>}
          <p className="batch-retouch-note">Gardez cette page ouverte pendant les retouches. Les résultats terminés restent dans Mes créations. Aucun nouveau crédit n’est débité au lancement ; vous choisissez ensuite les versions HD à garder.</p>
        </section>}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {logement.photos.map((p, i) => (
            <li key={p.id}>
              <button type="button" aria-pressed={selection.includes(p.id)} aria-label={`Sélectionner la photo ${i + 1}`} disabled={lotEnCours || !!p.archivee} onClick={() => basculer(p.id)} className={`batch-property-photo block relative rounded-2xl overflow-hidden bg-surface-2 border group aspect-[3/4] w-full ${selection.includes(p.id) ? "batch-property-selected" : "border-line"}`}>
                <img src={p.vignette} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
                <span className="batch-property-check">{selection.includes(p.id) ? "✓" : ""}</span>
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2 text-xs">
                  <span>Photo {i + 1}</span>
                  {p.gardee ? <span className="ml-auto inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-3.5" /> gardée</span>
                    : p.essais > 0 ? <span className="ml-auto text-fg-muted">{p.essais} essai{p.essais > 1 ? "s" : ""}</span> : <span className="ml-auto text-accent">à retoucher</span>}
                </div>
              </button>
              <div className="batch-photo-actions"><Link href={`/app/photo?id=${p.id}`} className="batch-property-open">Ouvrir →</Link>{p.archivee ? <button type="button" disabled={archiveOccupe} onClick={() => void modifierArchive(p.id, false)}>Restaurer</button> : <button type="button" disabled={archiveOccupe || lotEnCours} onClick={() => setAction({ id: p.id, nature: "photos", titre: p.titre || `Photo ${i + 1}`, vignette: p.vignette, action: "archiver" })}>Archiver</button>}<button type="button" className="creation-delete" disabled={archiveOccupe || lotEnCours} onClick={() => setAction({ id: p.id, nature: "photos", titre: p.titre || `Photo ${i + 1}`, vignette: p.vignette, action: "supprimer" })}>Supprimer</button></div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><PageLogement /></Suspense>;
}

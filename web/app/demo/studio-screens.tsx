"use client";
import { appendPhotoRequest } from "../../../shared/photo-request";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Building2, Camera, ChevronDown, ChevronRight, Clock3, Download, Film, FileText, History, ImagePlus, Images, Plus, Sparkles, X } from "lucide-react";
import { asset, dateText, isExpired, storageError, type DemoLibrary, type DemoProject, type DemoVersion } from "./library";
import { preparerPhoto } from "@/lib/photo-upload";
import { photoPreparation } from "@/lib/photo-preparation";
import { BriefAssistant } from "./brief-assistant";
import { CreationBack } from "./creation-hub";
import "./studio-screens.css";
import "./photo-gallery.css";

type Source = (project: DemoProject, version?: DemoVersion) => string;
export const UNASSIGNED_PROPERTY = "Sans logement";

export function OptionalProperty({ options, choice, name, onChoice, onName, disabled = false }: {
  options: string[]; choice: string; name: string; onChoice: (value: string) => void; onName: (value: string) => void; disabled?: boolean;
}) {
  const selected = choice === "__nouveau" ? name.trim() : choice;
  return <details className="st-optional-property"><summary><Building2 size={17}/><span>Ranger dans un logement<small>{selected && selected !== UNASSIGNED_PROPERTY ? selected : "Facultatif · vous pourrez le faire plus tard"}</small></span><ChevronDown size={17}/></summary>
    <div className="st-homes" role="radiogroup" aria-label="Rangement facultatif">
      <button type="button" role="radio" disabled={disabled} aria-checked={!choice || choice === UNASSIGNED_PROPERTY} onClick={() => onChoice("")}>Plus tard</button>
      {options.filter(option => option !== UNASSIGNED_PROPERTY).map(option => <button type="button" role="radio" disabled={disabled} aria-checked={choice === option} key={option} onClick={() => onChoice(option)}>{option}</button>)}
      <button type="button" role="radio" disabled={disabled} aria-checked={choice === "__nouveau"} onClick={() => onChoice("__nouveau")}><Plus size={15}/> Nouveau logement</button>
    </div>
    {choice === "__nouveau" && <label className="st-field">Nom du logement<input value={name} disabled={disabled} onChange={event => onName(event.target.value)} maxLength={100} placeholder="Ex. : Villa avec piscine"/></label>}
    <p>Sans choix, vos photos restent dans « Sans logement ». Vous pourrez les ranger depuis leur fiche.</p>
  </details>;
}
const IDEES = ["Plus de lumière", "Ranger et désencombrer", "Changer toute la déco", "Faire le lit"];
/* Les logements de la personne. Les exemples ne comptent pas comme un logement à choisir. */
export const logementsDe = (library: DemoLibrary, avecExemples = true) => {
  const noms = new Map<string, number>();
  for (const p of library.projects) if (avecExemples || !p.sample) noms.set(p.property, Math.max(noms.get(p.property) || 0, p.updatedAt));
  return [...noms.entries()].sort((a, b) => b[1] - a[1]).map(([nom]) => nom);
};
function statut(p: DemoProject, now: number) {
  if (isExpired(p, now)) return "Retouches à renouveler";
  if (p.editUntil) return "Retouches ouvertes";
  if (p.saved) return "Version gardée";
  if (p.kind === "video") return "À regarder";
  return p.versions.length > 1 ? "À choisir" : "À retoucher";
}

/* Mes photos : d'abord une liste, rangée par logement. Rien encore ? Un seul bouton pour commencer. */
export function PhotoList({ library, source, now, busy, onCreate, onAddPhoto, onExample, onOpen, onManageProperty, onArchive, onDelete, extraContent }: {
  library: DemoLibrary; source: Source; now: number; busy: boolean;
  onCreate: () => void; onAddPhoto: (logement: string) => void; onExample: (kind: "photo" | "video") => void; onOpen: (p: DemoProject) => void; onManageProperty?: (photoId: string) => void; onArchive?: (p: DemoProject) => void; onDelete?: (p: DemoProject) => void; extraContent?: ReactNode;
}) {
  const [recherche, setRecherche] = useState("");
  const [ordre, setOrdre] = useState<"recent" | "ancien">("recent");
  const logements = logementsDe(library, false);
  const miennes = library.projects.filter(p => !p.sample);
  const exemples = library.projects.filter(p => p.sample).sort((a, b) => b.updatedAt - a.updatedAt);
  const termes = recherche.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const groupes = logements.map(l => ({
    nom: l,
    photos: miennes.filter(p => p.property === l && (!termes || `${p.title} ${l}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").includes(termes)))
      .sort((a, b) => ordre === "recent" ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt),
  })).filter(g => g.photos.length);
  const ligne = (p: DemoProject) => <li key={p.id}><button className="st-row" onClick={() => onOpen(p)}>
    <span className="st-thumb">{p.kind === "photo" ? <Image src={source(p)} alt="" fill unoptimized sizes="120px"/> : p.sample ? <Image src={asset("visite/sejour.webp")} alt="" fill sizes="120px"/> : <video src={source(p)} muted preload="metadata"/>}{p.kind === "video" && <span className="st-thumb-tag"><Film size={12}/></span>}</span>
    <span className="st-row-main"><strong>{p.title}</strong><small>{p.kind === "video" ? "Vidéo" : "Photo"} · {p.versions.length} {p.versions.length > 1 ? "versions" : "version"} · {dateText(p.createdAt)}</small></span>
    <span className={`st-status ${isExpired(p, now) ? "late" : p.saved || p.editUntil ? "ok" : ""}`}>{statut(p, now)}</span>
    <ChevronRight size={20} className="st-chevron"/>
  </button>{!p.sample && (onArchive || onDelete) && <div className="creation-row-actions">{onArchive && <button type="button" onClick={() => onArchive(p)}>Archiver</button>}{onDelete && <button type="button" className="creation-delete" onClick={() => onDelete(p)}>Supprimer</button>}</div>}</li>;
  /* Les exemples ne sont pas un logement : ils ont leur partie à eux, toujours la même, tout en bas. */
  const vus = new Set(exemples.map(p => p.kind));
  const cartesExemples = [
    { kind: "photo" as const, image: "salon-deco-complete.webp", titre: "Le salon", type: "Photo", texte: "Une photo de salon retouchée 4 fois : plus de lumière, couleurs chaudes, nouvelle déco. Comparez les versions." },
    { kind: "video" as const, image: "visite/sejour.webp", titre: "La visite", type: "Vidéo", texte: "Une maquette de visite montée à partir de photos fictives. Découvrez le rythme et les mouvements." },
  ];
  const partieExemples = <section className="st-examples" aria-labelledby="st-examples-title">
    <div className="st-examples-head"><h2 id="st-examples-title"><Sparkles size={17}/> Exemples</h2><p>Des parcours préparés, séparés de vos créations. Aucun crédit utilisé.</p></div>
    <div className="pg-app-entry"><div><strong>8 photos, des transformations à explorer.</strong><p>Photo originale, demande et proposition : découvrez le parcours pas à pas.</p></div><Link href="/exemples/salon-canape-rouille/#parcours">Découvrir le parcours <ArrowRight size={17}/></Link><Link href="/exemples/">Tous les exemples <ArrowUpRight size={17}/></Link></div>
    <div className="st-examples-grid">{cartesExemples.map(c => <button key={c.kind} className="st-ex-card" disabled={busy} onClick={() => onExample(c.kind)}>
      <span className="st-ex-img"><Image src={asset(c.image)} alt="" fill sizes="(max-width: 700px) 90vw, 320px" unoptimized/><span className="st-ex-type">{c.kind === "video" ? <Film size={12}/> : <Images size={12}/>} {c.type}</span></span>
      <span className="st-ex-body"><strong>{c.titre}</strong><small>{c.texte}</small><span className="st-ex-go">{vus.has(c.kind) ? "Rouvrir" : "Ouvrir l’exemple"} <ArrowRight size={14}/></span></span>
    </button>)}</div>
  </section>;

  if (!miennes.length) return <main className="st-main">
    <section className="st-first">
      <div className="st-first-art" aria-hidden="true">
        <div className="st-first-card st-c1"><Image src={asset("salon-avant.webp")} alt="" fill sizes="220px" unoptimized/></div>
        <div className="st-first-card st-c2"><Image src={asset("salon-apres.webp")} alt="" fill sizes="220px" unoptimized/></div>
        <span className="st-first-plus"><Plus size={26}/></span>
      </div>
      <div className="st-first-copy">
        <p className="section-kicker">VOTRE STUDIO EST PRÊT</p>
        <h1>Votre première création commence ici.</h1>
        <p>Une photo à retoucher, une image à imaginer ou une vidéo à préparer ? Choisissez, on vous accompagne.</p>
        <div className="st-actions">
          <button className="button dark st-big" onClick={onCreate}><Plus size={18}/> Commencer une création</button>
        </div>
      </div>
    </section>
    {extraContent}
    {partieExemples}
  </main>;

  return <main className="st-main">
    <div className="st-head">
      <div><p className="eyebrow">VOTRE BIBLIOTHÈQUE</p><h1>Mes créations</h1><p>Vos photos et vidéos, rangées par logement. Ouvrez une création pour la retrouver.</p></div>
      <div className="st-actions"><button className="button dark" onClick={onCreate}><Plus size={18}/> Créer</button></div>
    </div>
    <div className="st-library-tools"><label>Rechercher une création<input type="search" value={recherche} onChange={event => setRecherche(event.target.value)} placeholder="Salon, chambre, logement…"/></label><label>Trier<select value={ordre} onChange={event => setOrdre(event.target.value as "recent" | "ancien")}><option value="recent">Plus récentes</option><option value="ancien">Plus anciennes</option></select></label></div>
    {termes && !groupes.length && <p className="st-empty-line">Aucune création ne correspond à cette recherche.</p>}
    {groupes.map(g => <section key={g.nom} className="st-group" aria-label={g.nom}>
      <div className="st-group-head"><h2><Building2 size={18}/> {g.nom}</h2><span>{g.photos.length} {g.photos.length > 1 ? "créations" : "création"}</span><button className="text-action" onClick={() => onAddPhoto(g.nom)}><Plus size={15}/> Ajouter une photo</button>{onManageProperty && <button className="text-action" onClick={() => onManageProperty(g.photos[0].id)}>Gérer les photos</button>}</div>
      <ul className="st-list">{g.photos.map(ligne)}</ul>
    </section>)}
    {extraContent}
    {partieExemples}
  </main>;
}

/* Nouvelle retouche : une page à rouvrir à chaque fois. Logement, photos, idée. */
export function CreateView({ library, busy, initial, onCreate, onExample, onCancel, onImagine, onBatch, draftKey, maxRequest = 20000 }: {
  maxRequest?: number; draftKey?: string;
  library: DemoLibrary; busy: boolean; initial?: string;
  onCreate: (files: File[], logement: string, demande: string) => Promise<void>; onExample: () => void; onCancel: () => void; onImagine: () => void; onBatch?: () => void;
}) {
  const logements = logementsDe(library, false);
  const [choix, setChoix] = useState(initial && initial !== UNASSIGNED_PROPERTY ? logements.includes(initial) ? initial : "__nouveau" : "");
  const [nouveau, setNouveau] = useState(initial && !logements.includes(initial) ? initial : "");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [demande, setDemande] = useState("");
  const [erreur, setErreur] = useState("");
  const [glisse, setGlisse] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [draftReady, setDraftReady] = useState(!draftKey);
  const [draftNotice, setDraftNotice] = useState("");
  useEffect(() => {
    if (!draftKey) return;
    let active = true;
    void photoPreparation(draftKey).then(saved => { if (saved && active) { setFichiers(saved.fichiers); setDemande(saved.demande); setChoix(saved.choix); setNouveau(saved.nouveau); } }).catch(() => { if (active) setDraftNotice("Sauvegarde locale indisponible : continuez pour enregistrer les photos dans votre compte."); }).finally(() => { if (active) setDraftReady(true); });
    return () => { active = false; };
  }, [draftKey]);
  useEffect(() => {
    if (!draftReady || !draftKey) return;
    void photoPreparation(draftKey, { fichiers, demande, choix, nouveau }).then(() => {
      setDraftNotice(fichiers.length || demande ? "Brouillon enregistré sur cet appareil. Retrouvez-le dans Mes créations → Brouillons." : "");
      window.dispatchEvent(new Event("studio:drafts-updated"));
    }).catch(() => setDraftNotice("Le brouillon n’a pas pu être enregistré sur cet appareil. Continuez pour enregistrer vos photos dans votre compte."));
  }, [draftReady, draftKey, fichiers, demande, choix, nouveau]);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const apercus = useMemo(() => fichiers.map(file => URL.createObjectURL(file)), [fichiers]);
  useEffect(() => () => apercus.forEach(url => URL.revokeObjectURL(url)), [apercus]);
  const logement = (choix === "__nouveau" ? nouveau.trim() : choix) || UNASSIGNED_PROPERTY;
  const premiere = !library.projects.some(project => !project.sample);
  function recevoir(liste: File[]) {
    if (envoi || busy) return;
    const images = liste.filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    if (!images.length) { setErreur("Choisissez des photos JPG, PNG ou WebP."); return; }
    if (images.some(f => f.size > 30 * 1024 * 1024)) { setErreur("Chaque photo doit faire moins de 30 Mo."); return; }
    const added = images.filter(file => !fichiers.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified));
    if (fichiers.length + added.length > 40) { setErreur("Ajoutez jusqu’à 40 photos à la fois."); return; }
    if (draftKey) for (const file of added) void preparerPhoto(file).catch(() => {});
    setErreur(images.length < liste.length ? "Seuls les fichiers JPG, PNG et WebP ont été ajoutés." : ""); setFichiers(previous => [...previous, ...added]);
  }
  async function creer(e: React.FormEvent) {
    e.preventDefault();
    if (!fichiers.length || !logement || envoi || demande.length > maxRequest) return;
    setEnvoi(true); setErreur("");
    try {
      await onCreate(fichiers, logement, demande.trim());
      if (draftKey) await photoPreparation(draftKey, { fichiers: [], demande: "", choix: "", nouveau: "" });
      setFichiers([]); setDemande("");
    }
    catch (cause) { setErreur(storageError(cause)); } finally { setEnvoi(false); }
  }
  return <main className="st-main st-create">
    <CreationBack onClick={onCancel}/>
    <p className="eyebrow">{premiere ? "VOTRE PREMIÈRE RETOUCHE" : "NOUVELLE RETOUCHE"}</p>
    <h1>{premiere ? "Vos premières photos à sublimer." : "De nouvelles photos à sublimer."}</h1>
    {onBatch && <button type="button" className="st-imagine-link" onClick={onBatch}><Images size={16}/> J’ai une annonce et plusieurs photos <ArrowRight size={15}/></button>}
    <button type="button" className="st-imagine-link" onClick={onImagine}><Sparkles size={16}/> Créer une image sans photo de départ <ArrowRight size={15}/></button>
    {!library.freeUsed && <p className="st-offer"><Sparkles size={16}/> Votre première photo retouchée est offerte.</p>}
    {draftNotice && <p className="st-draft-status" role="status">{draftNotice}</p>}
    <form className="st-form" onSubmit={creer}>
      <fieldset className="st-step"><legend><span>1</span> Vos photos</legend>
        <div className={`st-drop ${glisse ? "on" : ""} ${fichiers.length ? "st-drop-full" : ""}`} onDragOver={e => { e.preventDefault(); setGlisse(true); }} onDragLeave={() => setGlisse(false)} onDrop={e => { e.preventDefault(); setGlisse(false); recevoir(Array.from(e.dataTransfer.files)); }}>
          {fichiers.length ? <div className="st-upload-selection">
            <p role="status"><strong>{fichiers.length} photo{fichiers.length > 1 ? "s" : ""} sélectionnée{fichiers.length > 1 ? "s" : ""}</strong> · ajoutez-en ou retirez-en avant de continuer.</p>
            <div className="st-upload-grid">{fichiers.map((file, index) => <div key={`${file.name}-${file.lastModified}-${file.size}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercus[index]} alt={`Photo ${index + 1} : ${file.name}`}/><span>{index + 1}</span><button type="button" disabled={envoi || busy} aria-label={`Retirer ${file.name}`} onClick={() => setFichiers(previous => previous.filter(item => item !== file))}><X size={15}/></button><small>{file.name}</small>
            </div>)}</div>
            <button type="button" className="button outlined" disabled={envoi || busy} onClick={() => input.current?.click()}><Images size={17}/> Ajouter d’autres photos</button>
          </div>
          : <><span className="st-drop-icon"><ImagePlus size={28}/></span><strong className="st-drop-desk">Glissez une ou plusieurs photos ici</strong><strong className="st-camera">Choisissez vos photos</strong><small className="st-drop-desk">ou</small><div className="st-pick"><button type="button" className="button dark st-camera" onClick={() => camera.current?.click()}><Camera size={17}/> Prendre une photo</button><button type="button" className="button outlined" onClick={() => input.current?.click()}><Images size={17}/> Choisir dans mes photos</button></div><small>Jusqu’à 40 photos à la fois · JPG, PNG ou WebP.</small></>}
          <input ref={camera} id="st-camera" type="file" accept="image/*" capture="environment" hidden onChange={e => { recevoir(Array.from(e.target.files || [])); e.target.value = ""; }}/>
          <input ref={input} id="st-fichiers" type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={e => { recevoir(Array.from(e.target.files || [])); e.target.value = ""; }}/>
        </div>
      </fieldset>
      <fieldset className="st-step"><legend><span>2</span> Ce que vous voulez changer <em>facultatif</em></legend>
        {fichiers.length > 1 && <p className="creation-small">Cette demande sera proposée pour toutes les photos. À l’étape suivante, choisissez de les retoucher ensemble ou une par une.</p>}
        <textarea id="st-demande" value={demande} onChange={e => setDemande(e.target.value)} maxLength={maxRequest} rows={3} placeholder="Ex. : plus de lumière, enlève le bazar sur la table…"/>
        <div className="st-ideas">{IDEES.map(i => <button type="button" key={i} onClick={() => setDemande(d => appendPhotoRequest(d, i, maxRequest))}><Plus size={13}/> {i}</button>)}</div>
        <BriefAssistant storageKey={draftKey ? `${draftKey}:assistant` : undefined} kind="photo" request={demande} onUse={setDemande}/>
        {demande.length > maxRequest && <p className="st-error" role="alert">Raccourcissez votre demande à {maxRequest.toLocaleString("fr-FR")} caractères maximum. Votre texte est conservé.</p>}
      </fieldset>
      <OptionalProperty options={logements} choice={choix} name={nouveau} onChoice={setChoix} onName={setNouveau} disabled={envoi}/>
      {erreur && <p className="st-error" role="alert">{erreur}</p>}
      <div className="st-submit">
        <button type="submit" className="button dark st-big" disabled={busy || envoi || !fichiers.length || !logement || demande.length > maxRequest}>{envoi ? "Ajout de vos photos…" : fichiers.length > 1 ? `Préparer ces ${fichiers.length} retouches` : "Vérifier ma demande"} <ArrowRight size={18}/></button>
        <span>{!fichiers.length ? "Ajoutez vos photos." : "Vos photos sont envoyées dans votre compte. Vous pourrez relire la demande avant de lancer la retouche."}</span>
      </div>
    </form>
    <button className="st-example-link" disabled={busy} onClick={onExample}>Pas de photo sous la main ? Essayer avec le salon d’exemple <ArrowRight size={15}/></button>
  </main>;
}

/* Facturation : le solde, ce qui a été utilisé, les packs et les factures. */
const PACKS = [
  ["Découverte", "10 crédits", "9,99 €", "1,00 € / photo"],
  ["Essentiel", "30 crédits", "24,99 €", "0,83 € / photo"],
  ["Avantage", "50 crédits", "34,99 €", "0,70 € / photo"],
  ["Volume", "100 crédits", "59,99 €", "0,60 € / photo"],
];
export function Billing({ library, onCreate }: { library: DemoLibrary; onCreate: () => void }) {
  return <main className="st-main st-billing">
    <p className="eyebrow">FACTURATION</p>
    <h1>Vos crédits et vos factures.</h1>
    <div className="st-bill-top">
      <div className="st-balance"><span>Solde de démonstration</span><strong>{library.credits}<small>{library.credits > 1 ? "crédits" : "crédit"}</small></strong><p>1 crédit pour une photo HD ou une correction supplémentaire.</p></div>
      <div className="st-free"><Sparkles size={22}/><div><strong>{library.freeUsed ? "Photo offerte utilisée" : "1 photo offerte"}</strong><p>{library.freeUsed ? "Votre première photo retouchée vous a été offerte." : "Votre première photo retouchée est gratuite."}</p></div>{!library.freeUsed && <button className="text-action" onClick={onCreate}>Créer ma retouche <ArrowRight size={15}/></button>}</div>
    </div>
    <section className="st-bill-block"><div className="st-block-head"><h2>Packs photo</h2><span>Plus le pack est grand, plus le prix par photo baisse.</span></div>
      <div className="st-packs">{PACKS.map(([nom, qte, prix, unite]) => <div key={nom} className="st-pack"><span>{nom}</span><strong>{prix}</strong><small>{qte}{unite ? ` · ${unite}` : ""}</small></div>)}</div>
    </section>
    <section className="st-bill-block"><div className="st-block-head"><h2>Packs vidéo</h2><span>Solde séparé · 1 crédit vidéo = 1 essai de 5 secondes.</span></div>
      <div className="st-packs">{[["5 secondes", "1 crédit vidéo", "8,97 €"], ["10 secondes", "2 crédits vidéo", "16,97 €"], ["15 secondes", "3 crédits vidéo", "24,97 €"], ["20 secondes", "4 crédits vidéo", "32,97 €"], ["25 secondes", "5 crédits vidéo", "40,97 €"], ["30 secondes", "6 crédits vidéo", "47,97 €"], ["60 secondes", "12 crédits vidéo", "92,97 €"], ["90 secondes", "18 crédits vidéo", "134,97 €"], ["120 secondes", "24 crédits vidéo", "174,97 €"]].map(([nom, qte, prix]) => <div key={nom} className="st-pack"><span>{nom} de crédits</span><strong>{prix}</strong><small>{qte} · ouverture après validation</small></div>)}</div>
    </section>
    <section className="st-bill-block"><div className="st-block-head"><h2><History size={18}/> Historique</h2><span>{library.events.length} {library.events.length > 1 ? "opérations" : "opération"}</span></div>
      {library.events.length ? <ul className="st-ledger">{library.events.map(e => <li key={e.id}><span><strong>{e.label}</strong><small>{e.project} · {dateText(e.at, true)}</small></span><b className={e.amount < 0 ? "debit" : ""}>{e.amount === 0 ? "Offerte" : `${e.amount} crédit`}</b></li>)}</ul>
      : <p className="st-empty-line">Aucun crédit utilisé pour l’instant.</p>}
    </section>
    <section className="st-bill-block"><div className="st-block-head"><h2><FileText size={18}/> Mes factures</h2></div>
      <div className="st-invoices-empty"><FileText size={26}/><p>Vos factures apparaîtront ici après votre premier achat, prêtes à télécharger en PDF.</p></div>
    </section>
    <div className="st-bill-rules"><p><Download size={17}/> Le crédit part au premier téléchargement HD. Garder une version ne coûte rien.</p><p><Clock3 size={17}/> 1 génération + 1 correction incluse. Puis 1 crédit par correction supplémentaire.</p><p><ArrowUpRight size={17}/><span>Tous les détails sur la <Link href="/demo/tarifs/">page des tarifs</Link>.</span></p></div>
  </main>;
}

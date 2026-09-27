"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Building2, Camera, ChevronRight, Clock3, Download, Film, FileText, History, ImagePlus, Images, Plus, Search, Sparkles, X } from "lucide-react";
import { asset, dateText, isExpired, storageError, type DemoLibrary, type DemoProject, type DemoVersion } from "./library";
import { BriefAssistant } from "./brief-assistant";
import "./studio-screens.css";

type Source = (project: DemoProject, version?: DemoVersion) => string;
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
export function PhotoList({ library, source, now, busy, onCreate, onVideo, onPlan, onExample, onOpen }: {
  library: DemoLibrary; source: Source; now: number; busy: boolean;
  onCreate: (logement?: string) => void; onVideo: () => void; onPlan: () => void; onExample: (kind: "photo" | "video") => void; onOpen: (p: DemoProject) => void;
}) {
  const [filtre, setFiltre] = useState("");
  const [recherche, setRecherche] = useState("");
  const logements = logementsDe(library, false);
  const miennes = library.projects.filter(p => !p.sample);
  const exemples = library.projects.filter(p => p.sample).sort((a, b) => b.updatedAt - a.updatedAt);
  const q = recherche.toLocaleLowerCase("fr");
  const groupes = logements.filter(l => !filtre || l === filtre).map(l => ({
    nom: l,
    photos: miennes.filter(p => p.property === l && `${p.title} ${p.property}`.toLocaleLowerCase("fr").includes(q)).sort((a, b) => b.updatedAt - a.updatedAt),
  })).filter(g => g.photos.length);
  const ligne = (p: DemoProject) => <li key={p.id}><button className="st-row" onClick={() => onOpen(p)}>
    <span className="st-thumb">{p.kind === "photo" ? <Image src={source(p)} alt="" fill unoptimized sizes="120px"/> : p.sample ? <Image src={asset("visite/sejour.png")} alt="" fill sizes="120px"/> : <video src={source(p)} muted preload="metadata"/>}{p.kind === "video" && <span className="st-thumb-tag"><Film size={12}/></span>}</span>
    <span className="st-row-main"><strong>{p.title}</strong><small>{p.versions.length} {p.versions.length > 1 ? "versions" : "version"} · {dateText(p.createdAt)}</small></span>
    <span className={`st-status ${isExpired(p, now) ? "late" : p.saved || p.editUntil ? "ok" : ""}`}>{statut(p, now)}</span>
    <ChevronRight size={20} className="st-chevron"/>
  </button></li>;
  /* Les exemples ne sont pas un logement : ils ont leur partie à eux, toujours la même, tout en bas. */
  const vus = new Set(exemples.map(p => p.kind));
  const cartesExemples = [
    { kind: "photo" as const, image: "salon-deco-complete.png", titre: "Le salon", type: "Photo", texte: "Une photo de salon retouchée 4 fois : plus de lumière, couleurs chaudes, nouvelle déco. Comparez les versions." },
    { kind: "video" as const, image: "visite/sejour.png", titre: "La visite", type: "Vidéo", texte: "Une courte visite du logement montée à partir de photos. La vidéo arrive bientôt." },
  ];
  const partieExemples = <section className="st-examples" aria-labelledby="st-examples-title">
    <div className="st-examples-head"><h2 id="st-examples-title"><Sparkles size={17}/> Exemples</h2><p>Deux exemples tout prêts, pour voir ce que le studio sait faire. Ils ne comptent pas dans vos photos et ne coûtent rien.</p></div>
    <div className="st-examples-grid">{cartesExemples.map(c => <button key={c.kind} className="st-ex-card" disabled={busy} onClick={() => onExample(c.kind)}>
      <span className="st-ex-img"><Image src={asset(c.image)} alt="" fill sizes="(max-width: 700px) 90vw, 320px" unoptimized/><span className="st-ex-type">{c.kind === "video" ? <Film size={12}/> : <Images size={12}/>} {c.type}</span></span>
      <span className="st-ex-body"><strong>{c.titre}</strong><small>{c.texte}</small><span className="st-ex-go">{vus.has(c.kind) ? "Rouvrir" : "Ouvrir l’exemple"} <ArrowRight size={14}/></span></span>
    </button>)}</div>
  </section>;

  if (!miennes.length) return <main className="st-main">
    <section className="st-first">
      <div className="st-first-art" aria-hidden="true">
        <div className="st-first-card st-c1"><Image src={asset("salon-avant.png")} alt="" fill sizes="220px" unoptimized/></div>
        <div className="st-first-card st-c2"><Image src={asset("salon-apres.png")} alt="" fill sizes="220px" unoptimized/></div>
        <span className="st-first-plus"><Plus size={26}/></span>
      </div>
      <div className="st-first-copy">
        <p className="section-kicker">VOTRE STUDIO EST PRÊT</p>
        <h1>Votre première retouche vous attend.</h1>
        <p>Choisissez une photo de votre logement, dites ce que vous voulez changer. {library.freeUsed ? "" : "La première photo est offerte."}</p>
        <div className="st-actions">
          <button className="button dark st-big" onClick={() => onCreate()}><Sparkles size={18}/> {library.freeUsed ? "Créer ma première retouche" : "Créer ma première retouche, offerte"}</button>
          <button className="button outlined" onClick={onPlan}><Film size={17}/> Préparer une visite vidéo</button>
        </div>
      </div>
    </section>
    {partieExemples}
  </main>;

  return <main className="st-main">
    <div className="st-head">
      <div><p className="eyebrow">MES PHOTOS</p><h1>Vos photos, par logement.</h1><p>Touchez une photo pour ouvrir sa retouche et toutes ses versions.</p></div>
      <div className="st-actions"><button className="button dark" onClick={() => onCreate(filtre || undefined)}><Plus size={18}/> Nouvelle retouche</button><button className="button outlined" onClick={onPlan}><Film size={17}/> Préparer une vidéo</button><button className="button outlined" onClick={onVideo}><Film size={17}/> Ajouter une vidéo</button></div>
    </div>
    <div className="st-toolbar">
      <div className="st-tabs" role="group" aria-label="Choisir un logement">
        <button aria-pressed={!filtre} onClick={() => setFiltre("")}>Tous <span>{miennes.length}</span></button>
        {logements.map(l => <button key={l} aria-pressed={filtre === l} onClick={() => setFiltre(l)}><Building2 size={14}/> {l} <span>{miennes.filter(p => p.property === l).length}</span></button>)}
      </div>
      <label className="st-search"><Search size={16}/><input aria-label="Rechercher une photo" placeholder="Rechercher…" value={recherche} onChange={e => setRecherche(e.target.value)}/></label>
    </div>
    {groupes.length ? groupes.map(g => <section key={g.nom} className="st-group" aria-label={g.nom}>
      <div className="st-group-head"><h2><Building2 size={18}/> {g.nom}</h2><span>{g.photos.length} {g.photos.length > 1 ? "photos" : "photo"}</span><button className="text-action" onClick={() => onCreate(g.nom)}><Plus size={15}/> Ajouter une photo</button></div>
      <ul className="st-list">{g.photos.map(ligne)}</ul>
    </section>) : <div className="st-none"><Search size={22}/><p>Aucune photo ne correspond.</p><button className="text-action" onClick={() => { setFiltre(""); setRecherche(""); }}>Tout afficher</button></div>}
    {partieExemples}
  </main>;
}

/* Nouvelle retouche : une page à rouvrir à chaque fois. Logement, photos, idée. */
export function CreateView({ library, busy, initial, onCreate, onExample, onCancel }: {
  library: DemoLibrary; busy: boolean; initial?: string;
  onCreate: (files: File[], logement: string, demande: string) => Promise<void>; onExample: () => void; onCancel: () => void;
}) {
  const logements = logementsDe(library, false);
  const [choix, setChoix] = useState(initial && logements.includes(initial) ? initial : logements[0] || "__nouveau");
  const [nouveau, setNouveau] = useState(initial && !logements.includes(initial) ? initial : "");
  const [fichier, setFichier] = useState<File | null>(null);
  const [demande, setDemande] = useState("");
  const [erreur, setErreur] = useState("");
  const [glisse, setGlisse] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const apercu = useMemo(() => fichier ? URL.createObjectURL(fichier) : "", [fichier]);
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu); }, [apercu]);
  const logement = choix === "__nouveau" ? nouveau.trim() : choix;
  const premiere = !library.projects.some(project => !project.sample);
  function recevoir(liste: File[]) {
    const image = liste.find(f => f.type.startsWith("image/"));
    if (!image) { setErreur("Choisissez une photo (JPG, PNG ou WebP)."); return; }
    setErreur(""); setFichier(image);
  }
  async function creer(e: React.FormEvent) {
    e.preventDefault();
    if (!fichier || !logement || envoi) return;
    setEnvoi(true); setErreur("");
    try { await onCreate([fichier], logement, demande.trim()); }
    catch (cause) { setErreur(storageError(cause)); setEnvoi(false); }
  }
  return <main className="st-main st-create">
    <button className="text-action st-back" onClick={onCancel}>← Mes photos</button>
    <p className="eyebrow">{premiere ? "VOTRE PREMIÈRE RETOUCHE" : "NOUVELLE RETOUCHE"}</p>
    <h1>{premiere ? "On commence par une photo." : "Une nouvelle photo à sublimer."}</h1>
    {!library.freeUsed && <p className="st-offer"><Sparkles size={16}/> Votre première photo retouchée est offerte.</p>}
    <form className="st-form" onSubmit={creer}>
      <fieldset className="st-step"><legend><span>1</span> Pour quel logement ?</legend>
        <div className="st-homes" role="radiogroup" aria-label="Logement">
          {logements.map(l => <button type="button" role="radio" aria-checked={choix === l} key={l} onClick={() => setChoix(l)}><Building2 size={16}/> {l}</button>)}
          <button type="button" role="radio" aria-checked={choix === "__nouveau"} onClick={() => setChoix("__nouveau")}><Plus size={16}/> Nouveau logement</button>
        </div>
        {choix === "__nouveau" && <label className="st-field">Nom du logement<input id="st-logement" value={nouveau} onChange={e => setNouveau(e.target.value)} maxLength={100} placeholder="Ex. : Appartement Nice, Studio Lyon" autoFocus/></label>}
      </fieldset>
      <fieldset className="st-step"><legend><span>2</span> Votre photo</legend>
        <div className={`st-drop ${glisse ? "on" : ""} ${fichier ? "st-drop-full" : ""}`} onDragOver={e => { e.preventDefault(); setGlisse(true); }} onDragLeave={() => setGlisse(false)} onDrop={e => { e.preventDefault(); setGlisse(false); recevoir(Array.from(e.dataTransfer.files)); }}>
          {fichier ? <div className="st-single">
            <span className="st-single-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercu} alt="Votre photo"/>
              <button type="button" aria-label="Retirer la photo" onClick={() => setFichier(null)}><X size={14}/></button>
            </span>
            <div className="st-pick"><button type="button" className="button outlined st-camera" onClick={() => camera.current?.click()}><Camera size={17}/> Reprendre la photo</button><button type="button" className="button outlined" onClick={() => input.current?.click()}><Images size={17}/> Choisir une autre photo</button></div>
          </div>
          : <><span className="st-drop-icon"><ImagePlus size={28}/></span><strong className="st-drop-desk">Glissez votre photo ici</strong><strong className="st-camera">Prenez la pièce en photo</strong><small className="st-drop-desk">ou</small><div className="st-pick"><button type="button" className="button dark st-camera" onClick={() => camera.current?.click()}><Camera size={17}/> Prendre une photo</button><button type="button" className="button outlined" onClick={() => input.current?.click()}><Images size={17}/> Choisir dans mes photos</button></div><small>Une photo à la fois, même prise au téléphone.</small></>}
          <input ref={camera} id="st-camera" type="file" accept="image/*" capture="environment" hidden onChange={e => { recevoir(Array.from(e.target.files || [])); e.target.value = ""; }}/>
          <input ref={input} id="st-fichiers" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { recevoir(Array.from(e.target.files || [])); e.target.value = ""; }}/>
        </div>
      </fieldset>
      <fieldset className="st-step"><legend><span>3</span> Ce que vous voulez changer <em>facultatif</em></legend>
        <textarea id="st-demande" value={demande} onChange={e => setDemande(e.target.value)} maxLength={2000} rows={3} placeholder="Ex. : plus de lumière, enlève le bazar sur la table…"/>
        <div className="st-ideas">{IDEES.map(i => <button type="button" key={i} onClick={() => setDemande(d => d ? `${d}, ${i.toLowerCase()}` : i)}><Plus size={13}/> {i}</button>)}</div>
        <BriefAssistant kind="photo" request={demande} onUse={setDemande}/>
      </fieldset>
      {erreur && <p className="st-error" role="alert">{erreur}</p>}
      <div className="st-submit">
        <button type="submit" className="button dark st-big" disabled={busy || envoi || !fichier || !logement}>{envoi ? "Création…" : "Créer la retouche"} <ArrowRight size={18}/></button>
        <span>{!fichier ? "Ajoutez votre photo." : !logement ? "Donnez un nom au logement." : "Vous paierez seulement la photo que vous garderez."}</span>
      </div>
    </form>
    <button className="st-example-link" disabled={busy} onClick={onExample}>Pas de photo sous la main ? Essayer avec le salon d’exemple <ArrowRight size={15}/></button>
  </main>;
}

/* Facturation : le solde, ce qui a été utilisé, les packs et les factures. */
const PACKS = [["À l’unité", "1 photo", "1,90 €", ""], ["Pack 5", "5 photos", "8,90 €", "1,78 € la photo"], ["Pack 10", "10 photos", "14,90 €", "1,49 € la photo"], ["Pack 25", "25 photos", "29,90 €", "1,20 € la photo"]];
export function Billing({ library, onCreate }: { library: DemoLibrary; onCreate: () => void }) {
  return <main className="st-main st-billing">
    <p className="eyebrow">FACTURATION</p>
    <h1>Vos crédits et vos factures.</h1>
    <div className="st-bill-top">
      <div className="st-balance"><span>Solde de démonstration</span><strong>{library.credits}<small>{library.credits > 1 ? "crédits" : "crédit"}</small></strong><p>1 crédit = 1 photo gardée en HD.</p></div>
      <div className="st-free"><Sparkles size={22}/><div><strong>{library.freeUsed ? "Photo offerte utilisée" : "1 photo offerte"}</strong><p>{library.freeUsed ? "Votre première photo retouchée vous a été offerte." : "Votre première photo retouchée est gratuite."}</p></div>{!library.freeUsed && <button className="text-action" onClick={onCreate}>Créer ma retouche <ArrowRight size={15}/></button>}</div>
    </div>
    <section className="st-bill-block"><div className="st-block-head"><h2>Recharger</h2><span>Le paiement arrive au lancement.</span></div>
      <div className="st-packs">{PACKS.map(([nom, qte, prix, unite]) => <div key={nom} className="st-pack"><span>{nom}</span><strong>{prix}</strong><small>{qte}{unite ? ` · ${unite}` : ""}</small></div>)}</div>
    </section>
    <section className="st-bill-block"><div className="st-block-head"><h2><History size={18}/> Historique</h2><span>{library.events.length} {library.events.length > 1 ? "opérations" : "opération"}</span></div>
      {library.events.length ? <ul className="st-ledger">{library.events.map(e => <li key={e.id}><span><strong>{e.label}</strong><small>{e.project} · {dateText(e.at, true)}</small></span><b className={e.amount < 0 ? "debit" : ""}>{e.amount === 0 ? "Offerte" : `${e.amount} crédit`}</b></li>)}</ul>
      : <p className="st-empty-line">Aucun crédit utilisé pour l’instant.</p>}
    </section>
    <section className="st-bill-block"><div className="st-block-head"><h2><FileText size={18}/> Mes factures</h2></div>
      <div className="st-invoices-empty"><FileText size={26}/><p>Vos factures apparaîtront ici après votre premier achat, prêtes à télécharger en PDF.</p></div>
    </section>
    <div className="st-bill-rules"><p><Download size={17}/> Le crédit part au premier téléchargement HD. Garder une version ne coûte rien.</p><p><Clock3 size={17}/> Ensuite, 7 jours pour ajuster la photo sans nouveau crédit.</p><p><ArrowUpRight size={17}/><span>Tous les détails sur la <Link href="/demo/tarifs/">page des tarifs</Link>.</span></p></div>
  </main>;
}

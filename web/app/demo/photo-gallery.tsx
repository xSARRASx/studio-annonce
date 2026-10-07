"use client";
import { demoInteraction } from '../../../shared/tracking';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Images, MessageSquareText } from "lucide-react";
import { PHOTO_EXAMPLES, EXAMPLE_CATEGORIES, exampleStages, type PhotoExample, type ExampleStage } from "../../../shared/photo-examples";
import { Compare } from "./studio-parts";
import { asset } from "./library";
import "./photo-gallery.css";

export const exampleImage = (example: PhotoExample, side: ExampleStage['key'] | 'angle') => asset(`exemples/${example.file}-${side}.webp`);

/** The same independent comparison in gallery cards, articles and detail pages. */
export function ExampleComparison({ example, thumbnail = false, priority = false }: { example: PhotoExample; thumbnail?: boolean; priority?: boolean }) {
  const source = (side: 'avant' | 'apres') => exampleImage(example, side).replace('.webp', `${thumbnail ? '-640' : ''}.webp`);
  return <div className="pg-example-comparison" style={{ aspectRatio: example.ratio }}><Compare before={source('avant')} result={source('apres')} beforeAlt={example.altBefore} resultAlt={example.altAfter} label={`Comparer avant et après : ${example.title}`} priority={priority} sizes={thumbnail ? '(max-width: 650px) 90vw, 33vw' : '(max-width: 900px) 90vw, 60vw'}/></div>;
}

export function ExampleViewer({ example, priority = false }: { example: PhotoExample; priority?: boolean }) {
  const [stage, setStage] = useState<ExampleStage['key']>('apres');
  const [compare, setCompare] = useState(true);
  const [angle, setAngle] = useState(false);
  const stages = exampleStages(example);
  return <div className="pg-feature-visual">
    <div className="pg-display" style={{ aspectRatio: angle ? 1.5 : example.ratio }}>
      {!angle && compare && stage !== 'avant' ? <Compare key={stage} before={exampleImage(example, 'avant')} result={exampleImage(example, stage)} priority={priority} beforeAlt={example.altBefore} resultAlt={example.altAfter}/> : <Image src={exampleImage(example, angle ? 'angle' : stage)} alt={stage === "avant" ? example.altBefore : example.altAfter} fill sizes="(max-width: 900px) 90vw, 55vw" priority={priority}/>}
    </div>
    <div className="pg-view-options" role="group" aria-label="Versions de cet exemple">{stages.map((item, index) => <button key={item.key} aria-pressed={!angle && stage === item.key} onClick={() => { setAngle(false); setStage(item.key); setCompare(false); }}><small>{index + 1}</small>{item.label}</button>)}</div>
    <div className="pg-view-tools"><label><input type="checkbox" checked={compare && stage !== 'avant' && !angle} disabled={stage === 'avant' || angle} onChange={event => setCompare(event.target.checked)}/>Comparer avec l’original</label>{example.angle && <button aria-pressed={angle} onClick={() => { setAngle(value => !value); setCompare(false); }}><Camera size={15}/>{angle ? 'Revenir au cadrage initial' : 'Autre point de vue'}</button>}</div>
    {angle && <p className="pg-angle-note">Même aménagement, autre angle. Présenté à part pour ne pas fausser la comparaison.</p>}
  </div>;
}

export function PhotoGallery({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<string>("Tout voir");
  const [selected, setSelected] = useState<PhotoExample>(PHOTO_EXAMPLES[0]);
  useEffect(() => {
    if (compact) return;
    const read = () => { const match = PHOTO_EXAMPLES.find(item => `#${item.id}` === window.location.hash); if (match) { setSelected(match); setCategory('Tout voir'); } };
    queueMicrotask(read); window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [compact]);
  const examples = PHOTO_EXAMPLES.filter(example => category === "Tout voir" || example.category === category);
  return <section className={`pg-gallery ${compact ? "pg-compact" : ""}`} aria-label="Exemples de retouches">
    <div className="pg-heading"><div><span className="section-kicker">{PHOTO_EXAMPLES.length} PHOTOS, AUTANT DE POSSIBILITÉS</span><h2>Du détail qui change tout.<br/><em>À la pièce réinventée.</em></h2></div><p>Remplacer un objet, changer les matières ou repenser toute la décoration. Les ouvertures et les volumes restent les repères de la pièce.</p></div>
    {!compact && <>
      <div className="pg-filters" role="group" aria-label="Filtrer les exemples">{EXAMPLE_CATEGORIES.map(label => <button type="button" key={label} aria-pressed={category === label} onClick={() => { demoInteraction('filtre', label); setCategory(label); const next = PHOTO_EXAMPLES.find(item => label === "Tout voir" || item.category === label); if (next) setSelected(next); }}>{label}</button>)}</div>
      <div className="pg-feature">
        <ExampleViewer key={selected.id} example={selected} priority/>
        <div className="pg-feature-copy"><span className="pg-room">{selected.room} · {selected.category}</span><h3>{selected.title}</h3><p>{selected.detail}</p><div className="pg-request"><MessageSquareText size={18}/><div><span>La première demande</span><blockquote>« {selected.prompt} »</blockquote></div></div>{selected.correction && <div className="pg-request pg-correction"><MessageSquareText size={18}/><div><span>Une correction, ensuite</span><blockquote>« {selected.correction} »</blockquote></div></div>}<p className="pg-preserved"><Check size={16}/><span>Repères conservés : {selected.preserved.toLocaleLowerCase('fr')}.</span></p><p className="pg-virtual">{selected.virtual ? 'Projection de décoration ou de rénovation' : 'Mise en valeur et rangement'} · à partir d’une photo réelle</p><Link href={`/exemples/${selected.id}/`} className="button dark">Découvrir cette transformation <ArrowRight size={17}/></Link></div>
      </div>
    </>}
    <p className="pg-compare-hint">Faites glisser la séparation sur chaque photo pour voir l’avant et l’après.</p>
    <div className="pg-grid">{(compact ? [PHOTO_EXAMPLES[1], PHOTO_EXAMPLES[2], PHOTO_EXAMPLES[4]] : examples).map(example => <article className={`pg-card ${!compact && selected.id === example.id ? "pg-selected" : ""}`} key={example.id}>
      <div className="pg-card-compare"><ExampleComparison example={example} thumbnail/><span className="pg-card-room">{example.room}</span></div>
      <div className="pg-card-copy"><span>{example.category}</span><h3>{example.title}</h3><p>{example.detail}</p><Link href={`/exemples/${example.id}/`}>Voir l’exemple en détail<ArrowRight size={15}/></Link></div>
    </article>)}</div>
    <div className="pg-foot"><p>Huit photographies de quatre logements, retouchées pour ces exemples. Les propositions de décoration et de rénovation sont des projections virtuelles, présentées avec leur original.</p>{compact && <Link className="button outlined" href="/exemples/">Voir les {PHOTO_EXAMPLES.length} exemples <ArrowRight size={17}/></Link>}</div>
  </section>;
}

export function GuidedExample({ exampleId = PHOTO_EXAMPLES[0].id, embedded = false }: { exampleId?: string; embedded?: boolean }) {
  const example = PHOTO_EXAMPLES.find(item => item.id === exampleId) || PHOTO_EXAMPLES[0];
  const steps = ['La photo', 'La demande', 'La proposition', ...(example.correction ? ['La correction'] : [])];
  const [step, setStep] = useState(0);
  const resultStage = example.correction && step === 2 ? 'proposition' : 'apres';
  return <section id="parcours" className={`pg-guide ${embedded ? "pg-guide-embedded" : ""}`} aria-label="Parcours guidé dans le studio">
    <header className="pg-guide-heading"><div><span className="section-kicker">DANS LE STUDIO, CONCRÈTEMENT</span><h2>Votre photo. Votre idée.<br/><em>Et la suite, pas à pas.</em></h2></div><p>Explorez un parcours préparé : la demande, la proposition{example.correction ? ', puis une correction' : ''}. Sans compte ni crédit utilisé.</p></header>
    <div className="pg-app">
      <div className="pg-app-bar"><span><Images size={17}/> Studio Annonce</span><span className="pg-demo-label">Exemple guidé</span></div>
      <nav className="pg-stepper" aria-label="Étapes de l’exemple">{steps.map((label, index) => <button key={label} onClick={() => { demoInteraction('parcours', ['la_photo', 'la_demande', 'la_proposition', 'la_correction'][index]); setStep(index); }} aria-current={step === index ? "step" : undefined}><span>{index < step ? <Check size={14}/> : index + 1}</span>{label}</button>)}</nav>
      <div className="pg-app-body">
        <div className="pg-app-photo" style={{ aspectRatio: example.ratio }}>{step >= 2 ? <Compare key={step} before={exampleImage(example, step === 3 ? 'proposition' : 'avant')} result={exampleImage(example, resultStage)} beforeAlt={example.altBefore} resultAlt={example.altAfter}/> : <Image src={exampleImage(example, "avant")} alt={example.altBefore} fill sizes="(max-width: 800px) 90vw, 50vw"/>}<span className="pg-app-photo-label">{step === 3 ? 'Proposition → correction' : step === 2 ? 'Original → proposition' : 'Photo de départ'}</span></div>
        <div className="pg-app-copy" aria-live="polite"><span className="pg-room">{example.room} · étape {step + 1} sur {steps.length}</span><h3>{step === 0 ? "Voici votre point de départ." : step === 1 ? "Toutes vos envies, réunies ici." : step === 2 ? "Une première proposition." : "Un détail à changer ?"}</h3><p>{step === 0 ? "Votre original reste le point de comparaison. Dans ce parcours, la photo est déjà choisie pour vous." : step === 1 ? "Le coup de pouce rassemble vos réponses en une seule demande. Vous pouvez la relire et l’ajuster : rien à recopier ailleurs." : step === 2 ? "Comparez la proposition avec l’original. Vérifiez les matières, la lumière et les repères de la pièce." : "Une demande précise suffit pour corriger la proposition. Ici, les autres changements sont conservés."}</p>
          {step >= 1 && <div className={`pg-request ${step === 3 ? 'pg-correction' : ''}`}><MessageSquareText size={19}/><div><span>{step === 3 ? 'La correction demandée' : 'La demande conservée'}</span><blockquote>{step === 3 ? example.correction : example.prompt}</blockquote></div></div>}
          <div className="pg-app-actions">{step > 0 && <button className="button outlined" onClick={() => { demoInteraction('parcours'); setStep(step - 1); }} aria-label="Étape précédente"><ArrowLeft size={17}/></button>}{step < steps.length - 1 ? <button className="button dark" onClick={() => { demoInteraction('parcours', ['la_demande', 'la_proposition', 'la_correction'][step]); setStep(step + 1); }}>{step === 0 ? "Voir la demande" : step === 1 ? "Voir la proposition" : "Découvrir la correction"}<ArrowRight size={17}/></button> : <Link className="button dark" href="/exemples/">Explorer les autres exemples <ArrowRight size={17}/></Link>}</div>
          <p className="pg-guide-note">Exemple guidé : ces images sont déjà préparées. Ce parcours ne lance aucune génération.</p>
        </div>
      </div>
    </div>
  </section>;
}

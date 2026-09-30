"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ImagePlus, Info, Lightbulb, Palette, Plus, Sparkles, Sun } from "lucide-react";
import { BriefAssistant } from "./brief-assistant";
import { CreationBack } from "./creation-hub";
import { suggestionState } from "../../../shared/idea-suggestions";
import "./image-planner.css";

const STORAGE_KEY = "studio-annonce.image-plan.v1";
const EXAMPLES = [
  { label: "Un intérieur à imaginer", detail: "Un salon lumineux, aux matières naturelles.", text: "Imagine un salon méditerranéen lumineux, avec un canapé arrondi, du bois clair et une grande baie ouverte sur la mer.", icon: Sun, tone: "sand" },
  { label: "Une idée de décoration", detail: "Une chambre, une ambiance, de nouvelles idées.", text: "Crée une chambre chaleureuse de style japonais, avec du bois foncé, des textiles écrus et une lumière douce en fin de journée.", icon: Lightbulb, tone: "sage" },
  { label: "Un visuel créatif", detail: "Une image originale pour raconter une idée.", text: "Crée une illustration éditoriale colorée d’une petite maison dans un jardin luxuriant, avec une composition simple et accueillante.", icon: Palette, tone: "lilac" },
] as const;

export function ImagePlanner({ onBack, onPhoto, storageKey = STORAGE_KEY }: { storageKey?: string; onBack: () => void; onPhoto: () => void }) {
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState("");
  const [briefIdea, setBriefIdea] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved === "object") {
          if (typeof saved.idea === "string") setIdea(saved.idea.slice(0, 4000));
          if (typeof saved.brief === "string") setBrief(saved.brief.slice(0, 20000));
          if (typeof saved.briefIdea === "string") setBriefIdea(saved.briefIdea.slice(0, 4000));
        }
      } catch { /* Le formulaire fonctionne aussi sans stockage local. */ }
      setRestored(true);
    });
    return () => { active = false; };
  }, [storageKey]);

  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ idea, brief, briefIdea })); }
    catch { /* Conserver le brouillon affiché si le navigateur refuse le stockage. */ }
  }, [storageKey, restored, idea, brief, briefIdea]);

  function useBrief(value: string) {
    setBrief(value);
    setBriefIdea(idea);
  }

  return <main className="st-main st-image-plan">
    <CreationBack onClick={onBack}/>
    <header className="ip-heading">
      <span className="ip-heading-icon" aria-hidden="true"><ImagePlus size={25} strokeWidth={1.7}/></span>
      <div><p className="eyebrow">À PARTIR D’UNE IDÉE</p><h1>Créer une image</h1></div>
      <span className="ip-no-file"><Sparkles size={14} aria-hidden="true"/> Aucun fichier nécessaire</span>
    </header>
    <p className="ip-intro">Un lieu à inventer, une ambiance à explorer, un visuel à imaginer. Décrivez ce que vous avez en tête, puis précisez les détails avec l’assistant.</p>

    <section className="st-step ip-idea" aria-labelledby="image-idea-title">
      <div className="ip-section-title"><span aria-hidden="true">1</span><h2 id="image-idea-title">Tout commence avec votre idée.</h2></div>
      <label htmlFor="image-idea">Qu’aimeriez-vous créer ?</label>
      <textarea id="image-idea" value={idea} maxLength={4000} rows={4} onChange={event => setIdea(event.target.value)} placeholder="Ex. : imagine un salon avec de grandes fenêtres, une décoration chaleureuse et une vue sur les montagnes…"/>
      <p className="ip-field-hint">Quelques mots suffisent. Vous pourrez choisir le style, le cadrage et ajouter vos propres précisions.</p>

      <div className="ip-examples" aria-label="Exemples pour démarrer">
        <p>Ajoutez une ou plusieurs idées à la ligne. Recliquez pour en retirer une.</p>
        <div>{EXAMPLES.map(example => {
          const Icon = example.icon;
          const state = suggestionState(idea, example.text);
          return <button type="button" key={example.label} className={`ip-example ip-example-${example.tone}${state.added ? " ip-example-added" : ""}`} disabled={!state.added && state.full} aria-pressed={state.added} aria-label={`${example.label} — ${state.added ? "Retirer de ma demande" : state.full ? "raccourcissez votre demande pour ajouter cette idée" : "Ajouter à ma demande"}`} onClick={() => setIdea(previous => {
            const next = suggestionState(previous, example.text);
            return !next.added && next.full ? previous : next.text;
          })}>
            <span className="ip-example-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.6}/></span>
            <strong>{example.label}</strong><span>{example.detail}</span><span className="ip-example-action">{state.added ? <><Check size={14}/> Ajouté · Retirer</> : state.full ? "Demande trop longue" : <><Plus size={14}/> Ajouter</>}</span>
          </button>;
        })}</div>
        {EXAMPLES.some(example => { const state = suggestionState(idea, example.text); return !state.added && state.full; }) && <p className="ip-suggestion-limit" role="status">Raccourcissez votre texte pour ajouter une autre idée : la demande est limitée à 4 000 caractères.</p>}
      </div>
      <BriefAssistant kind="image" request={idea} onUse={useBrief}/>
    </section>

    {brief && <section className="st-step ip-result" aria-labelledby="image-brief-title">
      <div className="ip-result-heading"><CheckCircle2 size={22} aria-hidden="true"/><div><h2 id="image-brief-title">Votre image a une direction.</h2><p>Vos réponses sont réunies ci-dessous. Rien à recopier : relisez votre demande et ajustez-la si vous le souhaitez.</p></div></div>
      {idea !== briefIdea && <p className="ip-changed">Votre idée a changé depuis cette description. Reprenez l’assistant pour l’actualiser, ou modifiez le texte ci-dessous.</p>}
      <details className="ip-brief" open><summary>Relire et modifier la description<ChevronDown size={17} aria-hidden="true"/></summary><label className="ip-brief-label" htmlFor="image-brief">Description complète de l’image</label><textarea id="image-brief" value={brief} maxLength={20000} rows={9} onChange={event => setBrief(event.target.value)}/></details>
    </section>}

    <aside className="ip-next" aria-label="À propos de la création d’images">
      <span className="ip-next-icon" aria-hidden="true"><Sparkles size={21}/></span>
      <div><h2>Imaginez librement.</h2><p>Ces images seront des créations fictives. Vous avez déjà une photo du logement ? <button className="text-action" onClick={onPhoto}>Retoucher une photo</button></p><p className="ip-connection">La génération IA sera disponible ici une fois connectée. Pour le moment, vous préparez votre description.</p></div>
    </aside>
    <p className="ip-local"><Info size={14} aria-hidden="true"/> Le brouillon est conservé dans ce navigateur si son stockage est disponible. Aucune génération n’est lancée.</p>
  </main>;
}

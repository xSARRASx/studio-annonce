"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";

type Kind = "photo" | "video";
type Question = { label: string; options: readonly string[] };

const QUESTIONS: Record<Kind, readonly Question[]> = {
  photo: [
    { label: "Quel changement est le plus important ?", options: ["Éclaircir la pièce", "Enlever le désordre", "Changer la décoration", "Améliorer la présentation"] },
    { label: "Qu’est-ce qui doit rester identique ?", options: ["Les volumes et ouvertures", "Le mobilier existant", "Les matériaux", "Tout sauf le changement demandé"] },
    { label: "Quelle ambiance souhaitez-vous ?", options: ["Naturelle et lumineuse", "Chaleureuse", "Élégante", "Sobre et neutre"] },
    { label: "Quel détail faut-il particulièrement protéger ?", options: ["La vue par les fenêtres", "La disposition de la pièce", "Les couleurs réelles", "Les ouvertures existantes"] },
  ],
  video: [
    { label: "Quel rendu souhaitez-vous ?", options: ["Réaliste et fidèle", "Chaleureux", "Luxe contemporain", "Minimaliste"] },
    { label: "Quel mouvement de caméra ?", options: ["Lent et élégant", "Visite dynamique", "Vue type drone", "Gros plans sur les détails"] },
    { label: "Qu’est-ce qui doit rester identique ?", options: ["La disposition des pièces", "Les meubles principaux", "Les fenêtres et la lumière", "Tout le logement"] },
    { label: "Quelle durée préparer ?", options: ["Un plan de 5 secondes", "Un plan de 10 secondes", "Une visite de 30 secondes", "À décider après les essais"] },
  ],
};

function createBrief(kind: Kind, request: string, answers: string[]) {
  const original = request.trim() || (kind === "photo" ? "Améliorer cette photo pour l’annonce" : "Présenter le logement dans une visite vidéo");
  if (kind === "photo") {
    const [change, preserve, mood, detail] = answers;
    return `Retoucher la photo immobilière fournie pour une annonce. Demande de départ : « ${original} ». Priorité : ${change.toLowerCase()}. Préserver ${preserve.toLowerCase()} et particulièrement ${detail.toLowerCase()}. Ambiance : ${mood.toLowerCase()}. Garder la géométrie, les dimensions et les ouvertures réelles. Ne modifier que ce qui est demandé, sans ajouter de pièce ni transformer la vue extérieure. Produire une image photographique nette et crédible. Si du mobilier ou des éléments inexistants sont ajoutés, marquer le résultat comme aménagement virtuel.`;
  }
  const [style, camera, preserve, duration] = answers;
  const plan = duration === "Une visite de 30 secondes"
    ? "Préparer plusieurs plans courts à assembler ; décrire leur ordre et les raccords, sans promettre une prise continue traversant toutes les pièces."
    : "Préparer un seul plan à partir des images correspondant à la pièce montrée.";
  return `Préparer une vidéo immobilière professionnelle à partir des photos fournies. Demande de départ : « ${original} ». Rendu : ${style.toLowerCase()}. Mouvement : ${camera.toLowerCase()}. Préserver ${preserve.toLowerCase()}, les volumes et les ouvertures réels. Durée souhaitée : ${duration.toLowerCase()}. ${plan} Garder la lumière et le mobilier cohérents, sans inventer de nouvelles pièces ni déformer la vue. Vidéo propre, sans texte incrusté ; contrôler chaque résultat avant de l’utiliser dans une annonce.`;
}

export function BriefAssistant({ kind, request, onUse }: { kind: Kind; request: string; onUse: (brief: string) => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [brief, setBrief] = useState("");
  const questions = QUESTIONS[kind];
  const step = answers.length;
  function restart() { setAnswers([]); setBrief(""); }
  function answer(option: string) {
    const next = [...answers, option];
    setAnswers(next);
    if (next.length === questions.length) setBrief(createBrief(kind, request, next));
  }
  return <>
    <button type="button" className="st-assistant-trigger" onClick={() => { restart(); setOpen(true); }}><Sparkles size={16}/> M’aider à préciser ma demande</button>
    {open && <section className="st-assistant" aria-label={kind === "photo" ? "Assistant de retouche photo" : "Assistant de visite vidéo"}>
      <div className="st-assistant-head"><div><span className="st-assistant-kicker">ASSISTANT · {step < questions.length ? `${step + 1}/${questions.length}` : "BRIEF PRÊT"}</span><h3 aria-live="polite">{step < questions.length ? questions[step].label : kind === "photo" ? "Votre demande de retouche est prête." : "Votre brief vidéo est prêt."}</h3></div><button type="button" aria-label="Fermer l’assistant" onClick={() => setOpen(false)}><X size={17}/></button></div>
      {step < questions.length ? <><p className="st-assistant-help">Choisissez une réponse. Vous pourrez modifier le texte final.</p><div className="st-assistant-options">{questions[step].options.map(option => <button type="button" key={option} onClick={() => answer(option)}>{option}<ArrowRight size={15}/></button>)}</div>{step > 0 && <button type="button" className="st-assistant-back" onClick={() => setAnswers(answers.slice(0, -1))}>← Question précédente</button>}</>
        : <><div className="st-prompt-ready"><CheckCircle2 size={19}/><span>{kind === "photo" ? "Demande structurée pour la retouche" : "Brief structuré pour la vidéo"}</span></div><p className="st-generated-prompt">{brief}</p><div className="st-assistant-actions"><button type="button" className="button dark" onClick={() => { onUse(brief); setOpen(false); }}>Utiliser ce brief</button><button type="button" className="button outlined" onClick={restart}>Recommencer</button></div></>}
      <small className="st-assistant-note">Aperçu local : ces réponses sont assemblées ici, sans appel à une IA. La génération et l’estimation du prix restent à connecter.</small>
    </section>}
  </>;
}

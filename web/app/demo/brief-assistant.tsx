"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Box, Camera, Check, CheckCircle2, ChevronDown, Clock, Clock3, Crop, DoorOpen, Eye, Film, Focus, Frame, Gem, Heart, Home, ImagePlus, Lamp, Layers, Lightbulb, ListChecks, Map, MessageSquareText, Monitor, Moon, MoveRight, Package, Paintbrush, Palette, Pencil, Plane, RotateCw, Route, ScanLine, ShieldCheck, SlidersHorizontal, Smartphone, Sofa, Sparkles, Square, Sun, Sunset, Timer, Trees, WandSparkles, Waves, Wind, X, ZoomIn, type LucideIcon } from "lucide-react";
import { buildBrief, buildQuestions, recoverBriefSource, type BriefKind, type BriefAnswers, type BriefAnswer, type BriefQuestion } from "../../../shared/brief-flow";
import "./brief-assistant.css";

const ICONS: Record<string, LucideIcon> = { Box, Camera, Clock, Clock3, Crop, DoorOpen, Eye, Film, Focus, Frame, Gem, Heart, Home, House: Home, Image: ImagePlus, ImagePlus, Lamp, Layers, Lightbulb, ListChecks, Map, Monitor, Moon, Move: MoveRight, MoveRight, Package, Paintbrush, Palette, Pin: ScanLine, Plane, RotateCw, Route, ScanLine, ShieldCheck, SlidersHorizontal, Smartphone, Sofa, Armchair: Sofa, Sparkles, Square, Sun, Sunset, Timer, Trees, WandSparkles, Waves, Wind, ZoomIn };
const EMPTY_ANSWER: BriefAnswer = { choice: "", detail: "" };
const answered = (answer?: BriefAnswer) => !!(answer?.choice || answer?.detail.trim());

function keepCompatibleAnswers(questions: readonly BriefQuestion[], answers: BriefAnswers): BriefAnswers {
  return Object.fromEntries(questions.filter(item => answers[item.id]).map(item => {
    const old = answers[item.id];
    return [item.id, { choice: item.options.some(option => option.label === old.choice) ? old.choice : "", detail: old.detail }];
  }));
}

export function BriefAssistant({ kind, request, context, onUse }: { kind: BriefKind; request: string; context?: string; onUse: (brief: string) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<BriefAnswers>({});
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const normalizedRequest = useMemo(() => recoverBriefSource(kind, request), [kind, request]);
  const [sourceRequest, setSourceRequest] = useState(normalizedRequest);
  const editOriginal = useRef<BriefAnswer>(EMPTY_ANSWER);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const hasOpened = useRef(false);
  const questions = useMemo(() => buildQuestions(kind, sourceRequest), [kind, sourceRequest]);
  const ready = step >= questions.length;
  const question = questions[step];
  const answer = question ? answers[question.id] || EMPTY_ANSWER : EMPTY_ANSWER;
  const brief = ready ? buildBrief(kind, sourceRequest, questions, answers, context) : "";
  const pendingSource = request !== lastApplied && normalizedRequest !== sourceRequest;
  const replacingExistingBrief = request !== normalizedRequest && request !== lastApplied;
  const allAnswered = questions.every(item => answered(answers[item.id]));
  const assistantName = kind === "video" ? "Assistant de visite vidéo" : kind === "image" ? "Assistant de création d’image" : "Assistant de retouche photo";

  useEffect(() => {
    if (open) { titleRef.current?.focus({ preventScroll: true }); panelRef.current?.scrollIntoView({ block: "start" }); }
    else if (hasOpened.current) triggerRef.current?.focus({ preventScroll: true });
  }, [open, step]);

  function updateSource() {
    const nextSource = request === lastApplied ? sourceRequest : normalizedRequest;
    if (nextSource !== sourceRequest) {
      setSourceRequest(nextSource);
      setAnswers(previous => keepCompatibleAnswers(buildQuestions(kind, nextSource), previous));
      setStep(0); setEditing(false);
    }
  }
  function changeAnswer(change: Partial<BriefAnswer>) {
    setAnswers(previous => ({ ...previous, [question.id]: { ...(previous[question.id] || EMPTY_ANSWER), ...change } }));
  }
  function back() {
    if (editing) {
      setAnswers(previous => ({ ...previous, [question.id]: editOriginal.current }));
      setStep(questions.length); setEditing(false);
    } else setStep(step - 1);
  }

  return <div className="brief-assistant">
    <button ref={triggerRef} type="button" className="ba-invite" hidden={open} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => { hasOpened.current = true; updateSource(); setOpen(true); }}>
      <span className="ba-invite-art" aria-hidden="true"><Sparkles size={26}/><span/><span/></span>
      <span className="ba-invite-copy"><span className="ba-eyebrow">UN COUP DE POUCE</span><strong>Votre idée, en plus clair.</strong><span>Des questions pour votre idée. Des réponses avec vos mots.</span></span>
      <span className="ba-invite-go">{Object.values(answers).some(answered) ? "Reprendre" : "Me guider"}<ArrowRight size={18}/></span>
    </button>
    {open && <section ref={panelRef} id={`${id}-panel`} className="ba-panel" aria-label={assistantName}>
      <header className="ba-header"><span className="ba-label"><Sparkles size={17}/> Assistant {kind === "photo" ? "photo" : kind === "video" ? "vidéo" : "création d’image"}</span><button type="button" className="ba-close" aria-label="Fermer l’assistant" onClick={() => setOpen(false)}><X size={20}/></button></header>
      <ol className={`ba-progress ${questions.length > 5 ? "ba-progress-many" : ""}`} style={{ "--ba-steps": questions.length } as CSSProperties} aria-label="Les étapes de votre demande">{questions.map((item, index) => <li key={item.id} className={ready || index < step ? "done" : index === step ? "current" : ""} aria-current={!ready && index === step ? "step" : undefined} aria-label={`${index + 1}. ${item.short}`}><span aria-hidden="true"/><span className="ba-progress-label">{item.short}</span></li>)}</ol>
      <div className="ba-body">
        {pendingSource && <div className="ba-source-update" role="status"><span>Votre idée a changé.</span><button type="button" onClick={updateSource}>Adapter les questions <ArrowRight size={14}/></button></div>}
        {replacingExistingBrief && <p className="ba-source-update">Votre texte actuel est conservé. Appliquer ces réponses le remplacera, y compris vos modifications manuelles.</p>}
        <p className="ba-counter">{ready ? <><CheckCircle2 size={16}/> Votre récapitulatif</> : <>QUESTION {step + 1} SUR {questions.length}<span className="ba-kind">{question.core ? "L’essentiel" : "Selon votre idée"}</span></>}</p>
        <h3 id={`${id}-title`} ref={titleRef} tabIndex={-1}>{ready ? "Voilà ce qu’on a préparé." : question.label}</h3>
        <p id={`${id}-help`} className="ba-help">{ready ? "Vos choix et vos précisions sont réunis. Tout reste modifiable." : question.help}</p>
        {ready ? <>
          <div className="ba-recap">{questions.map((item, index) => {
            const selected = answers[item.id] || EMPTY_ANSWER;
            const option = item.options.find(option => option.label === selected.choice);
            const Icon = ICONS[option?.icon || ""] || MessageSquareText;
            return <button type="button" key={item.id} onClick={() => { editOriginal.current = { ...selected }; setStep(index); setEditing(true); }} aria-label={`Modifier ${item.short} : ${selected.choice || selected.detail}`}><span className="ba-option-icon"><Icon size={21}/></span><span><small>{item.short}</small><strong>{selected.choice || "Avec vos mots"}</strong>{selected.detail && <span className="ba-recap-detail">{selected.detail}</span>}</span><Pencil size={15}/></button>;
          })}</div>
          <details className="ba-full-text"><summary>Voir le texte complet<ChevronDown size={17}/></summary><p>{brief}</p></details>
          {brief.length > 20000 && <p className="ba-length-warning" role="alert">Votre demande est trop longue pour être enregistrée. Raccourcissez votre idée ou certaines précisions avant de continuer.</p>}
          <div className="ba-footer"><button type="button" className="ba-back" onClick={() => { setAnswers({}); setStep(0); setEditing(false); }}>Recommencer</button><button type="button" className="ba-primary" disabled={!allAnswered || pendingSource || brief.length > 20000} onClick={() => { setLastApplied(brief); onUse(brief); setOpen(false); }}>{replacingExistingBrief ? "Remplacer par cette demande" : kind === "photo" ? "Utiliser cette demande" : "Utiliser ce brief"}<Check size={18}/></button></div>
        </> : <>
          <div key={question.id} className="ba-options" role="radiogroup" aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}>{question.options.map(option => {
            const Icon = ICONS[option.icon] || Sparkles;
            return <label key={option.label} className="ba-option"><input type="radio" name={`${id}-${question.id}`} value={option.label} checked={answer.choice === option.label} onChange={() => changeAnswer({ choice: option.label })}/><span className="ba-option-surface"><span className="ba-option-top"><span className="ba-option-icon"><Icon size={23} strokeWidth={1.6}/></span><span className="ba-radio" aria-hidden="true">{answer.choice === option.label && <Check size={13}/>}</span></span><strong>{option.label}</strong><span className="ba-option-detail">{option.detail}</span></span></label>;
          })}</div>
          <div className="ba-free-answer"><div><label htmlFor={`${id}-detail`}><MessageSquareText size={16}/> Votre réponse ou une précision</label>{answer.choice && <button type="button" className="ba-clear-choice" onClick={() => changeAnswer({ choice: "" })}>Retirer le choix</button>}</div><p id={`${id}-detail-help`}>Écrivez ici, choisissez une carte, ou faites les deux.</p><textarea id={`${id}-detail`} aria-describedby={`${id}-detail-help`} value={answer.detail} onChange={event => changeAnswer({ detail: event.target.value })} placeholder={question.placeholder} maxLength={1000} rows={3}/></div>
          <div className="ba-footer">{step > 0 || editing ? <button type="button" className="ba-back" onClick={back}><ArrowLeft size={16}/> {editing ? "Annuler" : "Retour"}</button> : <span className="ba-footer-hint">Vos mots comptent aussi.</span>}<button type="button" className="ba-primary" disabled={!answered(answer)} onClick={() => { setStep(editing ? questions.length : step + 1); setEditing(false); }}>{editing ? "Valider ce choix" : step === questions.length - 1 ? "Voir ma demande" : "Continuer"}<ArrowRight size={18}/></button></div>
        </>}
      </div>
      <p className="ba-note">Aperçu local · questions adaptées aux thèmes de votre texte, sans appel à une IA ni génération.</p>
    </section>}
  </div>;
}

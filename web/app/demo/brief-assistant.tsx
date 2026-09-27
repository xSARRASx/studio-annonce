"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Clock3, Eye, Film, Frame, Gem, Home, Layers, Lightbulb, MoveRight, Palette, Pencil, ScanLine, ShieldCheck, Sofa, Sparkles, Sun, WandSparkles, Wind, X, type LucideIcon } from "lucide-react";
import "./brief-assistant.css";

type Kind = "photo" | "video";
type Option = { label: string; detail: string; icon: LucideIcon };
type Question = { short: string; label: string; help: string; options: readonly Option[] };

const QUESTIONS: Record<Kind, readonly Question[]> = {
  photo: [
    { short: "Changement", label: "On commence par quoi ?", help: "Choisissez ce qui fera la différence sur votre photo.", options: [
      { label: "Éclaircir la pièce", detail: "Une lumière plus douce, plus naturelle.", icon: Sun },
      { label: "Enlever le désordre", detail: "Libérer les surfaces et ranger les objets.", icon: WandSparkles },
      { label: "Changer la décoration", detail: "Repenser les meubles et les accessoires.", icon: Sofa },
      { label: "Améliorer la présentation", detail: "Soigner l’ensemble, sans tout changer.", icon: Frame },
    ] },
    { short: "À préserver", label: "Qu’est-ce qu’on garde ?", help: "Indiquez ce qui compte pour vous. Les volumes réels restent toujours préservés.", options: [
      { label: "Les volumes et ouvertures", detail: "La pièce garde ses dimensions réelles.", icon: Home },
      { label: "Le mobilier existant", detail: "On conserve les meubles de la photo.", icon: Sofa },
      { label: "Les matériaux", detail: "Le sol et les revêtements restent fidèles.", icon: Layers },
      { label: "Tout sauf le changement demandé", detail: "Une intervention précise et ciblée.", icon: ShieldCheck },
    ] },
    { short: "Ambiance", label: "Quelle ambiance vous ressemble ?", help: "Donnez une direction au rendu de votre photo.", options: [
      { label: "Naturelle et lumineuse", detail: "Des tons frais et de la lumière du jour.", icon: Sun },
      { label: "Chaleureuse", detail: "Une atmosphère douce et accueillante.", icon: Lightbulb },
      { label: "Élégante", detail: "Un rendu soigné, aux détails raffinés.", icon: Gem },
      { label: "Sobre et neutre", detail: "Des couleurs calmes, rien de superflu.", icon: Palette },
    ] },
    { short: "Détail clé", label: "Le détail à ne pas perdre ?", help: "Un dernier repère pour rester fidèle à votre logement.", options: [
      { label: "La vue par les fenêtres", detail: "Garder le paysage tel qu’il est.", icon: Eye },
      { label: "La disposition de la pièce", detail: "Respecter l’organisation de l’espace.", icon: Home },
      { label: "Les couleurs réelles", detail: "Préserver les teintes du logement.", icon: Palette },
      { label: "Les ouvertures existantes", detail: "Conserver les portes et les fenêtres.", icon: Frame },
    ] },
  ],
  video: [
    { short: "Ambiance", label: "Quelle impression donner ?", help: "Choisissez l’atmosphère de votre future visite.", options: [
      { label: "Réaliste et fidèle", detail: "Le logement comme on le découvrirait.", icon: Home },
      { label: "Chaleureux", detail: "Une lumière douce, un lieu accueillant.", icon: Lightbulb },
      { label: "Luxe contemporain", detail: "Mettre en valeur les matières et détails.", icon: Gem },
      { label: "Minimaliste", detail: "Une visite sobre, sans effet superflu.", icon: Frame },
    ] },
    { short: "Caméra", label: "Comment se déplace la caméra ?", help: "Imaginez le regard de la personne qui visite.", options: [
      { label: "Lent et élégant", detail: "Glisser doucement pour découvrir la pièce.", icon: Wind },
      { label: "Visite dynamique", detail: "Avancer avec du rythme entre les plans.", icon: MoveRight },
      { label: "Vue type drone", detail: "Un mouvement aérien, fluide et flottant.", icon: ScanLine },
      { label: "Gros plans sur les détails", detail: "S’attarder sur les atouts du logement.", icon: Eye },
    ] },
    { short: "À préserver", label: "Qu’est-ce qu’on garde à l’identique ?", help: "Le point auquel vous souhaitez porter le plus d’attention.", options: [
      { label: "La disposition des pièces", detail: "Respecter le plan et les volumes réels.", icon: Home },
      { label: "Les meubles principaux", detail: "Retrouver les mêmes meubles à l’écran.", icon: Sofa },
      { label: "Les fenêtres et la lumière", detail: "Conserver les ouvertures et l’éclairage.", icon: Sun },
      { label: "Tout le logement", detail: "Garder chaque élément aussi fidèle que possible.", icon: ShieldCheck },
    ] },
    { short: "Durée", label: "Un aperçu ou une visite ?", help: "Cette durée guidera le brief. Elle sera confirmée avant la génération.", options: [
      { label: "Un plan de 5 secondes", detail: "Un court aperçu d’une pièce.", icon: Clock3 },
      { label: "Un plan de 10 secondes", detail: "Le temps de découvrir ses détails.", icon: Clock3 },
      { label: "Une visite de 30 secondes", detail: "Plusieurs plans à assembler.", icon: Film },
      { label: "À décider après les essais", detail: "On commence par définir l’intention.", icon: Sparkles },
    ] },
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
  const id = useId();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [sourceRequest, setSourceRequest] = useState(request);
  const lastApplied = useRef<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const hasOpened = useRef(false);
  const questions = QUESTIONS[kind];
  const ready = step === questions.length;
  const question = questions[step];
  const brief = ready ? createBrief(kind, sourceRequest, answers) : "";
  useEffect(() => {
    if (open) { titleRef.current?.focus({ preventScroll: true }); panelRef.current?.scrollIntoView({ block: "start" }); }
    else if (hasOpened.current) triggerRef.current?.focus({ preventScroll: true });
  }, [open, step]);
  function select(label: string) {
    setAnswers(previous => { const next = [...previous]; next[step] = label; return next; });
  }
  return <div className="brief-assistant">
    <button ref={triggerRef} type="button" className="ba-invite" hidden={open} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => { hasOpened.current = true; if (request !== lastApplied.current) setSourceRequest(request); setOpen(true); }}>
      <span className="ba-invite-art" aria-hidden="true"><Sparkles size={26}/><span/><span/></span>
      <span className="ba-invite-copy"><span className="ba-eyebrow">UN COUP DE POUCE</span><strong>Votre idée, en plus clair.</strong><span>4 choix simples pour trouver les bons mots.</span></span>
      <span className="ba-invite-go">{answers.length ? "Reprendre" : "Me guider"}<ArrowRight size={18}/></span>
    </button>
    {open && <section ref={panelRef} id={`${id}-panel`} className="ba-panel" aria-label={kind === "photo" ? "Assistant de retouche photo" : "Assistant de visite vidéo"}>
      <header className="ba-header"><span className="ba-label"><Sparkles size={17}/> Assistant {kind === "photo" ? "photo" : "vidéo"}</span><button type="button" className="ba-close" aria-label="Fermer l’assistant" onClick={() => setOpen(false)}><X size={20}/></button></header>
      <ol className="ba-progress" aria-label="Les étapes de votre demande">{questions.map((item, index) => <li key={item.short} className={ready || index < step ? "done" : index === step ? "current" : ""} aria-current={!ready && index === step ? "step" : undefined}><span aria-hidden="true"/>{item.short}</li>)}</ol>
      <div className="ba-body">
        <p className="ba-counter">{ready ? <><CheckCircle2 size={16}/> Tout est prêt</> : `QUESTION ${step + 1} SUR ${questions.length}`}</p>
        <h3 id={`${id}-title`} ref={titleRef} tabIndex={-1}>{ready ? "Voilà ce qu’on a préparé." : question.label}</h3>
        <p id={`${id}-help`} className="ba-help">{ready ? "Vos choix sont réunis. Vous pouvez encore les ajuster." : question.help}</p>
        {ready ? <>
          <div className="ba-recap">{questions.map((item, index) => {
            const Icon = item.options.find(option => option.label === answers[index])?.icon || Check;
            return <button type="button" key={item.short} onClick={() => { setStep(index); setEditing(true); }} aria-label={`Modifier ${item.short} : ${answers[index]}`}><span className="ba-option-icon"><Icon size={21}/></span><span><small>{item.short}</small><strong>{answers[index]}</strong></span><Pencil size={15}/></button>;
          })}</div>
          <details className="ba-full-text"><summary>Voir le texte complet<ChevronDown size={17}/></summary><p>{brief}</p></details>
          <div className="ba-footer"><button type="button" className="ba-back" onClick={() => { setAnswers([]); setStep(0); setEditing(false); }}>Recommencer</button><button type="button" className="ba-primary" onClick={() => { lastApplied.current = brief; onUse(brief); setOpen(false); }}>{kind === "photo" ? "Utiliser cette demande" : "Utiliser ce brief"}<Check size={18}/></button></div>
        </> : <>
          <div key={step} className="ba-options" role="radiogroup" aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}>{question.options.map(option => {
            const Icon = option.icon;
            return <label key={option.label} className="ba-option"><input type="radio" name={`${id}-choice-${step}`} value={option.label} checked={answers[step] === option.label} onChange={() => select(option.label)}/><span className="ba-option-surface"><span className="ba-option-top"><span className="ba-option-icon"><Icon size={23} strokeWidth={1.6}/></span><span className="ba-radio" aria-hidden="true">{answers[step] === option.label && <Check size={13}/>}</span></span><strong>{option.label}</strong><span className="ba-option-detail">{option.detail}</span></span></label>;
          })}</div>
          <div className="ba-footer">{step > 0 || editing ? <button type="button" className="ba-back" onClick={() => { setStep(editing ? questions.length : step - 1); setEditing(false); }}><ArrowLeft size={16}/> Retour</button> : <span className="ba-footer-hint">Un choix par étape.</span>}<button type="button" className="ba-primary" disabled={!answers[step]} onClick={() => { setStep(editing ? questions.length : step + 1); setEditing(false); }}>{editing ? "Valider ce choix" : step === questions.length - 1 ? "Voir ma demande" : "Continuer"}<ArrowRight size={18}/></button></div>
        </>}
      </div>
      <p className="ba-note">Aperçu gratuit · vos réponses préparent un texte, sans lancer de génération.</p>
    </section>}
  </div>;
}

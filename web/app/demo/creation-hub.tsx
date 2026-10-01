"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Film, ImagePlus, Images, Play, Sparkles, Upload } from "lucide-react";
import { asset } from "./library";
import "./creation-hub.css";

const paths = [
  { route: "nouvelle", title: "Retoucher une photo", description: "Éclairez une pièce, changez la déco ou retirez un objet.", from: "Photo", to: "Photo retouchée", action: "Préparer ma retouche", tone: "sage", Icon: ImagePlus },
  { route: "creer-image", title: "Créer une image", description: "Imaginez un lieu ou un visuel, simplement avec vos mots.", from: "Idée", to: "Image", action: "Décrire mon image", tone: "lilac", Icon: Sparkles },
  { route: "visite", title: "Photos → vidéo", description: "Préparez une visite animée à partir de photos, ou d’une idée.", from: "Photos ou idée", to: "Vidéo", action: "Préparer ma vidéo", tone: "peach", Icon: Film },
  { route: "video-photos", title: "Vidéo → photos", description: "Récupérez les plus belles vues d’une vidéo du logement.", from: "Vidéo", to: "Photos", action: "Extraire mes photos", tone: "blue", Icon: Images },
] as const;

export function CreationBack({ onClick }: { onClick: () => void }) {
  return <button className="text-action st-back creation-back" onClick={onClick}><ArrowLeft size={16}/> Tous les outils de création</button>;
}

export function CreationHub({ onChoose, onImportVideo, onImportPhotos }: { onChoose: (route: string) => void; onImportVideo?: () => void; onImportPhotos?: () => void }) {
  return <main className="st-main creation-hub">
    <header className="creation-heading"><p className="eyebrow">LE STUDIO, À VOTRE FAÇON</p><h1>Qu’aimeriez-vous créer ?</h1><p>Choisissez votre point de départ. On vous guide pour la suite.</p></header>
    <div className="creation-grid">
      {paths.map(({ route, title, description, from, to, action, tone, Icon }, index) => <button key={route} className={`creation-card creation-${tone}`} onClick={() => onChoose(route)}>
        <span className="creation-art" aria-hidden="true">
          {index === 0 && <><span className="creation-picture creation-before"><Image src={asset("salon-avant.webp")} alt="" fill sizes="140px"/></span><ArrowRight className="creation-art-arrow"/><span className="creation-picture creation-after"><Image src={asset("salon-apres.webp")} alt="" fill sizes="180px"/><span className="creation-art-badge"><Sparkles size={16}/></span></span></>}
          {index === 1 && <><span className="creation-idea">Un salon lumineux,<br/>des matières naturelles…<span className="creation-idea-cursor"/></span><span className="creation-picture creation-imagined"><Image src={asset("salon-deco-complete.webp")} alt="" fill sizes="190px"/><span className="creation-art-badge"><Sparkles size={16}/></span></span></>}
          {index === 2 && <><span className="creation-picture creation-stack"><Image src={asset("salon-avant.webp")} alt="" fill sizes="120px"/></span><span className="creation-picture creation-movie"><Image src={asset("visite/sejour.webp")} alt="" fill sizes="220px"/><span className="creation-play"><Play size={22} fill="currentColor"/></span><span className="creation-timeline"/></span></>}
          {index === 3 && <><span className="creation-film"><Film size={24}/><span/><span/><span/></span><span className="creation-extracted">{["salon-avant.webp", "salon-apres.webp", "salon-deco-complete.webp"].map(src => <span key={src}><Image src={asset(src)} alt="" fill sizes="85px"/></span>)}</span></>}
        </span>
        <span className="creation-card-body"><span className="creation-direction"><Icon size={15}/>{from}<ArrowRight size={13}/>{to}</span><strong className="creation-card-title">{title}</strong><span className="creation-description">{description}</span><span className="creation-action">{action}<ArrowRight size={18}/></span></span>
      </button>)}
    </div>
    {onImportPhotos && <div className="creation-import"><span>Plusieurs photos dans une annonce ?</span><button className="text-action" onClick={onImportPhotos}><Images size={15}/> Choisir les photos à retoucher</button></div>}
    <div className="creation-reassurance"><Sparkles size={18}/><p>Une idée encore floue ?<span>Dans chaque outil, choisissez des réponses et ajoutez vos précisions.</span></p></div>
    {onImportVideo && <div className="creation-import"><span>Vous avez déjà une vidéo terminée ?</span><button className="text-action" onClick={onImportVideo}><Upload size={15}/> L’ajouter à mes créations</button></div>}
  </main>;
}

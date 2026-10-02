"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { asset } from "./library";
import { PreviewWatermark } from "@/components/preview-watermark";

export function Brand({ onClick }: { onClick: () => void }) {
  return <button className="brand" onClick={onClick} aria-label="Studio Annonce, accueil"><span className="brand-mark"><Image src={asset("porte-lumineuse.svg")} alt="" width={40} height={44}/></span><span>studio<span className="brand-light">annonce</span></span></button>;
}

export function Compare({ result = asset("salon-apres.webp"), before = asset("salon-avant.webp"), resultSmall, beforeSmall, compact = false, watermarked = false, priority = false, beforeAlt = "Photo originale", resultAlt = "Version sélectionnée", label = "Comparer la photo avant et après", sizes = "(max-width: 800px) 100vw, 65vw" }: { result?: string; before?: string; resultSmall?: string; beforeSmall?: string; compact?: boolean; watermarked?: boolean; priority?: boolean; beforeAlt?: string; resultAlt?: string; label?: string; sizes?: string }) {
  const [split, setSplit] = useState(44);
  return <div className={`comparison ${compact ? "compact" : ""}`}>
    <picture>{resultSmall && <source media="(max-width: 480px)" srcSet={resultSmall}/>}<Image src={result} alt={resultAlt} fill sizes={sizes} priority={priority && !resultSmall} loading={priority && resultSmall ? "eager" : undefined} fetchPriority={priority ? "high" : undefined} unoptimized/></picture>
    <div className="before-layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}><picture>{beforeSmall && <source media="(max-width: 480px)" srcSet={beforeSmall}/>}<Image src={before} alt={beforeAlt} fill sizes={sizes} priority={priority && !beforeSmall} loading={priority && beforeSmall ? "eager" : undefined} unoptimized/></picture></div>
    {watermarked && <PreviewWatermark from={split}/>}
    <span className="photo-label before-label">Avant</span><span className="photo-label after-label">Après <Sparkles size={12}/></span>
    <div className="compare-divider" style={{ left: `${split}%` }}><span><ChevronRight size={15} style={{ transform: "rotate(180deg)" }}/><ChevronRight size={15}/></span></div>
    <input aria-label={label} aria-valuetext={`${split} % de la photo originale`} className="compare-range" type="range" min="0" max="100" value={split} onChange={event => setSplit(Number(event.target.value))}/>
  </div>;
}

export function Modal({ title, children, onClose, mandatory = false, wide = false, returnFocusId }: { title: string; children: ReactNode; onClose: () => void; mandatory?: boolean; wide?: boolean; returnFocusId?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close(); document.body.style.overflow = overflow;
      // A download temporarily disables its trigger; remember an explicit target
      // because disabling a focused button can move browser focus to the body.
      requestAnimationFrame(() => {
        const target = (returnFocusId ? document.getElementById(returnFocusId) : null) || previous;
        if (target?.isConnected) target.focus({ preventScroll: true });
      });
    };
  }, [returnFocusId]);
  return <dialog ref={ref} className={`studio-dialog ${wide ? "wide" : ""}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!mandatory) onClose(); }}>
    <div className="dialog-header"><h2 id={titleId}>{title}</h2><button className="dialog-close" aria-label="Fermer la fenêtre" onClick={onClose}><X size={21}/></button></div>
    {children}
  </dialog>;
}

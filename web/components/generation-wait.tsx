"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const conseils = [
  "À la réception, comparez les portes, les fenêtres et les radiateurs avec l’original.",
  "Vérifiez les matières et le mobilier avant de choisir la version à garder.",
  "Si un détail ne convient pas, vous pourrez demander une correction précise.",
];

export function GenerationWait({ type = "photo" }: { type?: "photo" | "video" }) {
  const [conseil, setConseil] = useState(0);
  useEffect(() => {
    const minuteur = window.setInterval(() => setConseil(index => (index + 1) % conseils.length), 6500);
    return () => window.clearInterval(minuteur);
  }, []);
  return <section className="generation-wait" role="status" aria-live="polite" aria-label={`${type === "photo" ? "Retouche photo" : "Création vidéo"} en cours`}>
    <div className="generation-wait-mark" aria-hidden="true"><Sparkles size={25}/><span/></div>
    <div className="generation-wait-copy"><span>VOTRE CRÉATION EST EN COURS</span><h2>{type === "photo" ? "Votre photo prend forme." : "Votre vidéo prend forme."}</h2><p>La création peut prendre quelques minutes. Cette page affichera le résultat dès qu’il sera prêt.</p><div className="generation-wait-tip" key={conseil}>{conseils[conseil]}</div></div>
    <div className="generation-wait-line" aria-hidden="true"><span/></div>
  </section>;
}

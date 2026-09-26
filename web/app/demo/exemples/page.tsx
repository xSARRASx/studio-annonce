"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowLeftRight, ArrowUpRight, Check, Sparkles } from "lucide-react";
import "../studio.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const before = `${base}/demo/salon-avant.png`;
const examples = [
  {
    id: "lumiere",
    label: "Plus de lumière",
    detail: "Éclaircir la pièce en gardant le mobilier.",
    image: `${base}/demo/salon-apres.png`,
    alt: "Salon d’exemple éclairci, avec son mobilier conservé",
  },
  {
    id: "ambiance",
    label: "Nouvelle ambiance",
    detail: "Faire évoluer les couleurs et l’atmosphère.",
    image: `${base}/demo/salon-deco.png`,
    alt: "Salon d’exemple dans une ambiance terracotta",
  },
  {
    id: "decoration",
    label: "Décoration complète",
    detail: "Remplacer le mobilier et repenser la pièce.",
    image: `${base}/demo/salon-deco-complete.png`,
    alt: "Salon d’exemple entièrement redécoré",
  },
] as const;

export default function ExamplesPage() {
  const [selected, setSelected] = useState(0);
  const [split, setSplit] = useState(48);
  const example = examples[selected];

  return (
    <div className="studio-demo examples-page">
      <div className="demo-ribbon"><span className="status-dot"/> Démo · images d’exemple <span className="ribbon-detail">· créations de démonstration</span></div>
      <header className="site-header">
        <Link href="/demo/" className="brand" aria-label="Studio Annonce, accueil">
          <span className="brand-mark"><Image src={`${base}/demo/porte-lumineuse.svg`} alt="" width={40} height={44}/></span>
          <span>studio<span className="brand-light">annonce</span></span>
        </Link>
        <nav aria-label="Navigation du site">
          <Link href="/demo/exemples/" aria-current="page">Exemples</Link>
          <Link href="/demo/tarifs/">Tarifs</Link>
        </nav>
        <Link className="button dark small" href="/demo/">Le studio <ArrowUpRight size={16}/></Link>
      </header>

      <main className="examples-main">
        <Link className="examples-back" href="/demo/">← Retour à l’accueil</Link>
        <section className="examples-intro" aria-labelledby="examples-title">
          <span className="section-kicker"><Sparkles size={14}/> DES IDÉES, EN IMAGES</span>
          <h1 id="examples-title">Votre pièce.<br/><em>Plusieurs possibilités.</em></h1>
          <p>Comparez le même salon avant et après. Choisissez une idée pour voir comment l’ambiance peut changer.</p>
        </section>

        <section className="examples-viewer" aria-label="Comparaison avant et après">
          <div className="examples-photo" style={{ "--example-split": `${split}%` } as CSSProperties}>
            <Image className="examples-result" src={example.image} alt={example.alt} fill priority sizes="(max-width: 800px) 100vw, 68vw"/>
            <div className="examples-before"><Image src={before} alt="Salon d’exemple avant la transformation" fill sizes="(max-width: 800px) 100vw, 68vw"/></div>
            <span className="photo-label before-label">Avant</span>
            <span className="photo-label after-label">Après · {example.label.toLowerCase()}</span>
            <span className="examples-divider" aria-hidden="true"><ArrowLeftRight size={16}/></span>
            <input aria-label="Déplacer le curseur pour comparer avant et après" type="range" min="0" max="100" value={split} onChange={event => setSplit(Number(event.target.value))}/>
          </div>
          <div className="examples-caption"><span><Check size={16}/> Même pièce, idée différente</span><span>Faites glisser pour comparer</span></div>
          <div className="examples-options" role="group" aria-label="Choisir un exemple de transformation">
            {examples.map((item, index) => (
              <button key={item.id} type="button" aria-pressed={selected === index} className={selected === index ? "examples-option is-selected" : "examples-option"} onClick={() => setSelected(index)}>
                <span className="examples-option-number">0{index + 1}</span>
                <span className="examples-option-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                {selected === index && <Check size={18}/>}
              </button>
            ))}
          </div>
        </section>

        <section className="examples-next">
          <div><span className="section-kicker">À VOUS D’IMAGINER</span><h2>Et si c’était votre logement&nbsp;?</h2><p>Ces images montrent le principe. Dans le studio, décrivez le changement que vous souhaitez.</p></div>
          <Link className="button dark" href="/demo/">Découvrir le studio <ArrowUpRight size={18}/></Link>
        </section>
        <p className="examples-note">Images fictives créées pour la démonstration. La retouche automatique n’est pas encore activée.</p>
      </main>
      <footer><Link href="/demo/" className="brand" aria-label="Studio Annonce, accueil"><span className="brand-mark"><Image src={`${base}/demo/porte-lumineuse.svg`} alt="" width={34} height={38}/></span><span>studio<span className="brand-light">annonce</span></span></Link><span>Un nouveau regard sur votre intérieur.</span><Link href="/demo/tarifs/">Voir les tarifs →</Link></footer>
    </div>
  );
}

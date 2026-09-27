"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Download, Film, ImagePlus, MessageSquareText, Sparkles, WandSparkles } from "lucide-react";
import { asset } from "./library";

/* Les quatre versions réelles du salon d'exemple, dans l'ordre où elles ont été produites. */
const lxVersions = [
  { id: "original", label: "Votre photo", demande: "La photo prise au téléphone", src: asset("salon-avant.png") },
  { id: "lumiere", label: "Plus de lumière", demande: "« Un salon plus lumineux, range un peu »", src: asset("salon-apres.png") },
  { id: "terracotta", label: "Couleurs chaudes", demande: "« Des tons terracotta, plus chaleureux »", src: asset("salon-deco.png") },
  { id: "deco", label: "Toute la déco", demande: "« Change toute la déco, garde la pièce »", src: asset("salon-deco-complete.png") },
];

/* Incline doucement un objet 3D selon la position du pointeur, et le remet à plat quand il sort. */
function useInclinaison() {
  const ref = useRef<HTMLDivElement>(null);
  function bouger(event: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current; if (!el || event.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--lx-rx", `${((event.clientY - r.top) / r.height - 0.5) * -8}deg`);
    el.style.setProperty("--lx-ry", `${((event.clientX - r.left) / r.width - 0.5) * 10}deg`);
  }
  function sortir() { const el = ref.current; if (!el) return; el.style.removeProperty("--lx-rx"); el.style.removeProperty("--lx-ry"); }
  return { ref, onPointerMove: bouger, onPointerLeave: sortir };
}

/* 1. Une photo, plusieurs idées : les versions empilées en 3D, on choisit laquelle passe devant. */
export function LxDeck() {
  const [actif, setActif] = useState(3);
  const [touche, setTouche] = useState(false);
  useEffect(() => {
    if (touche || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const minuterie = window.setInterval(() => setActif(i => (i + 1) % lxVersions.length), 3600);
    return () => window.clearInterval(minuterie);
  }, [touche]);
  const choisir = (i: number) => { setTouche(true); setActif(i); };
  return <section className="lx-section lx-deck-section" aria-labelledby="lx-deck-title">
    <div className="lx-deck-copy">
      <span className="section-kicker">UNE PHOTO, TOUTES VOS IDÉES</span>
      <h2 id="lx-deck-title">Vous demandez.<br/><em>La pièce change.</em></h2>
      <p>Toutes vos versions restent gardées. Vous revenez à celle que vous préférez.</p>
      <div className="lx-chips" role="group" aria-label="Choisir une version du salon">
        {lxVersions.map((v, i) => <button key={v.id} type="button" aria-pressed={i === actif} onClick={() => choisir(i)}>
          <span className="lx-chip-dot"/>{v.label}
        </button>)}
      </div>
      <p className="lx-demande" aria-live="polite"><MessageSquareText size={16}/> {lxVersions[actif].demande}</p>
    </div>
    <div className="lx-deck" aria-hidden="true">
      {lxVersions.map((v, i) => {
        const ecart = (i - actif + lxVersions.length) % lxVersions.length;
        return <button key={v.id} type="button" tabIndex={-1} className="lx-card" data-ecart={ecart} onClick={() => choisir(i)}>
          <Image src={v.src} alt="" fill sizes="(max-width: 800px) 90vw, 600px" unoptimized/>
          <span className="lx-card-label">{i === 0 ? "Avant" : v.label}{i > 0 && <Sparkles size={12}/>}</span>
        </button>;
      })}
      <span className="lx-deck-shadow"/>
    </div>
  </section>;
}

/* 2. Trois gestes : chaque étape a sa petite scène en relief. */
export function LxSteps() {
  return <section className="lx-section" aria-labelledby="lx-steps-title">
    <div className="lx-heading"><span className="section-kicker">EN TROIS GESTES</span><h2 id="lx-steps-title">Du téléphone à l’annonce.</h2></div>
    <div className="lx-steps">
      <article className="lx-step lx-peach">
        <div className="lx-scene">
          <div className="lx-phone-photo lx-p1"><Image src={asset("visite/cuisine.png")} alt="" fill sizes="160px" unoptimized/></div>
          <div className="lx-phone-photo lx-p2"><Image src={asset("visite/chambre.png")} alt="" fill sizes="160px" unoptimized/></div>
          <div className="lx-phone-photo lx-p3"><Image src={asset("salon-avant.png")} alt="" fill sizes="180px" unoptimized/></div>
          <span className="lx-float lx-f-upload"><ImagePlus size={22}/></span>
        </div>
        <div className="lx-step-copy"><span className="journey-number">01</span><h3>Déposez vos photos.</h3><p>Même de travers, même un peu en désordre.</p></div>
      </article>
      <article className="lx-step lx-lavender">
        <div className="lx-scene">
          <div className="lx-bubble lx-b1">Enlève le bazar sur la table</div>
          <div className="lx-bubble lx-b2 lx-ia"><WandSparkles size={15}/> C’est fait. Je fais le lit aussi ?</div>
          <div className="lx-bubble lx-b3">Oui, et plus de lumière</div>
        </div>
        <div className="lx-step-copy"><span className="journey-number">02</span><h3>Dites ce que vous voulez.</h3><p>Avec vos mots, comme à quelqu’un.</p></div>
      </article>
      <article className="lx-step lx-sage">
        <div className="lx-scene">
          <div className="lx-hd"><Image src={asset("salon-apres.png")} alt="" fill sizes="220px" unoptimized/><span className="lx-hd-tag">HD</span></div>
          <span className="lx-float lx-f-check"><Check size={24}/></span>
          <span className="lx-float lx-f-dl"><Download size={18}/> Gardée</span>
        </div>
        <div className="lx-step-copy"><span className="journey-number">03</span><h3>Gardez la meilleure.</h3><p>Vous payez seulement celle-là.</p></div>
      </article>
    </div>
  </section>;
}

/* 3. L'annonce assemblée : une page de location en relief, qui suit le pointeur. */
export function LxListing() {
  const inclinaison = useInclinaison();
  return <section className="lx-section lx-listing-section" aria-labelledby="lx-listing-title">
    <div className="lx-listing-copy">
      <span className="section-kicker">VOTRE ANNONCE, PIÈCE PAR PIÈCE</span>
      <h2 id="lx-listing-title">Toutes vos pièces.<br/><em>Le même soin.</em></h2>
      <ul className="lx-points">
        <li><Check size={17}/> La même lumière d’une photo à l’autre</li>
        <li><Check size={17}/> Des lignes droites, un cadrage net</li>
        <li><Check size={17}/> Prêt pour Airbnb, Booking ou Leboncoin</li>
      </ul>
    </div>
    <div className="lx-stage" {...inclinaison}>
      <div className="lx-browser">
        <div className="lx-browser-bar"><span/><span/><span/><em>votre-annonce</em></div>
        <div className="lx-gallery">
          <div className="lx-g-main"><Image src={asset("salon-apres.png")} alt="Salon retouché" fill sizes="(max-width: 800px) 60vw, 380px" unoptimized/></div>
          <div><Image src={asset("visite/sejour.png")} alt="Séjour retouché" fill sizes="180px" unoptimized/></div>
          <div><Image src={asset("visite/cuisine.png")} alt="Cuisine retouchée" fill sizes="180px" unoptimized/></div>
          <div><Image src={asset("visite/chambre.png")} alt="Chambre retouchée" fill sizes="180px" unoptimized/></div>
          <div><Image src={asset("salon-deco-complete.png")} alt="Salon avec une nouvelle décoration" fill sizes="180px" unoptimized/></div>
        </div>
        <div className="lx-listing-text"><strong>Appartement lumineux, 2 pièces</strong><span>4 voyageurs · 1 chambre · 1 salle de bain</span></div>
      </div>
      <span className="lx-tag lx-t1"><Sparkles size={14}/> 5 photos retouchées</span>
      <span className="lx-tag lx-t2"><Check size={14}/> Prête à publier</span>
    </div>
  </section>;
}

/* 4. La suite : la visite vidéo, annoncée comme telle. */
export function LxVideo() {
  return <section className="lx-section lx-video-section" aria-labelledby="lx-video-title">
    <div className="lx-video-phone"><video src={asset("visite-guidee-demo.mp4")} poster={asset("visite/sejour.png")} autoPlay muted loop playsInline aria-label="Aperçu d’une visite en vidéo"/></div>
    <div className="lx-video-copy">
      <span className="lx-soon"><Film size={14}/> Bientôt</span>
      <h2 id="lx-video-title">La visite en vidéo.</h2>
      <p>À partir de vos photos gardées, une courte vidéo de votre logement, prête pour vos réseaux.</p>
      <p className="lx-fineprint">Aperçu de principe, monté à partir d’images d’exemple.</p>
    </div>
  </section>;
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Images, Sparkles, WandSparkles } from "lucide-react";
import { Brand, Compare } from "./studio-parts";
import { asset } from "./library";
const after = asset("salon-apres.png");
const before = asset("salon-avant.png");
export default function Landing({ onStudio }: { onStudio: () => void }) {
return <>
          <header className="site-header"><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Navigation du site"><Link href="/demo/exemples/">Exemples</Link><Link href="/demo/tarifs/">Tarifs</Link><Link href="/demo/aide/">Aide</Link></nav><button className="button small dark" onClick={() => onStudio()}>Ouvrir le studio <ArrowUpRight size={16}/></button></header>
      <main>
        <section className="hero">
          <div className="hero-copy"><div className="intro-pill"><Sparkles size={15}/> Le studio photo de votre logement</div><h1>De belles photos.<br/><em>Pour votre annonce.</em></h1><p className="hero-description">Éclairez, rangez ou aménagez votre pièce en quelques mots.</p><div className="hero-actions"><button className="button dark" onClick={() => onStudio()}>Essayer le studio <ArrowRight size={18}/></button></div><p className="hero-reassurance"><Check size={16}/> Votre pièce, simplement mise en valeur.</p></div>
          <div className="hero-visual"><Compare/><div className="visual-caption">Faites glisser pour comparer.</div></div>
        </section>
        <section id="comment" className="visual-journey" aria-labelledby="journey-title"><div className="journey-heading"><span className="section-kicker">DU POTENTIEL AU COUP DE CŒUR</span><h2 id="journey-title">Une nouvelle lumière sur votre intérieur.</h2></div><div className="journey-grid">
          <article className="journey-card peach"><div className="mini-scene scene-photo" aria-hidden="true"><div className="paper-back"/><div className="paper-photo"><Image src={before} alt="" fill sizes="180px"/><span>Votre intérieur</span></div><span className="scene-bubble"><Images size={24}/></span></div><div className="journey-copy"><span className="journey-number">01</span><h3>Tout part de chez vous.</h3><p>Une photo de téléphone suffit.</p></div></article>
          <article className="journey-card lavender"><div className="mini-scene scene-idea" aria-hidden="true"><span className="idea-orbit"/><div className="idea-message">Un salon plus lumineux <Sparkles size={20}/></div><span className="idea-wand"><WandSparkles size={40}/></span></div><div className="journey-copy"><span className="journey-number">02</span><h3>À votre idée.</h3><p>La lumière, le rangement, l’ambiance.</p></div></article>
          <article className="journey-card sage"><div className="mini-scene scene-result" aria-hidden="true"><div className="result-photo"><Image src={after} alt="" fill sizes="210px"/></div><span className="result-check"><Check size={26}/></span><span className="result-label">Prête à se démarquer</span></div><div className="journey-copy"><span className="journey-number">03</span><h3>Le coup de cœur commence ici.</h3><p>Une photo qui donne envie de visiter.</p></div></article>
        </div></section>
        <section className="pricing-preview" aria-labelledby="pricing-title"><div className="pricing-preview-copy"><span className="section-kicker">LES TARIFS, TOUT SIMPLEMENT</span><h2 id="pricing-title">Une belle photo.<br/><em>À votre rythme.</em></h2><p>À l’unité ou en pack, choisissez ce qui vous convient. Vous payez la photo que vous gardez en HD.</p><Link className="button dark" href="/demo/tarifs/">Découvrir les tarifs <ArrowUpRight size={18}/></Link></div><div className="price-preview-card"><span className="price-preview-icon"><Images size={26}/></span><p>À l’unité</p><div className="preview-amount">1,90 <span>€ / photo</span></div><div className="price-preview-rule"/><p className="price-preview-benefit"><Check size={17}/> Votre photo en haute définition</p><p className="price-preview-benefit"><Check size={17}/> Des packs pour plusieurs photos</p><span className="preview-fineprint">Tarifs prévus au lancement · démo sans achat</span></div></section>
      </main><footer><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Liens utiles"><Link href="/demo/aide/">Aide</Link><Link href="/demo/tarifs/">Tarifs</Link><Link href="/mobile-preview/">Aperçu mobile</Link></nav></footer>
    </>;
}

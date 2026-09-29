"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Images, Sparkles } from "lucide-react";
import { Brand, Compare } from "./studio-parts";
import { LxDeck, LxListing, LxSteps, LxVideo } from "./showcase";
import "./landing3d.css";
export default function Landing({ onStudio }: { onStudio: () => void }) {
return <>
          <header className="site-header"><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Navigation du site"><Link href="/demo/exemples/">Exemples</Link><Link href="/demo/tarifs/">Tarifs</Link><Link href="/demo/aide/">Aide</Link></nav><Link className="button small dark" href="/connexion/">Mon compte <ArrowUpRight size={16}/></Link></header>
      <main>
        <section className="hero">
          <div className="hero-copy"><div className="intro-pill"><Sparkles size={15}/> Le studio photo de votre logement</div><h1>De belles photos.<br/><em>Pour votre annonce.</em></h1><p className="hero-description">Éclairez, rangez ou aménagez votre pièce en quelques mots.</p><div className="hero-actions"><Link className="button dark" href="/connexion/">Créer mon compte <ArrowRight size={18}/></Link><button className="button" onClick={() => onStudio()}>Voir la démo</button></div><p className="hero-reassurance"><Check size={16}/> Votre pièce, simplement mise en valeur.</p></div>
          <div className="hero-visual"><Compare/><div className="visual-caption">Faites glisser pour comparer.</div></div>
        </section>
        <LxDeck/>
        <LxSteps/>
        <LxListing/>
        <LxVideo/>
        <section className="pricing-preview" aria-labelledby="pricing-title"><div className="pricing-preview-copy"><span className="section-kicker">LES TARIFS, TOUT SIMPLEMENT</span><h2 id="pricing-title">Une belle photo.<br/><em>À votre rythme.</em></h2><p>À l’unité ou en pack, choisissez ce qui vous convient. Vous payez la photo que vous gardez en HD.</p><Link className="button dark" href="/demo/tarifs/">Découvrir les tarifs <ArrowUpRight size={18}/></Link></div><div className="price-preview-card"><span className="price-preview-icon"><Images size={26}/></span><p>À l’unité</p><div className="preview-amount">1,90 <span>€ / photo</span></div><div className="price-preview-rule"/><p className="price-preview-benefit"><Check size={17}/> Votre photo en haute définition</p><p className="price-preview-benefit"><Check size={17}/> Des packs pour plusieurs photos</p><span className="preview-fineprint">Tarifs prévus au lancement · démo sans achat</span></div></section>
      </main><footer><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Liens utiles"><Link href="/demo/aide/">Aide</Link><Link href="/demo/tarifs/">Tarifs</Link><Link href="/mobile-preview/">Aperçu mobile</Link></nav></footer>
    </>;
}

"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Images, Sparkles } from "lucide-react";
import { Brand, Compare } from "./studio-parts";
import { LxListing, LxVideo } from "./showcase";
import "./landing3d.css";
import { PhotoGallery, GuidedExample, exampleImage } from "./photo-gallery";
import { PHOTO_EXAMPLES } from "../../../shared/photo-examples";
export default function Landing({ onStudio }: { onStudio: () => void }) {
return <>
          <header className="site-header"><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Navigation du site"><Link href="/demo/exemples/">Exemples</Link><Link href="/demo/tarifs/">Tarifs</Link><Link href="/demo/aide/">Aide</Link><Link href="/blog/">Blog</Link></nav><Link className="button small dark" href="/connexion/">Mon compte <ArrowUpRight size={16}/></Link></header>
      <main>
        <section className="hero">
          <div className="hero-copy"><div className="intro-pill"><Sparkles size={15}/> Le studio photo de votre logement</div><h1>De belles photos.<br/><em>Pour votre annonce.</em></h1><p className="hero-description">Éclairez, rangez ou aménagez votre pièce en quelques mots.</p><div className="hero-actions"><Link className="button dark" href="/connexion/">Créer mon compte <ArrowRight size={18}/></Link><button className="button" onClick={() => onStudio()}>Voir la démo</button></div><p className="hero-reassurance"><Check size={16}/> Votre pièce, simplement mise en valeur.</p></div>
          <div className="hero-visual"><Compare priority before={exampleImage(PHOTO_EXAMPLES[0], "avant")} result={exampleImage(PHOTO_EXAMPLES[0], "apres")} beforeAlt={PHOTO_EXAMPLES[0].altBefore} resultAlt={PHOTO_EXAMPLES[0].altAfter}/><div className="visual-caption">Faites glisser pour comparer · proposition de décoration.</div></div>
        </section>
        <PhotoGallery compact/>
        <GuidedExample embedded/>
        <LxListing/>
        <LxVideo/>
        <section className="pg-blog-teaser"><div><span className="section-kicker">LE BLOG DU STUDIO</span><h2>De belles photos,<br/><em>ça se prépare aussi.</em></h2><p>Retouche de lumière, décoration virtuelle, choix des images : des repères concrets pour présenter votre logement.</p></div><Link className="button outlined" href="/blog/">Lire nos conseils <ArrowRight size={17}/></Link></section>
        <section className="pricing-preview" aria-labelledby="pricing-title"><div className="pricing-preview-copy"><span className="section-kicker">LES TARIFS, TOUT SIMPLEMENT</span><h2 id="pricing-title">Une belle photo.<br/><em>À votre rythme.</em></h2><p>Des packs sans abonnement. Plus vous créez, moins chaque photo coûte.</p><Link className="button dark" href="/demo/tarifs/">Découvrir les tarifs <ArrowUpRight size={18}/></Link></div><div className="price-preview-card"><span className="price-preview-icon"><Images size={26}/></span><p>À partir de</p><div className="preview-amount">9,99 <span>€ / 10 crédits</span></div><div className="price-preview-rule"/><p className="price-preview-benefit"><Check size={17}/> 1 photo HD = 1 crédit</p><p className="price-preview-benefit"><Check size={17}/> Jusqu’à 0,60 € la photo</p><p className="price-preview-benefit"><Check size={17}/> Sans abonnement</p><span className="preview-fineprint">Achats ouverts après validation de la retouche</span></div></section>
      </main><footer><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Liens utiles"><Link href="/demo/aide/">Aide</Link><Link href="/blog/">Blog</Link><Link href="/demo/tarifs/">Tarifs</Link><Link href="/mobile-preview/">Aperçu mobile</Link></nav></footer>
    </>;
}

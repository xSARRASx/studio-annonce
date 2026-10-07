"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Images, Sparkles } from "lucide-react";
import { Brand, Compare } from "./studio-parts";
import { LxListing, LxVideo } from "./showcase";
import { Presentation } from "./presentation";
import "./landing3d.css";
import { PhotoGallery, GuidedExample, exampleImage } from "./photo-gallery";
import { PHOTO_EXAMPLES } from "../../../shared/photo-examples";
import { SignupOffer } from "./signup-offer";
export default function Landing() {
return <>
          <header className="site-header"><Brand onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}/><nav aria-label="Navigation du site"><Link href="/exemples/">Exemples</Link><Link href="/application/">Application</Link><Link href="/tarifs/">Tarifs</Link><Link href="/aide/">Aide</Link><Link href="/blog/">Blog</Link></nav><Link className="button small dark" href="/se-connecter/">Mon compte <ArrowUpRight size={16}/></Link></header>
      <main>
        <section className="hero">
          <div className="hero-copy"><div className="intro-pill"><Sparkles size={15}/> Photos et vidéos pour vos annonces immobilières</div><h1>De belles photos.<br/><em>Pour votre annonce.</em></h1><p className="hero-description">Ajoutez les photos de votre logement, indiquez ce que vous voulez améliorer et comparez le résultat avec l’original. Vous pouvez aussi préparer une visite vidéo en choisissant l’ordre des pièces et les mouvements de caméra.</p><div className="hero-actions"><Link className="button dark" href="/inscription/?suite=photo">Préparer ma photo offerte <ArrowRight size={18}/></Link><a className="button" href="#lx-video-section">Voir la vidéo d’exemple</a></div><p className="hero-reassurance"><Check size={16}/> Votre pièce, simplement mise en valeur.</p><div className="founder-byline"><a className="founder-portrait" href="https://www.youtube.com/@moresebastien" target="_blank" rel="noopener noreferrer" aria-label="Découvrir la chaîne YouTube de Sébastien More"><Image src="/demo/sebastien-more-guestlucky.webp" alt="Sébastien More" width={58} height={58} unoptimized/></a><div className="founder-details"><strong>by Sébastien More</strong><small>Fondateur de GuestLucky · plus de 3 000 membres accompagnés en conciergerie et sous-location</small><div className="founder-links"><a href="https://www.youtube.com/@moresebastien" target="_blank" rel="noopener noreferrer">Sa chaîne YouTube <ArrowUpRight size={12} aria-hidden="true"/></a><a href="https://www.guestlucky.com/" target="_blank" rel="noopener noreferrer">GuestLucky <ArrowUpRight size={12} aria-hidden="true"/></a></div></div></div></div>
          <div className="hero-visual"><Compare priority before={exampleImage(PHOTO_EXAMPLES[0], "avant")} result={exampleImage(PHOTO_EXAMPLES[0], "apres")} beforeSmall={exampleImage(PHOTO_EXAMPLES[0], "avant").replace(".webp", "-640.webp")} resultSmall={exampleImage(PHOTO_EXAMPLES[0], "apres").replace(".webp", "-640.webp")} beforeAlt={PHOTO_EXAMPLES[0].altBefore} resultAlt={PHOTO_EXAMPLES[0].altAfter}/><div className="visual-caption">Faites glisser pour comparer · proposition de décoration.</div></div>
        </section>
        <SignupOffer/>
        <Presentation/>
        <PhotoGallery compact/>
        <GuidedExample embedded/>
        <LxListing/>
        <LxVideo/>
        <section className="pg-blog-teaser"><div><span className="section-kicker">LE BLOG DU STUDIO</span><h2>De belles photos,<br/><em>ça se prépare aussi.</em></h2><p>Retouche de lumière, décoration virtuelle, choix des images : des repères concrets pour présenter votre logement. Commencez par <Link href="/blog/photos-immobilieres-smartphone/">photographier une pièce au smartphone</Link> ou <Link href="/blog/home-staging-virtuel-photo-annonce/">comprendre le home staging virtuel</Link>.</p></div><Link className="button outlined" href="/blog/">Lire nos conseils <ArrowRight size={17}/></Link></section>
        <section className="pricing-preview" aria-labelledby="pricing-title"><div className="pricing-preview-copy"><span className="section-kicker">LES TARIFS, TOUT SIMPLEMENT</span><h2 id="pricing-title">Une belle photo.<br/><em>À votre rythme.</em></h2><p>Des packs sans abonnement. Plus vous créez, moins chaque photo coûte.</p><Link className="button dark" href="/tarifs/">Découvrir les tarifs <ArrowUpRight size={18}/></Link></div><div className="price-preview-card"><span className="price-preview-icon"><Images size={26}/></span><p>À partir de</p><div className="preview-amount">9,99 <span>€ / 10 crédits</span></div><div className="price-preview-rule"/><p className="price-preview-benefit"><Check size={17}/> 1 photo HD = 1 crédit</p><p className="price-preview-benefit"><Check size={17}/> Jusqu’à 0,60 € la photo</p><p className="price-preview-benefit"><Check size={17}/> Sans abonnement</p><span className="preview-fineprint">Packs disponibles dans votre espace Crédits</span></div></section>
      </main>
    </>;
}

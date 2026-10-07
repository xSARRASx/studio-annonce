import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Images, Layers3, MessageSquareText, Smartphone } from "lucide-react";
import { PublicFooter, PublicHeader } from "../demo/aide/PublicChrome";
import "../demo/studio.css";
import "../demo/aide/public-pages.css";
import "./application.css";
import "../public-contrast.css";

export const metadata: Metadata = {
  title: "Application de retouche photo immobilière | Studio Annonce",
  description: "Découvrez l’application Studio Annonce : retouchez vos photos immobilières, préparez une visite vidéo et retrouvez vos créations par logement.",
  alternates: { canonical: "/application/" },
  openGraph: {
    title: "L’application Studio Annonce pour vos photos immobilières",
    description: "Photos, retouches et vidéos réunies par logement, sur le web et sur mobile.",
    url: "/application/", locale: "fr_FR", type: "website",
    images: ["/demo/exemples/salon-canape-rouille-apres.webp"],
  },
};

export default function ApplicationPage() {
  return <div className="studio-demo public-info application-page">
    <PublicHeader current="application" />
    <main className="public-main">
      <header className="application-hero">
        <span className="public-eyebrow">LE STUDIO, SUR LE WEB ET SUR MOBILE</span>
        <h1>Vos photos immobilières.<br /><em>Un studio pour les préparer.</em></h1>
        <p>Studio Annonce réunit vos logements, vos photos, vos demandes de retouche et les versions obtenues. L’application vous aide à formuler une idée précise, à garder l’original et à comparer les propositions avant d’utiliser une image dans une annonce.</p>
        <div className="application-actions"><Link className="button dark" href="/exemples/">Voir les avant/après <ArrowRight size={17} aria-hidden="true" /></Link><Link className="button outlined" href="/inscription/?suite=photo">Préparer ma photo <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <p className="application-status">Ajoutez vos photos, relisez votre demande, puis confirmez chaque création dans votre espace. Le coût en crédits et la disponibilité du service s’affichent avant le lancement.</p>
      </header>

      <section className="application-section" aria-labelledby="application-steps-title">
        <div className="application-section-heading"><span className="public-eyebrow">UN PARCOURS EN TROIS TEMPS</span><h2 id="application-steps-title">Comment préparer une retouche photo immobilière ?</h2><p>Chaque étape laisse votre photo de départ accessible. Vous décidez de la demande et vérifiez la proposition.</p></div>
        <div className="application-steps">
          <article><span className="application-step-number">01</span><Images size={27} aria-hidden="true" /><h3>Ajoutez la photo du logement</h3><p>Importez un salon, une chambre ou une autre pièce, puis rangez la photo dans un logement. Une image nette, droite et suffisamment large facilite la lecture de l’espace.</p><Link href="/blog/photos-immobilieres-smartphone/">Préparer la prise de vue →</Link></article>
          <article><span className="application-step-number">02</span><MessageSquareText size={27} aria-hidden="true" /><h3>Décrivez votre retouche</h3><p>Éclaircir la pièce, enlever un objet ou imaginer un mobilier différent : écrivez ce qui doit changer et ce qui doit rester. L’assistant aide à préciser la demande avant toute génération.</p><Link href="/blog/demande-retouche-photo-immobiliere/">Formuler une demande claire →</Link></article>
          <article><span className="application-step-number">03</span><Layers3 size={27} aria-hidden="true" /><h3>Comparez les versions</h3><p>Lorsqu’une proposition est produite, retrouvez l’original et les versions de cette photo. Comparez les détails, puis signalez clairement dans l’annonce tout aménagement virtuel ou élément inventé.</p><Link href="/exemples/">Comparer huit exemples →</Link></article>
        </div>
      </section>

      <section className="application-section application-functions" aria-labelledby="application-functions-title">
        <div className="application-section-heading"><span className="public-eyebrow">DANS VOTRE ESPACE</span><h2 id="application-functions-title">Photos, idées et versions au même endroit.</h2></div>
        <div className="application-function-grid">
          <article><h3>Mes créations</h3><p>Retrouvez vos photos par logement, vos demandes et l’historique des versions d’une photo. L’original reste disponible pour comparer ce qui a vraiment changé.</p></article>
          <article><h3>Aide à la création</h3><p>Décrivez librement votre projet ou choisissez plusieurs idées dans le questionnaire. Vous pouvez relire et modifier le brief avant de demander une retouche.</p></article>
          <article><h3>Vidéo vers photos</h3><p>L’outil extrait des images d’une vidéo sur votre appareil. Vous choisissez les instants à garder, puis retrouvez les photos dans votre espace.</p></article>
          <article><h3>Photos vers vidéo</h3><p>Choisissez les photos dans l’ordre de la visite, indiquez le trajet et le mouvement souhaités, puis relisez le coût en crédits avant de lancer la vidéo.</p></article>
        </div>
      </section>

      <section className="application-mobile" aria-labelledby="application-mobile-title">
        <Smartphone size={35} aria-hidden="true" />
        <div><span className="public-eyebrow">APPLICATION MOBILE</span><h2 id="application-mobile-title">Le studio dans votre poche.</h2><p>Ouvrez l’application mobile dans le navigateur de votre téléphone et retrouvez le même compte, vos photos et vos vidéos.</p></div>
        <a className="button outlined" href="/mobile/">Ouvrir l’application mobile <ArrowRight size={17} aria-hidden="true" /></a>
      </section>

      <section className="public-next"><div><span className="public-eyebrow">UNE QUESTION AVANT DE COMMENCER ?</span><h2>Comprendre les crédits et les retouches.</h2><p>L’aide explique la photo offerte, les versions, les sept jours d’ajustement et la disponibilité actuelle des outils.</p></div><Link className="button dark" href="/aide/">Consulter l’aide <ArrowRight size={17} aria-hidden="true" /></Link></section>
    </main>
    <PublicFooter />
  </div>;
}

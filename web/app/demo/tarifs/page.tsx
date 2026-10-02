import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Download, Gift, History, ImagePlus } from "lucide-react";
import { PublicFooter, PublicHeader } from "../aide/PublicChrome";
import "../studio.css";
import "../aide/public-pages.css";

export const metadata: Metadata = {
  title: "Tarifs photo et vidéo · Studio Annonce",
  description: "Packs photo dès 0,60 € la photo et packs vidéo de 5 à 30 secondes, sans abonnement.",
  alternates: { canonical: "/tarifs/" },
};

const packs = [
  { credits: 10, price: "9,99", unit: "1,00", label: "Pour commencer", description: "10 photos gardées en HD." },
  { credits: 30, price: "24,99", unit: "0,83", label: "Essentiel", description: "30 photos · 17 % moins cher par photo." },
  { credits: 50, price: "34,99", unit: "0,70", label: "Le plus choisi", description: "50 photos · 30 % moins cher par photo." },
  { credits: 100, price: "59,99", unit: "0,60", label: "Meilleur tarif", description: "100 photos · 40 % moins cher par photo." },
];
const videoPacks = [
  { credits: 1, seconds: 5, price: "6,99", unit: "6,99", label: "Un premier essai", saving: "Tarif à l’unité" },
  { credits: 2, seconds: 10, price: "12,99", unit: "6,50", label: "Essentiel", saving: "7 % de moins qu’à l’unité" },
  { credits: 4, seconds: 20, price: "21,99", unit: "5,50", label: "Visite courte", saving: "21 % de moins qu’à l’unité" },
  { credits: 6, seconds: 30, price: "29,99", unit: "5,00", label: "Meilleur tarif", saving: "28 % de moins qu’à l’unité" },
];

export default function PublicPricing() {
  return (
    <div className="studio-demo public-info tariffs-page">
      <PublicHeader current="tarifs" />
      <main className="public-main">
        <section className="tariffs-heading" aria-labelledby="tariffs-title">
          <div><span className="public-eyebrow">PHOTOS ET VIDÉOS · SANS ABONNEMENT</span><h1 id="tariffs-title">Vos créations,<br /><em>au prix clair.</em></h1><p>Choisissez vos crédits photo ou vidéo. Les packs sont séparés et cumulables : plus vous en prenez, moins chaque création coûte.</p></div>
          <aside className="tariffs-offer"><span className="tariffs-gift"><Gift size={25} aria-hidden="true" /></span><div><p>POUR VOTRE PREMIER ESSAI</p><strong>La première photo offerte.</strong><span>Après vérification de votre email.<br /> 1 génération + 1 correction, HD sans filigrane.</span><Link className="tariffs-offer-link" href="/connexion/?suite=photo">Préparer ma photo offerte <ArrowRight size={15} aria-hidden="true" /></Link></div></aside>
        </section>
        <nav className="tariffs-shortcuts" aria-label="Voir les tarifs par création"><a href="#packs-photo"><span>PHOTOS</span><strong>10 photos dès 9,99 €</strong><small>La première est offerte · 1 crédit par photo gardée</small><ArrowRight size={19} aria-hidden="true" /></a><a href="#packs-video"><span>VIDÉOS</span><strong>5 s dès 6,99 € · 30 s à 29,99 €</strong><small>1 crédit par essai de 5 secondes · tarif dégressif</small><ArrowRight size={19} aria-hidden="true" /></a></nav>
        <section id="packs-photo" className="tariffs-packs" aria-label="Packs de crédits photo">
          {packs.map(pack => <article className={`tariffs-pack${pack.credits === 50 ? " tariffs-pack-featured" : ""}`} key={pack.credits}>
            <span className="tariffs-pack-label">{pack.label}</span>
            <h2>{pack.credits} <span>crédits photo</span></h2>
            <p className="tariffs-pack-description">{pack.description}</p>
            <div className="tariffs-amount">{pack.price}<span>€</span></div>
            <p className="tariffs-unit">{pack.unit} € par photo</p>
            <div className="tariffs-pack-line"><Check size={15} aria-hidden="true" /><span>1 photo HD = 1 crédit</span></div>
          </article>)}
        </section>
        <p className="tariffs-availability">Packs photo sans abonnement. Leur achat ouvrira avec la retouche IA.</p>
        <section id="packs-video" className="tariffs-video" aria-labelledby="video-price-title">
          <div className="tariffs-video-heading"><span className="public-eyebrow">VIDÉOS : UN SOLDE SÉPARÉ</span><h2 id="video-price-title">Une visite de 5 à 30 secondes.<br /><em>Le prix baisse avec la durée.</em></h2><p>1 crédit vidéo finance un essai de 5 secondes en 720p. Avec 6 crédits, vous pouvez demander une vidéo continue de 30 secondes, ou plusieurs essais plus courts. Chaque nouvelle génération utilise à nouveau les crédits correspondant à sa durée. Vos crédits photo restent intacts.</p></div>
          <div className="tariffs-packs">{videoPacks.map(pack => <article className={`tariffs-pack${pack.seconds === 30 ? " tariffs-pack-featured" : ""}`} key={pack.seconds}>
            <span className="tariffs-pack-label">{pack.label}</span><h2>{pack.seconds} <span>secondes</span></h2>
            <p className="tariffs-pack-description">{pack.credits} crédit{pack.credits > 1 ? "s" : ""} vidéo · {pack.saving}.</p>
            <div className="tariffs-amount">{pack.price}<span>€</span></div><p className="tariffs-unit">{pack.unit} € les 5 secondes</p>
            <div className="tariffs-pack-line"><Clock3 size={15} aria-hidden="true" /><span>Un clip continu ou plusieurs essais</span></div>
          </article>)}</div>
          <p className="tariffs-availability">Avant chaque essai, le nombre de crédits sera confirmé. Un essai terminé pourra être prévisualisé et téléchargé sans second débit ; un nouvel essai sera facturé. En cas d’échec technique, les crédits réservés seront rendus. Les achats vidéo restent fermés pendant la phase pilote.</p>
        </section>
        <section className="tariffs-included" aria-labelledby="included-title"><h2 id="included-title">Ce qui est inclus avec une photo payante</h2><div><span><ImagePlus size={20} aria-hidden="true" /><strong>1 correction incluse</strong><small>Après la première génération</small></span><span><Download size={20} aria-hidden="true" /><strong>Téléchargement HD</strong><small>Votre version choisie</small></span><span><Clock3 size={20} aria-hidden="true" /><strong>7 jours pour ajuster</strong><small>Avec la correction restante</small></span><span><History size={20} aria-hidden="true" /><strong>Historique des versions</strong><small>Pour revoir les propositions</small></span></div></section>
        <section className="tariffs-timeline" aria-labelledby="timeline-title">
          <div className="tariffs-timeline-heading"><span className="public-eyebrow">POUR LES PHOTOS</span><h2 id="timeline-title">Ce qui se passe<br /><em>après le téléchargement.</em></h2><Link href="/aide/#versions">Comprendre les 7 jours <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <ol>
            <li><span className="timeline-number">1</span><div><strong>Vous gardez votre photo</strong><p>Le premier téléchargement HD consomme un crédit. Un message confirme la date de fin de vos retouches.</p></div></li>
            <li><span className="timeline-number">2</span><div><strong>Vous avez 7 jours pour ajuster</strong><p>Utilisez la correction incluse si elle reste disponible. Toute correction supplémentaire coûte 1 crédit. Le délai ne redémarre pas à chaque téléchargement.</p></div></li>
            <li><span className="timeline-number">3</span><div><strong>Envie de reprendre plus tard ?</strong><p>Un crédit supplémentaire débloque une seule correction, utilisable pendant 7 jours. Les versions restent rattachées à votre photo.</p></div></li>
          </ol>
        </section>
        <div className="tariffs-conditions"><p>Une première génération et une correction sont incluses par photo. Ensuite, chaque correction coûte 1 crédit photo. Les nouvelles créations photo sont limitées à 30 depuis le dernier achat. Un ancien téléchargement ne remet pas ce compteur à zéro.</p><p>Les aperçus photo payants sont protégés par un filigrane ajouté hors génération. La photo offerte et les fichiers achetés se téléchargent sans filigrane. Les crédits photo et vidéo sont deux soldes distincts ; chaque essai vidéo abouti consomme les crédits annoncés avant sa création.</p></div>
        <section className="public-next"><div><span className="public-eyebrow">PRÉPAREZ VOS PHOTOS</span><h2>Votre espace vous attend.</h2><p>Créez votre compte, ajoutez votre logement et préparez vos demandes.</p></div><Link className="button dark" href="/connexion/?suite=photo">Préparer ma photo offerte <ArrowRight size={17} aria-hidden="true" /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

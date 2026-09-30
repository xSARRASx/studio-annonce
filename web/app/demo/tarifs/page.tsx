import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Download, Gift, History, ImagePlus } from "lucide-react";
import { PublicFooter, PublicHeader } from "../aide/PublicChrome";
import "../studio.css";
import "../aide/public-pages.css";

export const metadata: Metadata = {
  title: "Tarifs photo et vidéo · Studio Annonce",
  description: "Packs photo dès 0,60 € la photo et packs vidéo de 10 à 30 secondes, sans abonnement.",
};

const packs = [
  { credits: 10, price: "9,99", unit: "1,00", label: "Pour commencer", description: "10 photos gardées en HD." },
  { credits: 30, price: "24,99", unit: "0,83", label: "Essentiel", description: "30 photos · 17 % moins cher par photo." },
  { credits: 50, price: "34,99", unit: "0,70", label: "Le plus choisi", description: "50 photos · 30 % moins cher par photo." },
  { credits: 100, price: "59,99", unit: "0,60", label: "Meilleur tarif", description: "100 photos · 40 % moins cher par photo." },
];
const videoPacks = [
  { credits: 2, seconds: 10, price: "12,99", unit: "6,50", label: "Essentiel" },
  { credits: 4, seconds: 20, price: "21,99", unit: "5,50", label: "Visite courte" },
  { credits: 6, seconds: 30, price: "29,99", unit: "5,00", label: "Meilleur tarif" },
];

export default function PublicPricing() {
  return (
    <div className="studio-demo public-info tariffs-page">
      <PublicHeader current="tarifs" />
      <main className="public-main">
        <section className="tariffs-heading" aria-labelledby="tariffs-title">
          <div><span className="public-eyebrow">VOS PHOTOS, SANS ABONNEMENT</span><h1 id="tariffs-title">Plus vous créez,<br /><em>moins chaque photo coûte.</em></h1><p>Un crédit est utilisé quand vous téléchargez une photo en HD.<br className="desktop-break" /> Les crédits restent disponibles sur votre compte.</p></div>
          <aside className="tariffs-offer"><span className="tariffs-gift"><Gift size={25} aria-hidden="true" /></span><div><p>POUR VOTRE PREMIER ESSAI</p><strong>La première photo offerte.</strong><span>Après vérification de votre email.<br /> 1 génération + 1 correction, HD sans filigrane.</span></div></aside>
        </section>
        <section className="tariffs-packs" aria-label="Packs de crédits photo">
          {packs.map(pack => <article className={`tariffs-pack${pack.credits === 50 ? " tariffs-pack-featured" : ""}`} key={pack.credits}>
            <span className="tariffs-pack-label">{pack.label}</span>
            <h2>{pack.credits} <span>crédits photo</span></h2>
            <p className="tariffs-pack-description">{pack.description}</p>
            <div className="tariffs-amount">{pack.price}<span>€</span></div>
            <p className="tariffs-unit">{pack.unit} € par photo</p>
            <div className="tariffs-pack-line"><Check size={15} aria-hidden="true" /><span>1 photo HD = 1 crédit</span></div>
          </article>)}
        </section>
        <p className="tariffs-availability">À partir de 9,99 € · achat ponctuel · aucun abonnement.</p>
        <section className="tariffs-included" aria-labelledby="included-title"><h2 id="included-title">Dans chaque photo payante</h2><div><span><ImagePlus size={20} aria-hidden="true" /><strong>1 correction incluse</strong><small>Après la première génération</small></span><span><Download size={20} aria-hidden="true" /><strong>Téléchargement HD</strong><small>Votre version choisie</small></span><span><Clock3 size={20} aria-hidden="true" /><strong>7 jours pour ajuster</strong><small>Avec la correction restante</small></span><span><History size={20} aria-hidden="true" /><strong>Historique des versions</strong><small>Pour revoir les propositions</small></span></div></section>
        <section className="tariffs-timeline" aria-labelledby="timeline-title">
          <div className="tariffs-timeline-heading"><span className="public-eyebrow">LE CRÉDIT, SANS SURPRISE</span><h2 id="timeline-title">Ce qui se passe<br /><em>après le téléchargement.</em></h2><Link href="/demo/aide/#versions">Comprendre les 7 jours <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <ol>
            <li><span className="timeline-number">1</span><div><strong>Vous gardez votre photo</strong><p>Le premier téléchargement HD consomme un crédit. Un message confirme la date de fin de vos retouches.</p></div></li>
            <li><span className="timeline-number">2</span><div><strong>Vous avez 7 jours pour ajuster</strong><p>Utilisez la correction incluse si elle reste disponible. Toute correction supplémentaire coûte 1 crédit. Le délai ne redémarre pas à chaque téléchargement.</p></div></li>
            <li><span className="timeline-number">3</span><div><strong>Envie de reprendre plus tard ?</strong><p>Un crédit supplémentaire débloque une seule correction, utilisable pendant 7 jours. Les versions restent rattachées à votre photo.</p></div></li>
          </ol>
        </section>
        <section className="tariffs-video" aria-labelledby="video-price-title">
          <div className="tariffs-video-heading"><span className="public-eyebrow">VIDÉOS : UN SOLDE SÉPARÉ</span><h2 id="video-price-title">Vous achetez une durée,<br /><em>sans calcul compliqué.</em></h2><p>1 crédit vidéo représente 5 secondes en 720p. Vos crédits photo restent intacts.</p></div>
          <div className="tariffs-packs tariffs-three-packs">{videoPacks.map(pack => <article className={`tariffs-pack${pack.seconds === 20 ? " tariffs-pack-featured" : ""}`} key={pack.seconds}>
            <span className="tariffs-pack-label">{pack.label}</span><h2>{pack.seconds} <span>secondes</span></h2>
            <p className="tariffs-pack-description">{pack.credits} crédits vidéo · visite immobilière 720p.</p>
            <div className="tariffs-amount">{pack.price}<span>€</span></div><p className="tariffs-unit">{pack.unit} € les 5 secondes</p>
            <div className="tariffs-pack-line"><Clock3 size={15} aria-hidden="true" /><span>Durée utilisable pour votre montage</span></div>
          </article>)}</div>
          <p className="tariffs-availability">Les packs vidéo ouvriront après la validation finale du moteur de génération. Aucun paiement vidéo ne peut partir avant.</p>
        </section>
        <div className="tariffs-conditions"><p>Une première génération et une correction sont incluses par photo. Ensuite, chaque correction coûte 1 crédit photo. Les nouvelles créations sont limitées à 30 photos ou 10 vidéos depuis le dernier achat correspondant. Un ancien téléchargement ne remet pas les compteurs à zéro.</p><p>Les aperçus payants sont protégés par un filigrane ajouté hors génération. La photo offerte et les fichiers achetés se téléchargent sans filigrane. Les crédits photo et vidéo sont deux soldes distincts.</p></div>
        <section className="public-next"><div><span className="public-eyebrow">D’ABORD, FAITES-VOUS UNE IDÉE</span><h2>Découvrez le studio à votre rythme.</h2><p>Explorez les exemples et le parcours, sans achat.</p></div><Link className="button dark" href="/demo/#studio">Essayer la démonstration <ArrowRight size={17} aria-hidden="true" /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

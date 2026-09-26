import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Download, Gift, History, ImagePlus } from "lucide-react";
import { PublicFooter, PublicHeader } from "../aide/PublicChrome";
import "../studio.css";
import "../aide/public-pages.css";

export const metadata: Metadata = {
  title: "Tarifs photo · Studio Annonce",
  description: "Les tarifs prévus pour Studio Annonce : photo à l’unité ou packs de 5, 10 et 25 crédits. Un crédit au téléchargement HD, puis 7 jours pour ajuster.",
};

const packs = [
  { credits: 1, price: "1,90", unit: "1,90", label: "À l’unité", description: "Une pièce à mettre en valeur." },
  { credits: 5, price: "8,90", unit: "1,78", label: "Quelques pièces", description: "Les vues clés de votre annonce." },
  { credits: 10, price: "14,90", unit: "1,49", label: "Un logement", description: "Une sélection plus complète." },
  { credits: 25, price: "29,90", unit: "1,20", label: "Plusieurs logements", description: "Plus de photos à préparer." },
];

export default function PublicPricing() {
  return (
    <div className="studio-demo public-info tariffs-page">
      <PublicHeader current="tarifs" />
      <main className="public-main">
        <section className="tariffs-heading" aria-labelledby="tariffs-title">
          <div><span className="public-eyebrow">LES TARIFS PRÉVUS AU LANCEMENT</span><h1 id="tariffs-title">Une photo vous plaît&nbsp;?<br /><em>Gardez-la en HD.</em></h1><p>Un crédit est utilisé quand vous téléchargez votre photo.<br className="desktop-break" /> Choisissez ensuite l’unité ou le pack qui vous correspond.</p></div>
          <aside className="tariffs-offer"><span className="tariffs-gift"><Gift size={25} aria-hidden="true" /></span><div><p>POUR VOTRE PREMIER ESSAI</p><strong>La première photo offerte.</strong><span>Après vérification de votre email.<br /> Jusqu’à 10 essais, sans crédit consommé.</span></div></aside>
        </section>
        <section className="tariffs-packs" aria-label="Comparer les prix des photos et packs">
          {packs.map(pack => <article className={`tariffs-pack${pack.credits === 10 ? " tariffs-pack-featured" : ""}`} key={pack.credits}>
            <span className="tariffs-pack-label">{pack.label}</span>
            <h2>{pack.credits} <span>{pack.credits === 1 ? "photo" : "photos"}</span></h2>
            <p className="tariffs-pack-description">{pack.description}</p>
            <div className="tariffs-amount">{pack.price}<span>€</span></div>
            <p className="tariffs-unit">{pack.credits === 25 ? "≈ " : ""}{pack.unit} € / photo</p>
            <div className="tariffs-pack-line"><Check size={15} aria-hidden="true" /><span>{pack.credits} {pack.credits === 1 ? "crédit" : "crédits"} · téléchargement HD</span></div>
          </article>)}
        </section>
        <p className="tariffs-availability">Tarifs de présentation. Les achats ne sont pas encore ouverts.</p>
        <section className="tariffs-included" aria-labelledby="included-title"><h2 id="included-title">Dans chaque photo payante</h2><div><span><ImagePlus size={20} aria-hidden="true" /><strong>Jusqu’à 30 essais</strong><small>Pour chercher le bon résultat</small></span><span><Download size={20} aria-hidden="true" /><strong>Téléchargement HD</strong><small>Votre version choisie</small></span><span><Clock3 size={20} aria-hidden="true" /><strong>7 jours de retouches</strong><small>Après le premier téléchargement</small></span><span><History size={20} aria-hidden="true" /><strong>Historique des versions</strong><small>Pour revoir les propositions</small></span></div></section>
        <section className="tariffs-timeline" aria-labelledby="timeline-title">
          <div className="tariffs-timeline-heading"><span className="public-eyebrow">LE CRÉDIT, SANS SURPRISE</span><h2 id="timeline-title">Ce qui se passe<br /><em>après le téléchargement.</em></h2><Link href="/demo/aide/#versions">Comprendre les 7 jours <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <ol>
            <li><span className="timeline-number">1</span><div><strong>Vous gardez votre photo</strong><p>Le premier téléchargement HD consomme un crédit. Un message confirme la date de fin de vos retouches.</p></div></li>
            <li><span className="timeline-number">2</span><div><strong>Vous avez 7 jours pour ajuster</strong><p>Continuez sur la même photo avec ce crédit, dans la limite des essais restants. Le délai ne redémarre pas à chaque téléchargement.</p></div></li>
            <li><span className="timeline-number">3</span><div><strong>Envie de reprendre plus tard ?</strong><p>Après les 7 jours, de nouvelles retouches nécessiteront un nouveau crédit. Les versions restent rattachées à votre photo.</p></div></li>
          </ol>
        </section>
        <div className="tariffs-conditions"><p>La photo offerte comprend 10 essais. Les photos payantes en comprennent jusqu’à 30 chacune, avec une limite globale de 150 essais par jour et par compte.</p><p>Ces règles décrivent le service prévu. La génération, les achats et la sauvegarde en ligne restent à connecter et à vérifier avant le lancement.</p></div>
        <section className="public-next"><div><span className="public-eyebrow">D’ABORD, FAITES-VOUS UNE IDÉE</span><h2>Découvrez le studio à votre rythme.</h2><p>Explorez les exemples et le parcours, sans achat.</p></div><Link className="button dark" href="/demo/#studio">Essayer la démonstration <ArrowRight size={17} aria-hidden="true" /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

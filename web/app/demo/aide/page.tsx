import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Clock3, Download, Images, Plus } from "lucide-react";
import { PublicFooter, PublicHeader } from "./PublicChrome";
import "../studio.css";
import "./public-pages.css";

export const metadata: Metadata = {
  title: "Aide & questions fréquentes · Studio Annonce",
  description: "Comprendre les crédits photo, les versions et les 7 jours de retouches. Découvrir ce qui est disponible dans la démonstration Studio Annonce.",
};

const topics = [
  {
    id: "commencer",
    title: "Prendre ses marques",
    questions: [
      { question: "Par où commencer ?", answer: "Ouvrez le studio : vous arrivez dans votre liste de photos et vidéos. Ajoutez votre première photo, puis ouvrez-la pour accéder à son atelier. Chaque photo a son propre historique. Le salon d’exemple permet de découvrir le parcours et de comparer des versions déjà préparées." },
      { question: "Est-ce que la démo retouche mes photos ?", answer: "Pas encore. Vous pouvez explorer l’interface, importer un fichier pour en voir l’aperçu et consulter les exemples. La génération automatique n’est pas connectée : saisir une demande ne produit pas une nouvelle retouche de votre photo. Aucun crédit réel n’est consommé dans cette démonstration." },
      { question: "Quelles photos donneront une bonne base ?", answer: "Choisissez une photo nette, prise de jour, avec une vue assez large de la pièce. Gardez l’appareil droit et évitez les très grands angles qui déforment les murs. Formulez une demande précise : par exemple éclaircir le salon, enlever un objet ou essayer un autre mobilier. Vérifiez toujours le résultat avant de l’utiliser dans une annonce." },
    ],
  },
  {
    id: "credits",
    title: "Crédits & téléchargement",
    questions: [
      { question: "À quel moment un crédit est-il utilisé ?", answer: "La règle prévue est simple : un crédit est consommé au premier téléchargement en haute définition d’une photo payante. Consulter ses aperçus ou son historique ne consomme pas un nouveau crédit. Un message au centre de l’écran récapitule le téléchargement et la date jusqu’à laquelle les retouches sont incluses." },
      { question: "Comment fonctionne la première photo offerte ?", answer: "Au lancement, la première photo sera offerte après vérification de votre email, dans la limite d’une par compte. Elle comprendra jusqu’à 10 essais et son téléchargement HD ne consommera aucun crédit. Dans la démo, le parcours reste une simulation : aucune inscription ni offre réelle n’est activée." },
      { question: "Combien d’essais sont prévus ?", answer: "Jusqu’à 30 essais pour une photo payante, et 10 pour la première photo offerte. Une limite globale de 150 essais par jour et par compte est prévue. Télécharger à nouveau une photo ne remet pas son compteur à zéro. Une reprise confirmée avec un nouveau crédit ouvre une nouvelle période de 7 jours avec jusqu’à 30 essais." },
      { question: "Puis-je acheter un pack maintenant ?", answer: "Non, les achats sont désactivés. La page Tarifs présente les montants envisagés pour le lancement et reste consultable sans entrer dans le studio. Le solde et les achats d’un futur compte auront leur propre espace." },
    ],
  },
  {
    id: "versions",
    title: "Retouches & versions",
    questions: [
      { question: "Quand commencent les 7 jours ?", answer: "Au premier téléchargement HD de la photo. Vous pourrez encore l’ajuster pendant les 7 jours suivants avec le même crédit, dans la limite des essais disponibles. Télécharger à nouveau une version n’allongera pas ce délai. La date de fin est indiquée dans l’atelier." },
      { question: "Que se passe-t-il après les 7 jours ?", answer: "Les versions déjà obtenues restent consultables, et les fichiers HD déjà téléchargés peuvent être téléchargés à nouveau sans débit. Pour reprendre les retouches, vous confirmez l’utilisation d’un crédit : une nouvelle période de 7 jours commence. Dans la démo, ce parcours utilise uniquement des crédits fictifs ; le service commercial n’est pas encore ouvert." },
      { question: "Est-ce qu’une nouvelle version remplace les précédentes ?", answer: "Non. L’original et chaque proposition restent dans l’historique de la photo, y compris une version que vous n’avez pas retenue. Vous ouvrez une photo, puis choisissez la version à revoir. Les projets de la démo sont enregistrés localement et se retrouvent après rechargement. Gardez aussi vos originaux : effacer les données du navigateur efface cette sauvegarde. La sauvegarde en ligne et la synchronisation entre appareils restent à connecter." },
      { question: "Peut-on changer toute la décoration ?", answer: "C’est une des utilisations prévues : remplacer le mobilier, les luminaires, les textiles et les objets, tout en conservant la pièce. Les exemples présentent cette intention. Une image avec des éléments inventés doit être présentée comme un aménagement virtuel ; elle ne doit pas faire croire que le logement possède réellement ces équipements." },
    ],
  },
  {
    id: "video",
    title: "Vidéo & application mobile",
    questions: [
      { question: "Puis-je déjà créer une visite vidéo ?", answer: "La démo permet de découvrir un projet vidéo et son aperçu. La maquette de visite est un montage d’images fictives animées. La génération vidéo automatique n’est pas connectée, et nous ne promettons pas encore un trajet continu de caméra à travers les pièces. Cette capacité devra être testée sur un même logement avant d’être proposée." },
      { question: "L’application sera-t-elle sur iPhone et Android ?", answer: "Les deux plateformes font partie du projet. L’aperçu mobile conserve déjà vos projets localement pour les retrouver après rechargement. Le site web et l’aperçu mobile ont pour l’instant des espaces séparés, sans synchronisation entre eux. L’application n’est pas encore publiée sur les stores ; le compte partagé et le fonctionnement sur de vrais téléphones restent à valider avant sa sortie." },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="studio-demo public-info help-page">
      <PublicHeader current="aide" />
      <main className="public-main">
        <div className="help-heading">
          <span className="public-eyebrow">LE GUIDE DU STUDIO</span>
          <h1>Quelques réponses.<br /><em>Et c’est plus clair.</em></h1>
          <p>Les crédits, les versions, les 7 jours de retouches.<br className="desktop-break" /> L’essentiel pour savoir où vous allez.</p>
        </div>
        <section className="help-essentials" aria-label="Les trois repères à retenir">
          <article><Download size={22} aria-hidden="true" /><strong>1 photo HD = 1 crédit</strong><p>Utilisé au premier téléchargement. La première photo sera offerte.</p></article>
          <article><Clock3 size={22} aria-hidden="true" /><strong>7 jours pour ajuster</strong><p>Après ce téléchargement, dans la limite des essais disponibles.</p></article>
          <article><Images size={22} aria-hidden="true" /><strong>Vos versions, ensemble</strong><p>L’original et les propositions se consultent dans l’historique de la photo.</p></article>
        </section>
        <div className="help-layout">
          <aside className="help-index" aria-label="Sommaire des questions">
            <p>VOTRE QUESTION CONCERNE…</p>
            <nav>{topics.map((topic, index) => <a key={topic.id} href={`#${topic.id}`}><span>0{index + 1}</span>{topic.title}<ArrowDown size={14} aria-hidden="true" /></a>)}</nav>
            <div className="help-demo-card"><strong>Vous explorez une démo.</strong><p>Les prix et les règles décrivent le service prévu. Aucun achat ni génération automatique n’est actif ici.</p><Link href="/demo/#studio">Découvrir le parcours <ArrowRight size={15} aria-hidden="true" /></Link></div>
          </aside>
          <div className="help-questions">
            {topics.map((topic, index) => (
              <section className="help-topic" id={topic.id} key={topic.id} aria-labelledby={`${topic.id}-title`}>
                <div className="help-topic-title"><span>0{index + 1}</span><h2 id={`${topic.id}-title`}>{topic.title}</h2></div>
                {topic.questions.map((item, questionIndex) => (
                  <details className="help-question" key={item.question} open={index === 0 && questionIndex === 0}>
                    <summary>{item.question}<Plus size={19} aria-hidden="true" /></summary>
                    <div><p>{item.answer}</p>{topic.id === "credits" && questionIndex === 3 && <Link href="/demo/tarifs/">Découvrir les tarifs <ArrowRight size={15} aria-hidden="true" /></Link>}</div>
                  </details>
                ))}
              </section>
            ))}
          </div>
        </div>
        <section className="public-next"><div><span className="public-eyebrow">LE PLUS SIMPLE, C’EST DE VOIR</span><h2>Faites un tour dans le studio.</h2><p>Une bibliothèque pour vos projets, un atelier pour chaque photo.</p></div><Link className="button dark" href="/demo/#studio">Ouvrir la démonstration <ArrowRight size={17} aria-hidden="true" /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

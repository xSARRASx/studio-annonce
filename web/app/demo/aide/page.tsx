import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Clock3, Download, Images, Plus } from "lucide-react";
import { PublicFooter, PublicHeader } from "./PublicChrome";
import "../studio.css";
import "./public-pages.css";

export const metadata: Metadata = {
  title: "Aide : retouche photo, crédits et versions | Studio Annonce",
  description: "Questions sur les photos immobilières, les demandes de retouche, les crédits, les versions et les 7 jours d’ajustement sur Studio Annonce.",
  alternates: { canonical: "/aide/" },
  openGraph: { title: "Aide et questions fréquentes | Studio Annonce", description: "Retouche photo, crédits, versions et disponibilité des outils, expliqués simplement.", url: "/aide/", locale: "fr_FR", type: "website" },
};

const topics = [
  {
    id: "commencer",
    title: "Prendre ses marques",
    questions: [
      { question: "Par où commencer ?", answer: "Ouvrez le studio : Mes créations rassemble vos photos et vidéos par logement. Le bouton Créer présente quatre possibilités : Retoucher une photo, Créer une image à partir d’une idée, Photos → vidéo et Vidéo → photos. Choisissez un outil, décrivez votre demande, puis utilisez l’assistant si vous voulez de l’aide. Chaque question accepte plusieurs choix et vos propres précisions." },
      { question: "Puis-je retoucher ma photo maintenant ?", answer: "Oui. Ajoutez votre photo, décrivez ce que vous voulez changer, relisez le coût annoncé puis confirmez la retouche dans l’atelier. Si le service est momentanément indisponible, votre demande reste enregistrée et aucun crédit n’est utilisé." },
      { question: "Quelles photos donneront une bonne base ?", answer: "Choisissez une photo nette, prise de jour, avec une vue assez large de la pièce. Gardez l’appareil droit et évitez les très grands angles qui déforment les murs. Formulez une demande précise : par exemple éclaircir le salon, enlever un objet ou essayer un autre mobilier. Vérifiez toujours le résultat avant de l’utiliser dans une annonce." },
    ],
  },
  {
    id: "credits",
    title: "Crédits & téléchargement",
    questions: [
      { question: "À quel moment un crédit est-il utilisé ?", answer: "Un crédit est consommé au premier téléchargement HD d’une photo payante, ou lorsque vous confirmez une correction supplémentaire. La première génération et une correction sont incluses par photo. Consulter un aperçu ou un fichier HD déjà acquis ne consomme pas un nouveau crédit. Le coût est présenté avant la confirmation." },
      { question: "Le filigrane restera-t-il sur ma photo ?", answer: "Non. Il sert uniquement à protéger l’aperçu d’une retouche payante que vous n’avez pas encore gardée. Lorsque vous choisissez de garder cette version, le fichier téléchargé en HD est net et sans filigrane. La première photo offerte et les versions déjà acquises se téléchargent aussi sans filigrane." },
      { question: "Comment fonctionne la première photo offerte ?", answer: "Après vérification de votre email, une première photo est réservée à chaque compte. Elle comprend une première génération et une correction incluse. Son téléchargement HD sera sans filigrane et ne consommera aucun crédit." },
      { question: "Combien d’essais sont prévus ?", answer: "Une première génération et une correction sont incluses par photo, offerte ou payante. Chaque correction supplémentaire coûte 1 crédit et donne droit à une seule génération, utilisable pendant 7 jours. Une génération qui échoue ne consomme pas ce droit. Les nouvelles créations sont bloquées après 30 créations photo ou 10 créations vidéo depuis le dernier achat ; le support peut débloquer le compte. Chaque génération ou correction réussie compte ; un import ou une génération échouée ne compte pas. Un achat photo remet le compteur photo à zéro, sans modifier le compteur vidéo. Un téléchargement gratuit ou répété ne remet aucun compteur à zéro. Ces compteurs sont communs au site et au mobile. Les fichiers déjà achetés restent accessibles." },
      { question: "Puis-je acheter un pack maintenant ?", answer: "Consultez les tarifs sans vous connecter, puis choisissez vos packs dans Crédits. Le prix total et l’état du paiement sont affichés avant toute commande. Si le paiement est momentanément indisponible, aucun débit ne part et votre panier reste modifiable." },
    ],
  },
  {
    id: "versions",
    title: "Retouches & versions",
    questions: [
      { question: "Quand commencent les 7 jours ?", answer: "Au premier téléchargement HD de la photo. La correction incluse, si vous ne l’avez pas encore utilisée, reste disponible pendant les 7 jours suivants. Chaque correction supplémentaire coûte 1 crédit pour une seule génération. Télécharger à nouveau une version n’allongera pas ce délai. La date de fin est indiquée sur la page de la photo." },
      { question: "Que se passe-t-il après les 7 jours ?", answer: "Les versions déjà obtenues restent consultables, et les fichiers HD déjà achetés peuvent être téléchargés à nouveau sans débit. Pour reprendre les retouches, vous confirmez l’utilisation d’un crédit : une seule correction supplémentaire devient disponible pendant 7 jours." },
      { question: "Est-ce qu’une nouvelle version remplace les précédentes ?", answer: "Non. L’original et chaque proposition restent dans l’historique de la photo, y compris une version que vous n’avez pas retenue. Vous ouvrez une photo, puis choisissez la version à revoir. Les photos et demandes de votre compte connecté sont enregistrées en ligne." },
      { question: "Peut-on changer toute la décoration ?", answer: "C’est une des utilisations prévues : remplacer le mobilier, les luminaires, les textiles et les objets, tout en conservant la pièce. Les exemples présentent cette intention. Une image avec des éléments inventés doit être présentée comme un aménagement virtuel ; elle ne doit pas faire croire que le logement possède réellement ces équipements." },
    ],
  },
  {
    id: "video",
    title: "Vidéo & application mobile",
    questions: [
      { question: "Puis-je déjà créer une visite vidéo ?", answer: "Dans Photos → vidéo, choisissez vos photos dans l’ordre, la durée, la qualité et le mouvement voulu. Le coût en crédits est affiché avant confirmation. Pour une visite continue, indiquez les vrais passages entre les pièces ; à défaut, choisissez des plans avec raccords. Une continuité parfaite ne peut pas être garantie à partir de photos seules." },
      { question: "Comment passer de photos à une vidéo, ou l’inverse ?", answer: "Dans Créer, Photos → vidéo permet de choisir ou d’ajouter des photos, puis de préparer la demande avec l’assistant. La création démarre après votre confirmation si le service et votre solde le permettent. Vidéo → photos extrait réellement des images de votre vidéo sur cet appareil : choisissez les instants à garder et enregistrez-les dans Mes créations. Vous pouvez ensuite reprendre chaque photo dans votre espace." },
      { question: "L’application sera-t-elle sur iPhone et Android ?", answer: "Ouvrez l’application mobile dans le navigateur d’un iPhone ou d’un téléphone Android, à l’adresse studioannonce.fr/mobile/. Le parcours connecté utilise le même compte, les mêmes demandes et les mêmes compteurs que le site. Les liens App Store et Google Play ne sont pas proposés tant qu’aucune publication native n’est vérifiée." },
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
          <h1>La retouche photo.<br /><em>En clair.</em></h1>
          <p>Photos immobilières, demandes de retouche, crédits et versions : les réponses pour préparer votre projet et savoir quels outils sont disponibles.</p>
        </div>
        <section className="help-essentials" aria-label="Les trois repères à retenir">
          <article><Download size={22} aria-hidden="true" /><strong>1 photo HD = 1 crédit</strong><p>Le filigrane n’apparaît que sur l’aperçu : la photo téléchargée est nette et sans filigrane. La première est offerte. <Link href="/inscription/?suite=photo">Préparer ma photo offerte <ArrowRight size={14} aria-hidden="true" /></Link></p></article>
          <article><Clock3 size={22} aria-hidden="true" /><strong>7 jours pour ajuster</strong><p>Pour utiliser la correction restante après le téléchargement.</p></article>
          <article><Images size={22} aria-hidden="true" /><strong>Vos versions, ensemble</strong><p>L’original et les propositions se consultent dans l’historique de la photo.</p></article>
        </section>
        <div className="help-layout">
          <aside className="help-index" aria-label="Sommaire des questions">
            <p>VOTRE QUESTION CONCERNE…</p>
            <nav>{topics.map((topic, index) => <a key={topic.id} href={`#${topic.id}`}><span>0{index + 1}</span>{topic.title}<ArrowDown size={14} aria-hidden="true" /></a>)}</nav>
            <div className="help-demo-card"><strong>Votre espace est ouvert.</strong><p>Ajoutez une photo et préparez votre demande. L’atelier vous indique si la retouche est disponible.</p><Link href="/connexion/">Ouvrir mon compte <ArrowRight size={15} aria-hidden="true" /></Link></div>
          </aside>
          <div className="help-questions">
            {topics.map((topic, index) => (
              <section className="help-topic" id={topic.id} key={topic.id} aria-labelledby={`${topic.id}-title`}>
                <div className="help-topic-title"><span>0{index + 1}</span><h2 id={`${topic.id}-title`}>{topic.title}</h2></div>
                {topic.questions.map((item, questionIndex) => (
                  <details className="help-question" key={item.question} open={index === 0 && questionIndex === 0}>
                    <summary>{item.question}<Plus size={19} aria-hidden="true" /></summary>
                    <div><p>{item.answer}</p>{topic.id === "commencer" && questionIndex === 2 && <Link href="/blog/photos-immobilieres-smartphone/">Lire le guide photo au smartphone <ArrowRight size={15} aria-hidden="true" /></Link>}{topic.id === "credits" && questionIndex === 2 && <Link href="/inscription/?suite=photo">Préparer ma photo offerte <ArrowRight size={15} aria-hidden="true" /></Link>}{topic.id === "credits" && questionIndex === 4 && <Link href="/tarifs/">Découvrir les tarifs <ArrowRight size={15} aria-hidden="true" /></Link>}{topic.id === "versions" && questionIndex === 3 && <Link href="/exemples/">Comparer les aménagements virtuels <ArrowRight size={15} aria-hidden="true" /></Link>}</div>
                  </details>
                ))}
              </section>
            ))}
          </div>
        </div>
        <section className="public-next"><div><span className="public-eyebrow">À VOUS DE JOUER</span><h2>Préparez votre première photo.</h2><p>Votre logement, vos photos et vos demandes réunis dans votre compte.</p></div><Link className="button dark" href="/inscription/?suite=photo">Préparer ma photo offerte <ArrowRight size={17} aria-hidden="true" /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

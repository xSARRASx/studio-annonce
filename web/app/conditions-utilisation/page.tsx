import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Conditions d’utilisation · Studio Annonce",
  description: "Les règles d’utilisation du site Studio Annonce, de la démonstration et du compte connecté, avec les fonctions actuellement disponibles.",
  alternates: { canonical: "/conditions-utilisation/" },
};

export default function ConditionsUtilisationPage() {
  return <main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><FileText size={15}/> LE SERVICE</p>
      <h1>Conditions d’utilisation.</h1>
      <p className="privacy-lead">Studio Annonce permet de préparer des photos de logement et des demandes de retouche. Cette page décrit ce que vous pouvez faire avec le site aujourd’hui.</p>

      <section><h2>Site public et démonstration</h2><p>Les exemples et le parcours guidé montrent des images déjà préparées. La démonstration conserve vos essais sur votre appareil ; elle ne crée pas un compte en ligne et ne lance pas de génération d’image. Les résultats présentés dans les exemples ne garantissent pas qu’une autre photo donnera le même rendu.</p></section>
      <section><h2>Compte connecté</h2><p>Un code envoyé à votre adresse email permet d’accéder à votre compte. Gardez l’accès à cette adresse et à votre appareil sous votre contrôle. Les logements, les photos et les demandes enregistrés dans le compte sont distincts des projets locaux de la démonstration.</p></section>
      <section><h2>Photos que vous fournissez</h2><p>Ajoutez uniquement des images que vous avez le droit d’utiliser et de faire traiter. Évitez de transmettre des documents, visages ou informations personnelles sans nécessité ou autorisation. Un lien Airbnb ou Booking saisi dans le compte sert de référence à votre logement : le service ne copie pas automatiquement les photos de l’annonce.</p></section>
      <section><h2>Retouches et aménagements virtuels</h2><p>Une proposition de retouche est un visuel à examiner avant diffusion. Si elle montre du mobilier, des équipements ou des travaux inexistants, présentez-la comme une projection virtuelle et vérifiez qu’elle ne trompe pas le lecteur de votre annonce. Studio Annonce ne publie pas votre annonce à votre place.</p></section>
      <section><h2>Fonctions et achats</h2><p>Le compte permet de préparer une demande et d’ajouter vos photos. La retouche et la vidéo automatiques restent en phase pilote et ne sont pas ouvertes au public. Les packs affichés sur la page Tarifs ne sont pas achetables aujourd’hui. Des conditions de vente distinctes devront être présentées avant l’ouverture d’un paiement.</p></section>
      <section><h2>Données et assistance</h2><p>La <Link href="/confidentialite/">politique de confidentialité</Link> explique le traitement des données du compte ; la <Link href="/cookies/">page Cookies et stockage local</Link> décrit les données gardées dans le navigateur. Pour une question sur le service ou votre compte, écrivez à <a href="mailto:contact@studioannonce.fr">contact@studioannonce.fr</a>.</p></section>
      <p className="privacy-note">Dernière mise à jour : 3 octobre 2026.</p>
    </article>
  </main>;
}

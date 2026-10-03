import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Mentions légales · Studio Annonce",
  description: "Identité de l’éditeur, contact et hébergement du site Studio Annonce.",
  alternates: { canonical: "/mentions-legales/" },
};

export default function MentionsLegalesPage() {
  return <main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><FileText size={15}/> INFORMATIONS SUR LE SITE</p>
      <h1>Mentions légales.</h1>
      <p className="privacy-lead">Les informations sur l’entreprise qui édite Studio Annonce et sur l’hébergement du site.</p>

      <section><h2>Éditeur</h2><p>Studio Annonce est édité par MA INDUSTRY COMPANY LIMITED, société à responsabilité limitée de droit hongkongais (private company limited by shares), dont le siège social est situé Flat/Room 1405B, 14/F, The Belgian Bank Building, 721-725 Nathan Road, Mongkok, Kowloon, Hong Kong.</p><p>Contact pour Studio Annonce : <a href="mailto:contact@studioannonce.fr">contact@studioannonce.fr</a> · <a href="tel:+33634972693">06 34 97 26 93</a>.</p></section>
      <section><h2>Directeur de la publication</h2><p>Sébastien Moré.</p></section>
      <section><h2>Hébergement</h2><p>Le site et son espace N0C sont hébergés par PlanetHoster, 4416 Louis B. Mayer, Laval, Québec, H7P 0G1, Canada.</p></section>
      <section><h2>Contenu du service</h2><p>Studio Annonce présente des outils de préparation et de retouche de photos immobilières. Les exemples montrent des réalisations préparées ; ils ne garantissent pas un résultat identique pour chaque photo. La <Link href="/conditions-utilisation/">page Conditions d’utilisation</Link> décrit les fonctions actuellement disponibles et les limites du pilote.</p></section>
      <section><h2>Données personnelles</h2><p>La <Link href="/confidentialite/">politique de confidentialité</Link> décrit les données du compte et des créations. La <Link href="/cookies/">page Cookies et stockage local</Link> explique ce qui reste dans le navigateur.</p></section>
      <p className="privacy-note">Dernière mise à jour : 3 octobre 2026.</p>
    </article>
  </main>;
}

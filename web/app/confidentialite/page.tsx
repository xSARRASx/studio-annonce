import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  alternates: { canonical: "/confidentialite/" },
  title: "Confidentialité et cookies · Studio Annonce",
  description: "Comment Studio Annonce utilise vos données, vos photos et vos choix de cookies.",
};

export default function Confidentialite() {
  return <main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><ShieldCheck size={15}/> VIE PRIVÉE</p>
      <h1>Vos données et vos choix.</h1>
      <p className="privacy-lead">Studio Annonce utilise uniquement les informations nécessaires pour fournir votre compte, vos créations et le service que vous demandez.</p>

      <section><h2>Cookies indispensables</h2><p>Ils permettent de conserver vos choix, votre session et les éléments techniques indispensables au fonctionnement du site. Ils ne servent pas à vous envoyer de publicité et ne peuvent pas être désactivés depuis le bandeau.</p></section>
      <section><h2>Cookies optionnels</h2><p>Ils peuvent servir à comprendre de façon globale l’utilisation du site et à améliorer le parcours. Ils ne sont activés qu’après votre accord. Refuser est aussi simple qu’accepter et ne bloque aucune fonction du site.</p></section>
      <section><h2>Durée du choix</h2><p>Votre acceptation ou votre refus est conservé pendant six mois. Le bouton « Cookies » présent en bas de chaque page permet de modifier ce choix à tout moment.</p></section>
      <section><h2>Compte, photos et créations</h2><p>Votre prénom, votre nom et votre adresse email servent à gérer votre compte. Vos photos sont utilisées pour réaliser les modifications que vous demandez et retrouver vos versions. L’inscription ne vous abonne pas à des messages publicitaires.</p></section>
      <section><h2>Nous contacter</h2><p><Mail size={16}/> Pour une question ou une demande concernant vos données : <a href="mailto:contact@studioannonce.fr">contact@studioannonce.fr</a>.</p></section>
      <p className="privacy-note"><Cookie size={16}/> Dernière mise à jour : 30 septembre 2026.</p>
    </article>
  </main>;
}

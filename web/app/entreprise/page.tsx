import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "L’entreprise derrière Studio Annonce | Studio Annonce",
  description: "Qui édite Studio Annonce, comment le service aide à préparer des photos immobilières et comment nous contacter.",
  alternates: { canonical: "/entreprise/" },
  openGraph: {
    title: "L’entreprise derrière Studio Annonce",
    description: "Une présentation du service, de son éditeur et de ses engagements sur les images immobilières.",
    url: "/entreprise/", locale: "fr_FR", type: "website",
  },
};

export default function EntreprisePage() {
  return <><main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><Building2 size={15}/> À PROPOS</p>
      <h1>L’entreprise derrière Studio Annonce.</h1>
      <p className="privacy-lead">Studio Annonce aide à préparer et comparer des photos de logement avant leur utilisation dans une annonce. Le site présente des exemples, des guides pratiques et un espace de préparation des créations.</p>

      <section><h2>Ce que fait le service</h2><p>Vous pouvez organiser vos photos par logement, décrire une retouche et retrouver l’original à côté des versions produites. Le parcours est présenté sur la <Link href="/application/">page de l’application</Link> et illustré par nos <Link href="/exemples/">avant/après</Link>. Les guides du <Link href="/blog/">blog</Link> expliquent la prise de vue, la lumière, le cadrage et la décoration virtuelle.</p></section>
      <section><h2>Une image à vérifier avant de publier</h2><p>Une retouche peut modifier la perception d’une pièce. Nous invitons à comparer chaque proposition à l’original et à signaler clairement dans l’annonce un mobilier ou un aménagement qui n’existe pas. Studio Annonce ne publie pas les annonces à votre place et ne garantit pas le même résultat pour toutes les photos.</p></section>
      <section><h2>Utiliser Studio Annonce</h2><p>Le site public, le studio connecté et l’application mobile dans le navigateur sont accessibles. Dans votre compte, organisez vos photos, préparez une retouche ou une visite vidéo et vérifiez le coût en crédits avant de lancer une création. L’espace Facturation affiche les packs et l’état du paiement. Les <Link href="/conditions-utilisation/">conditions d’utilisation</Link> décrivent le service.</p></section>
      <section><h2>Qui édite le site ?</h2><p>Studio Annonce est édité par MA INDUSTRY COMPANY LIMITED, établie à Hong Kong, sous la direction de publication de Sébastien Moré. L’adresse complète et l’hébergeur figurent dans les <Link href="/mentions-legales/">mentions légales</Link>.</p></section>
      <section><h2>Nous contacter</h2><p>Pour une question sur le service, une photo ou votre compte, écrivez à <a href="mailto:contact@studioannonce.fr">contact@studioannonce.fr</a>. Pour vos données personnelles, consultez aussi la <Link href="/confidentialite/">politique de confidentialité</Link>.</p></section>
      <p className="privacy-note">Dernière mise à jour : 3 octobre 2026.</p>
    </article>
  </main><SiteFooter /></>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Cookies et stockage local · Studio Annonce",
  description: "Ce que Studio Annonce conserve dans votre navigateur pour le compte et les brouillons, sans traceur publicitaire ni mesure d’audience activée.",
  alternates: { canonical: "/cookies/" },
};

export default function CookiesPage() {
  return <><main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><Cookie size={15}/> NAVIGATEUR</p>
      <h1>Cookies et stockage local.</h1>
      <p className="privacy-lead">Le site web utilise le stockage du navigateur pour la connexion et les projets que vous choisissez de préparer. La version actuelle n’active aucun outil de publicité ciblée ni de mesure d’audience.</p>

      <section><h2>Ce qui est enregistré</h2><p>Si vous vous connectez, un jeton d’accès est gardé dans le stockage local du navigateur pour retrouver votre compte. Il est retiré de ce navigateur à la déconnexion. Les demandes en cours peuvent rester dans le stockage de l’onglet ou dans votre compte, selon l’écran utilisé.</p></section>
      <section><h2>La démonstration et les brouillons</h2><p>La démonstration garde ses projets, leurs photos importées et son historique dans la base locale du navigateur (IndexedDB). Les assistants de création peuvent y conserver des idées et des brouillons. Ces éléments restent sur cet appareil et ne sont pas synchronisés avec le compte en ligne. Les photos ajoutées dans le compte connecté sont, elles, transmises au service pour réaliser la demande.</p></section>
      <section><h2>Votre ancien choix de cookies</h2><p>Une version précédente enregistrait un choix « accepter » ou « refuser » pendant six mois. Aucun outil optionnel ne lisait ce choix. Le site ne l’utilise plus ; l’ancienne valeur peut rester sur les appareils déjà utilisés jusqu’à l’effacement des données du site dans le navigateur.</p></section>
      <section><h2>Garder la main</h2><p>Vous pouvez effacer les données de studioannonce.fr dans les réglages de votre navigateur. Cela supprimera aussi la connexion locale, les brouillons et les projets de démonstration enregistrés sur cet appareil. Cela ne supprime pas les données de votre compte en ligne : pour exercer vos droits sur ces données, consultez la <Link href="/confidentialite/">politique de confidentialité</Link>.</p></section>
      <section><h2>Si les outils changent</h2><p>Un outil de mesure ou de publicité nécessitant votre accord ne sera pas activé sans une information adaptée et, lorsque la loi l’exige, votre consentement préalable.</p></section>
      <p className="privacy-note"><ShieldCheck size={16}/> Dernière mise à jour : 3 octobre 2026.</p>
    </article>
  </main><SiteFooter /></>;
}

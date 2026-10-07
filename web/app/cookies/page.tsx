import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Cookies et stockage local · Studio Annonce",
  description: "Vos choix concernant les cookies de mesure d’audience et de publicité, la connexion et les brouillons de Studio Annonce.",
  alternates: { canonical: "/cookies/" },
};

export default function CookiesPage() {
  return <><main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><Cookie size={15}/> NAVIGATEUR</p>
      <h1>Cookies et stockage local.</h1>
      <p className="privacy-lead">La connexion et les brouillons utilisent le stockage nécessaire au studio. Google Analytics et Google Ads sont chargés uniquement si vous acceptez les cookies optionnels. Refuser n’empêche ni de créer un compte, ni d’utiliser le studio, ni de payer.</p>

      <section><h2>Ce qui est enregistré</h2><p>Si vous vous connectez, un jeton d’accès est gardé dans le stockage local du navigateur pour retrouver votre compte. Il est retiré de ce navigateur à la déconnexion. Les demandes en cours peuvent rester dans le stockage de l’onglet ou dans votre compte, selon l’écran utilisé.</p></section>
      <section><h2>La démonstration et les brouillons</h2><p>La démonstration garde ses projets, leurs photos importées et son historique dans la base locale du navigateur (IndexedDB). Les assistants de création peuvent y conserver des idées et des brouillons. Ces éléments restent sur cet appareil et ne sont pas synchronisés avec le compte en ligne. Les photos ajoutées dans le compte connecté sont, elles, transmises au service pour réaliser la demande.</p></section>
      <section><h2>Mesure des visites et des publicités</h2><p>Après votre accord, le conteneur Google Tag Manager de l’agence Klay peut charger Google Analytics pour mesurer les pages et les actions, et Google Ads pour rattacher les inscriptions et achats aux publicités. Les événements ne contiennent pas vos photos, vos instructions de retouche, votre mot de passe ni vos codes email. Pour les conversions améliorées Google Ads, votre email peut être normalisé et haché par la balise Google avant sa transmission ; cette donnée ne doit pas être transmise à Google Analytics.</p></section>
      <section><h2>Choix et durées</h2><p>Votre choix est enregistré sous « sa_consentement » pendant six mois. Un ancien choix ne vaut pas accord pour ces nouveaux outils. Si vous avez accepté, « sa_gclid » conserve l’identifiant du clic publicitaire jusqu’à 90 jours ; il peut aussi être associé à votre compte et à une commande afin de mesurer un achat ultérieur. Les cookies des balises Google servent à la mesure selon les réglages du conteneur de l’agence ; leur documentation est disponible dans les <a href="https://policies.google.com/technologies/cookies?hl=fr" target="_blank" rel="noopener noreferrer">informations Google sur les cookies</a>.</p></section>
      <section><h2>Garder la main</h2><p>Vous pouvez effacer les données de studioannonce.fr dans les réglages de votre navigateur. Cela supprimera aussi la connexion locale, les brouillons et les projets de démonstration enregistrés sur cet appareil. Cela ne supprime pas les données de votre compte en ligne : pour exercer vos droits sur ces données, consultez la <Link href="/confidentialite/">politique de confidentialité</Link>.</p></section>
      <section><h2>Changer votre choix</h2><p>Le bouton « Gérer mes cookies », présent sur le site et dans l’application ouverte sur Internet, permet d’accepter ou de refuser à nouveau. Le retrait arrête le chargement optionnel, retire les cookies Google accessibles au site et révoque l’identifiant publicitaire associé à votre compte. Les données déjà reçues par un prestataire ne sont pas automatiquement effacées : contactez-nous pour exercer vos droits.</p></section>
      <p className="privacy-note"><ShieldCheck size={16}/> Dernière mise à jour : 7 octobre 2026.</p>
    </article>
  </main><SiteFooter /></>;
}

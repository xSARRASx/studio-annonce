import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Conditions de vente · Studio Annonce",
  description: "Informations sur les packs de crédits photo et vidéo, leur utilisation et les conditions applicables aux achats.",
  alternates: { canonical: "/conditions-vente/" },
};

export default function ConditionsVentePage() {
  return <><main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><FileText size={15}/> ACHATS ET CRÉDITS</p>
      <h1>Conditions de vente.</h1>
      <p className="privacy-lead">Les crédits photo et vidéo s’achètent séparément dans l’espace Facturation lorsque le paiement y est disponible. Le prix et le contenu du panier sont présentés avant toute confirmation.</p>

      <section><h2>Vendeur et prix</h2><p>Studio Annonce est édité par MA INDUSTRY COMPANY LIMITED. Ses coordonnées figurent dans les <Link href="/mentions-legales/">mentions légales</Link>. Les prix des packs photo et vidéo, en euros, sont indiqués sur la <Link href="/tarifs/">page Tarifs</Link> et récapitulés dans l’espace Facturation avant le paiement.</p></section>
      <section><h2>Utilisation des crédits</h2><p>Les crédits photo et vidéo sont deux soldes distincts. La durée et le nombre de crédits vidéo nécessaires sont indiqués avant la confirmation d’une création. Un pack vidéo peut être utilisé en plusieurs vidéos, dans la limite du solde disponible. La première photo offerte après vérification de l’email ne demande pas d’achat.</p></section>
      <section><h2>Remboursement des packs</h2><p>Aucun remboursement commercial volontaire d’un pack n’est accordé pour un simple changement d’avis lorsque le droit légal de rétractation est éteint ou inapplicable. Cette règle ne supprime aucun droit légal du client, notamment le droit de rétractation lorsqu’il s’applique et les recours prévus en cas de non-conformité du service.</p></section>
      <section><h2>Création qui échoue</h2><p>Si une génération vidéo échoue sans fournir le résultat attendu, les crédits vidéo réservés pour cet essai sont restitués sur le compte. Cette restitution de crédits est distincte d’un remboursement en argent d’un pack.</p></section>
      <section><h2>Questions</h2><p>Pour une question sur un achat ou l’utilisation des crédits, écrivez à <a href="mailto:contact@studioannonce.fr">contact@studioannonce.fr</a>. Les <Link href="/conditions-utilisation/">conditions d’utilisation</Link> décrivent le fonctionnement général du service.</p></section>
      <p className="privacy-note">Dernière mise à jour : 6 octobre 2026.</p>
    </article>
  </main><SiteFooter/></>;
}

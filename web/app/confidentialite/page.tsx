import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  alternates: { canonical: "/confidentialite/" },
  title: "Confidentialité des données · Studio Annonce",
  description: "Compte, photos et créations : les données utilisées par Studio Annonce, leur traitement et la manière d’exercer vos droits.",
};

export default function Confidentialite() {
  return <main className="privacy-page">
    <header><Logo taille="size-10"/><Link href="/"><ArrowLeft size={16}/> Retour au site</Link></header>
    <article>
      <p className="privacy-eyebrow"><ShieldCheck size={15}/> VIE PRIVÉE</p>
      <h1>Vos données, en clair.</h1>
      <p className="privacy-lead">Studio Annonce traite les informations nécessaires au compte et aux créations demandées. La démonstration, elle, reste enregistrée sur votre navigateur.</p>

      <section><h2>Compte et projets</h2><p>L’adresse email sert à envoyer le code de connexion et à rattacher les créations au bon compte. Le prénom et le nom complètent le profil. Pour chaque logement, le service peut enregistrer son nom, sa ville, son type d’annonce et le lien Airbnb ou Booking que vous fournissez. Ces traitements permettent de vous donner accès au service demandé.</p></section>
      <section><h2>Photos, demandes et versions</h2><p>Les photos ajoutées dans le compte, vos instructions et les versions produites sont conservées pour préparer vos créations et retrouver l’historique de chaque photo. Lorsque la retouche est disponible pour un compte autorisé, les images et les instructions nécessaires sont transmises au prestataire d’IA utilisé pour réaliser la demande. La génération vidéo reste réservée au pilote. Ces fonctions ne sont pas ouvertes au public aujourd’hui.</p></section>
      <section><h2>Hébergement et autres prestataires</h2><p>Le site, la base du compte et les photos sont hébergés sur l’espace N0C de PlanetHoster. Son service de messagerie expédie les codes de connexion. La retouche pilote utilise OpenAI ; le pilote vidéo peut utiliser Higgsfield. Les achats en ligne sont actuellement désactivés : aucune commande Stripe ne peut être lancée depuis le site public.</p></section>
      <section><h2>Démonstration et navigateur</h2><p>Les photos et projets que vous ajoutez à la démonstration restent dans la base locale de votre navigateur et ne sont pas synchronisés avec le compte. Le navigateur garde aussi le jeton de connexion et certains brouillons. Aucun outil publicitaire ou de mesure d’audience n’est activé dans la version actuelle. La <Link href="/cookies/">page Cookies et stockage local</Link> explique ces éléments et leur effacement.</p></section>
      <section><h2>Conservation et demandes</h2><p>Les projets du compte et leurs versions restent associés au compte pour que vous puissiez les retrouver. La version actuelle n’applique pas de purge automatique après une période fixe. Vous pouvez demander l’accès, la rectification ou l’effacement de vos données ; chaque demande doit être examinée avec les obligations légales applicables. L’effacement des données locales de la démonstration s’effectue dans votre navigateur.</p></section>
      <section><h2>Vos droits</h2><p><Mail size={16}/> Pour exercer vos droits ou poser une question, écrivez à <a href="mailto:contact@studioannonce.fr">contact@studioannonce.fr</a>. Vous pouvez aussi saisir la <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">CNIL</a> si vous estimez que vos droits ne sont pas respectés.</p></section>
      <p className="privacy-note"><Cookie size={16}/> Dernière mise à jour : 3 octobre 2026.</p>
    </article>
  </main>;
}

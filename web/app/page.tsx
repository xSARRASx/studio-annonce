import Landing from "./demo/landing";
import type { Metadata } from "next";
import "./demo/studio.css";
import "./public-contrast.css";

export const metadata: Metadata = {
  title: "Studio Annonce — retouche photo immobilière et décoration virtuelle",
  description: "Mettez vos photos de logement en valeur : lumière, rangement et décoration virtuelle. Explorez huit exemples avant/après et le parcours Studio Annonce.",
  alternates: { canonical: "/" },
  openGraph: { title: "Studio Annonce — de belles photos pour votre annonce", description: "Des exemples concrets, de la lumière à la décoration complète.", url: "/", locale: "fr_FR", type: "website", images: ["/demo/exemples/salon-canape-rouille-apres.webp"] },
};

export default function Accueil() {
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": "https://studioannonce.fr/#organization", name: "Studio Annonce", legalName: "MA INDUSTRY COMPANY LIMITED", url: "https://studioannonce.fr/" },
      { "@type": "WebSite", "@id": "https://studioannonce.fr/#website", name: "Studio Annonce", alternateName: "StudioAnnonce", url: "https://studioannonce.fr/", inLanguage: "fr-FR", publisher: { "@id": "https://studioannonce.fr/#organization" } },
    ],
  };
  return <div className="studio-demo seo-home"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} /><Landing /></div>;
}

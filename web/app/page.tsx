import Landing from "./demo/landing";
import type { Metadata } from "next";
import "./demo/studio.css";

export const metadata: Metadata = {
  title: "Studio Annonce — retouche photo immobilière et décoration virtuelle",
  description: "Mettez vos photos de logement en valeur : lumière, rangement et décoration virtuelle. Explorez huit exemples avant/après et le parcours Studio Annonce.",
  alternates: { canonical: "/" },
  openGraph: { title: "Studio Annonce — de belles photos pour votre annonce", description: "Des exemples concrets, de la lumière à la décoration complète.", url: "/", locale: "fr_FR", type: "website", images: ["/demo/exemples/salon-canape-rouille-apres.webp"] },
};

export default function Accueil() {
  return <div className="studio-demo"><Landing /></div>;
}

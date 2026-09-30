import type { Metadata } from "next";
import { PhotoGallery, GuidedExample } from "../photo-gallery";
import { PublicHeader, PublicFooter } from "../aide/PublicChrome";
import { PHOTO_EXAMPLES } from "../../../../shared/photo-examples";
import "../studio.css";
import "../aide/public-pages.css";
export const metadata: Metadata = {
  title: "Retouche photo immobilière : 8 exemples avant après | Studio Annonce",
  description: "Comparez huit photos de logements avant et après retouche : lumière, chambres, cuisine, salon et terrasse. Découvrez les demandes et les transformations.",
  alternates: { canonical: "/demo/exemples/" },
  openGraph: { title: "Huit photos, un nouveau regard", description: "Des avant/après de logements : de la lumière à la décoration complète.", url: "/demo/exemples/", images: ["/demo/exemples/salon-canape-rouille-apres.webp"], locale: "fr_FR", type: "website" },
};
export default function ExamplesPage() {
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "Exemples de retouches photo immobilières", itemListElement: PHOTO_EXAMPLES.map((example, i) => ({ "@type": "ListItem", position: i + 1, name: example.seoTitle, url: `https://studioannonce.fr/exemples/${example.id}/` })) };
  return <div className="studio-demo public-info examples-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(list).replace(/</g, "\\u003c") }}/>
    <PublicHeader current="exemples"/>
    <main className="examples-main"><section className="examples-intro"><span className="section-kicker">HUIT PHOTOS · QUATRE LOGEMENTS</span><h1>La même pièce.<br/><em>Un nouveau regard.</em></h1><p>Une lumière plus juste, une couleur différente ou toute une décoration à imaginer. Explorez les photos originales, les propositions et les demandes qui les accompagnent.</p></section><PhotoGallery/><GuidedExample/></main>
    <PublicFooter/>
  </div>;
}

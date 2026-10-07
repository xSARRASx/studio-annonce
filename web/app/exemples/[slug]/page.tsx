import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PHOTO_EXAMPLES, findPhotoExample } from "../../../../shared/photo-examples";
import { ExampleViewer, GuidedExample, ExampleComparison } from "../../demo/photo-gallery";
import { PublicHeader, PublicFooter } from "../../demo/aide/PublicChrome";
import "../../demo/studio.css";
import "../../demo/aide/public-pages.css";
import "../../editorial.css";

export function generateStaticParams() { return PHOTO_EXAMPLES.map(example => ({ slug: example.id })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const example = findPhotoExample((await params).slug);
  if (!example) return {};
  return { title: `${example.seoTitle} | Studio Annonce`, description: example.seoDescription, alternates: { canonical: `/exemples/${example.id}/` }, openGraph: { title: example.seoTitle, description: example.seoDescription, url: `/exemples/${example.id}/`, type: "website", locale: "fr_FR", images: [{ url: `/demo/exemples/${example.file}-apres.webp`, alt: example.altAfter }] } };
}
export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const example = findPhotoExample((await params).slug);
  if (!example) notFound();
  const related = PHOTO_EXAMPLES.filter(item => item.id !== example.id).sort((a, b) => Number(b.listing === example.listing) - Number(a.listing === example.listing)).slice(0, 3);
  const url = `https://studioannonce.fr/exemples/${example.id}/`;
  const structured = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": url, url, name: example.seoTitle, description: example.seoDescription, inLanguage: "fr-FR", primaryImageOfPage: { "@type": "ImageObject", contentUrl: `https://studioannonce.fr/demo/exemples/${example.file}-apres.webp`, caption: example.altAfter } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://studioannonce.fr/" }, { "@type": "ListItem", position: 2, name: "Exemples", item: "https://studioannonce.fr/exemples/" }, { "@type": "ListItem", position: 3, name: example.seoTitle, item: url }] },
  ] };
  return <div className="studio-demo public-info editorial">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}/>
    <PublicHeader current="exemples"/>
    <main className="editorial-main">
      <nav className="editorial-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>/</span><Link href="/exemples/">Exemples</Link><span>/</span><span>{example.room}</span></nav>
      <header className="editorial-heading"><span className="public-eyebrow">{example.room.toLocaleUpperCase('fr')} · {example.category.toLocaleUpperCase('fr')}</span><h1>{example.title}</h1><p>{example.detail}</p><span className="editorial-tag">{example.virtual ? "Projection de décoration" : "Mise en valeur de la photo"}</span></header>
      <div className="editorial-comparison"><ExampleViewer example={example} priority/></div>
      <div className="editorial-detail"><article className="editorial-prose"><h2>Ce que cette retouche change.</h2>{example.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<h2>Les repères de la pièce.</h2><p>{example.preserved}. Garder ces éléments reconnaissables permet de comparer la proposition au logement photographié.</p><p className="editorial-source">Photo de départ : <a href={`https://www.airbnb.fr/rooms/${example.listing}`} target="_blank" rel="noopener noreferrer nofollow">{example.sourceTitle}, {example.location} — annonce Airbnb ↗</a>. La version retouchée est un exemple Studio Annonce.</p></article><aside className="editorial-brief"><span className="public-eyebrow">LA DEMANDE UTILISÉE</span><blockquote>« {example.prompt} »</blockquote><p>La photo et la demande restent ensemble. Vous pouvez comparer, puis préciser ce que vous souhaitez ajuster.</p><Link className="button dark" href="/inscription/?suite=photo">Préparer ma photo offerte →</Link></aside></div>
      <GuidedExample exampleId={example.id}/>
      <section className="editorial-related"><h2>D’autres idées pour votre logement.</h2><div className="editorial-cards">{related.map(item => <article className="editorial-card" key={item.id}><ExampleComparison example={item} thumbnail/><div className="editorial-card-copy"><span>{item.category}</span><h3><Link href={`/exemples/${item.id}/`}>{item.title}</Link></h3><p><Link href={`/exemples/${item.id}/`}>Voir l’exemple en détail →</Link></p></div></article>)}</div></section>
    </main><PublicFooter/>
  </div>;
}

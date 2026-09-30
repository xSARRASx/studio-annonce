import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findArticle, publishedArticles } from "../articles";
import { findPhotoExample } from "../../../../shared/photo-examples";
import { PublicHeader, PublicFooter } from "../../demo/aide/PublicChrome";
import "../../demo/studio.css";
import "../../demo/aide/public-pages.css";
import "../../editorial.css";
export function generateStaticParams() { return publishedArticles.map(article => ({ slug: article.slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = findArticle((await params).slug); if (!article) return {};
  return { title: `${article.title} | Studio Annonce`, description: article.description, alternates: { canonical: `/blog/${article.slug}/` }, openGraph: { title: article.title, description: article.description, url: `/blog/${article.slug}/`, type: "article", locale: "fr_FR", publishedTime: `${article.date}T12:00:00+07:00`, authors: ["Studio Annonce"], images: [`/demo/exemples/${article.coverExample}-apres.webp`] } };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = findArticle((await params).slug); if (!article) notFound();
  const cover = findPhotoExample(article.coverExample)!;
  const url = `https://studioannonce.fr/blog/${article.slug}/`;
  const structured = { "@context": "https://schema.org", "@graph": [
    { "@type": "BlogPosting", headline: article.title, description: article.description, datePublished: `${article.date}T12:00:00+07:00`, dateModified: `${article.date}T12:00:00+07:00`, inLanguage: "fr-FR", image: `https://studioannonce.fr/demo/exemples/${cover.file}-apres.webp`, author: { "@type": "Organization", name: "Studio Annonce", url: "https://studioannonce.fr/" }, publisher: { "@type": "Organization", name: "Studio Annonce", url: "https://studioannonce.fr/" }, mainEntityOfPage: { "@type": "WebPage", "@id": url } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://studioannonce.fr/" }, { "@type": "ListItem", position: 2, name: "Blog", item: "https://studioannonce.fr/blog/" }, { "@type": "ListItem", position: 3, name: article.title, item: url }] },
  ] };
  return <div className="studio-demo public-info editorial"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}/><PublicHeader current="blog"/><main className="editorial-main">
    <nav className="editorial-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>/</span><Link href="/blog/">Blog</Link></nav>
    <article><header className="editorial-heading"><span className="public-eyebrow">{article.category}</span><h1>{article.title}</h1><p>{article.intro}</p><p className="editorial-date">Par Studio Annonce · <time dateTime={article.date}>{new Date(`${article.date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time></p></header>
      <figure className="editorial-cover"><Image src={`/demo/exemples/${cover.file}-apres.webp`} alt={cover.altAfter} width={1440} height={1080} priority/><figcaption>Une proposition de décoration autour du canapé existant. <Link href={`/exemples/${cover.id}/`}>Comparer avec l’original →</Link></figcaption></figure>
      <div className="editorial-prose article-body">{article.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.examples && <div className="article-examples">{section.examples.map(slug => { const item = findPhotoExample(slug)!; return <Link key={slug} href={`/exemples/${slug}/`}><Image src={`/demo/exemples/${item.file}-apres-640.webp`} alt={item.altAfter} width={180} height={120}/><span>{item.title}<small>Voir l’avant / après →</small></span></Link>; })}</div>}</section>)}</div>
    </article><section className="public-next"><div><h2>Votre photo, votre idée.</h2><p>Découvrez comment une demande devient une proposition dans le parcours guidé.</p></div><Link className="button dark" href={`/demo/#decouvrir/${cover.id}`}>Explorer le parcours →</Link></section>
  </main><PublicFooter/></div>;
}

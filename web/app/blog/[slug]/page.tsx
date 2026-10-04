import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExampleComparison } from "../../demo/photo-gallery";
import { findArticle, publishedArticles } from "../articles";
import { findPhotoExample } from "../../../../shared/photo-examples";
import { PublicHeader, PublicFooter } from "../../demo/aide/PublicChrome";
import "../../demo/studio.css";
import "../../demo/aide/public-pages.css";
import "../../editorial.css";

const site = "https://studioannonce.fr";
const publishedAt = (date: string) => `${date}T12:00:00+07:00`;
export function generateStaticParams() {
  return publishedArticles.map(article => ({ slug: article.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = findArticle((await params).slug);
  if (!article) return {};
  const cover = article.coverExample ? findPhotoExample(article.coverExample) : undefined;
  const title = `${article.seoTitle || article.title} | Studio Annonce`;
  const image = cover ? `/demo/exemples/${cover.file}-apres.webp` : undefined;
  return {
    title, description: article.description,
    alternates: { canonical: `/blog/${article.slug}/` },
    openGraph: {
      title, description: article.description, url: `/blog/${article.slug}/`,
      type: "article", locale: "fr_FR", ...(article.showDate !== false ? { publishedTime: publishedAt(article.date) } : {}),
      authors: ["Studio Annonce"], ...(image && cover ? { images: [{ url: image, alt: cover.altAfter }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: article.description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = findArticle((await params).slug);
  if (!article) notFound();
  const cover = article.coverExample ? findPhotoExample(article.coverExample) : undefined;
  const related = (article.related || []).flatMap(slug => {
    const item = findArticle(slug);
    return item && item.slug !== article.slug ? [item] : [];
  });
  const url = `${site}/blog/${article.slug}/`;
  const structured = { "@context": "https://schema.org", "@graph": [
    {
      "@type": "BlogPosting", headline: article.title, description: article.description,
      ...(article.showDate !== false ? { datePublished: publishedAt(article.date), dateModified: publishedAt(article.date) } : {}),
      inLanguage: "fr-FR", ...(cover ? { image: `${site}/demo/exemples/${cover.file}-apres.webp` } : {}),
      author: { "@type": "Organization", "@id": `${site}/#organization`, name: "Studio Annonce", url: `${site}/` },
      publisher: { "@type": "Organization", "@id": `${site}/#organization`, name: "Studio Annonce", url: `${site}/` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${site}/blog/` },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ] },
  ] };
  return (
    <div className="studio-demo public-info editorial article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />
      <PublicHeader current="blog" />
      <main className="editorial-main">
        <nav className="editorial-breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>/</span><Link href="/blog/">Blog</Link></nav>
        <article>
          <header className="editorial-heading">
            <span className="public-eyebrow">{article.category}</span>
            <h1>{article.title}</h1><p>{article.intro}</p>
            <p className="editorial-date">Par Studio Annonce{article.showDate !== false && <> · <time dateTime={article.date}>{new Date(`${article.date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time></>}</p>
          </header>
          {cover && <figure className="editorial-cover">
            <ExampleComparison example={cover} priority />
            <figcaption>{article.coverCaption || cover.detail} <Link href={`/exemples/${cover.id}/`}>Comparer avec l’original →</Link></figcaption>
          </figure>}
          <div className="article-layout">
            <nav className="article-toc" aria-label="Sommaire de l’article">
              <p>Dans ce guide</p>
              <ol>{article.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`}>{section.title}</a></li>)}</ol>
            </nav>
            <div className="editorial-prose article-body">
              {article.sections.map((section, index) => {
                const examples = (section.examples || []).filter(slug => slug !== article.coverExample);
                return <section key={section.title} id={`section-${index + 1}`} className="article-section">
                  <h2><span className="article-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
                  {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  {section.checklist && <ul className="article-checklist">{section.checklist.map(item => <li key={item}>{item}</li>)}</ul>}
                  {examples.length > 0 && <div className="article-examples">{examples.map(slug => {
                    const item = findPhotoExample(slug)!;
                    return <div className="article-example" key={slug}><ExampleComparison example={item} thumbnail /><Link href={`/exemples/${slug}/`}>{item.title}<small>Voir l’exemple en détail →</small></Link></div>;
                  })}</div>}
                  {section.links && <ul className="article-links">{section.links.map(link => <li key={link.href}><Link href={link.href}>{link.label} →</Link></li>)}</ul>}
                </section>;
              })}
              {article.sources && <aside className="article-sources" aria-label="Sources et ressources">
                <h2>Pour aller à la source</h2>
                <ul>{article.sources.map(source => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ul>
                <p>Ressources consultées le 2 octobre 2026. Les interfaces et recommandations des plateformes peuvent évoluer.</p>
              </aside>}
            </div>
          </div>
        </article>
        {related.length > 0 && <section className="editorial-related" aria-labelledby="related-title">
          <h2 id="related-title">Pour continuer sur ce sujet</h2>
          <div className="editorial-cards">{related.map(item => <Link className="editorial-card article-related-card" key={item.slug} href={`/blog/${item.slug}/`}>
            <div className="editorial-card-copy"><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><span>Lire le guide →</span></div>
          </Link>)}</div>
        </section>}
        <section className="public-next"><div><h2>Votre photo, votre idée.</h2><p>Découvrez la demande, la photo de départ et le résultat proposé.</p></div><Link className="button dark" href={cover ? `/exemples/${cover.id}/` : "/exemples/"}>{cover ? "Voir cet exemple →" : "Explorer les exemples →"}</Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

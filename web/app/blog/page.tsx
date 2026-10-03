import type { Metadata } from "next";
import Link from "next/link";
import { ExampleComparison } from "../demo/photo-gallery";
import { BLOG_TOPICS, publishedArticles } from "./articles";
import { findPhotoExample } from "../../../shared/photo-examples";
import { PublicHeader, PublicFooter } from "../demo/aide/PublicChrome";
import "../demo/studio.css";
import "../demo/aide/public-pages.css";
import "../editorial.css";
import "../public-contrast.css";

export const metadata: Metadata = {
  title: "Blog : photos immobilières et décoration | Studio Annonce",
  description: "Des guides pièce par pièce pour photographier un logement, préparer une retouche, explorer la décoration virtuelle et organiser les images d’une annonce.",
  alternates: { canonical: "/blog/" },
  openGraph: { title: "Le blog Studio Annonce", description: "Des repères concrets pour vos photos et vos annonces.", url: "/blog/", type: "website", locale: "fr_FR", images: ["/demo/exemples/salon-canape-rouille-apres.webp"] },
};

export default function BlogPage() {
  const groups = BLOG_TOPICS.map((topic, index) => ({
    topic, id: `theme-${index + 1}`,
    articles: publishedArticles.filter(article => (article.topic || "Retouche & décoration") === topic),
  })).filter(group => group.articles.length > 0);
  const structured = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "Le blog Studio Annonce",
    url: "https://studioannonce.fr/blog/", inLanguage: "fr-FR",
    mainEntity: { "@type": "ItemList", itemListElement: groups.flatMap(group => group.articles).map((article, index) => ({ "@type": "ListItem", position: index + 1, name: article.title, url: `https://studioannonce.fr/blog/${article.slug}/` })) },
  };
  return (
    <div className="studio-demo public-info editorial">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }} />
      <PublicHeader current="blog" />
      <main className="editorial-main">
        <header className="editorial-heading">
          <span className="public-eyebrow">LE BLOG DU STUDIO · {publishedArticles.length} GUIDES</span>
          <h1>Un peu d’inspiration.<br /><em>Des conseils concrets.</em></h1>
          <p>Photographier, mettre en valeur, se projeter : des idées pour préparer vos images et mieux présenter votre logement.</p>
        </header>
        <nav className="blog-topic-nav" aria-label="Thèmes du blog">
          {groups.map(group => <a href={`#${group.id}`} key={group.id}>{group.topic}<span>{group.articles.length}</span></a>)}
        </nav>
        {groups.map(group => <section className="blog-topic" key={group.id} id={group.id} aria-labelledby={`${group.id}-title`}>
          <div className="blog-topic-heading"><h2 id={`${group.id}-title`}>{group.topic}</h2><span>{group.articles.length} guides</span></div>
          <div className="blog-guide-grid">{group.articles.map(article => {
            const example = article.coverExample ? findPhotoExample(article.coverExample) : undefined;
            return <article className="editorial-card blog-guide-card" key={article.slug}>
              {example && <ExampleComparison example={example} thumbnail />}
              <div className="editorial-card-copy">
                <span className="public-eyebrow">{article.category}</span>
                <h3><Link href={`/blog/${article.slug}/`}>{article.title}</Link></h3>
                <p>{article.description}</p>
                <Link className="blog-guide-link" href={`/blog/${article.slug}/`}>Lire le guide <span className="sr-only"> : {article.title}</span> →</Link>
              </div>
            </article>;
          })}</div>
        </section>)}
        <section className="public-next"><div><span className="public-eyebrow">PLACE AUX IMAGES</span><h2>Comparez les propositions.</h2><p>La photo originale, la demande et le résultat, réunis pour chaque exemple.</p></div><Link className="button dark" href="/exemples/">Explorer les huit exemples →</Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}

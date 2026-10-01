import type { Metadata } from "next";
import { ExampleComparison } from "../demo/photo-gallery";
import Link from "next/link";
import { publishedArticles } from "./articles";
import { findPhotoExample } from "../../../shared/photo-examples";
import { PublicHeader, PublicFooter } from "../demo/aide/PublicChrome";
import "../demo/studio.css";
import "../demo/aide/public-pages.css";
import "../editorial.css";
export const metadata: Metadata = { title: "Blog : photos immobilières et décoration | Studio Annonce", description: "Des conseils et des exemples avant/après pour préparer vos photos immobilières, améliorer la lumière et explorer la décoration virtuelle.", alternates: { canonical: "/blog/" }, openGraph: { title: "Le blog Studio Annonce", description: "Des repères concrets pour vos photos et vos annonces.", url: "/blog/", type: "website", locale: "fr_FR", images: ["/demo/exemples/salon-canape-rouille-apres.webp"] } };
export default function BlogPage() {
  return <div className="studio-demo public-info editorial"><PublicHeader current="blog"/><main className="editorial-main">
    <header className="editorial-heading"><span className="public-eyebrow">LE BLOG DU STUDIO</span><h1>Un peu d’inspiration.<br/><em>Des conseils concrets.</em></h1><p>Photographier, mettre en valeur, se projeter : des idées pour préparer vos images et mieux présenter votre logement.</p></header>
    <div className="blog-posts">{publishedArticles.map(article => { const example = findPhotoExample(article.coverExample)!; return <article className="blog-post" key={article.slug}><div className="blog-post-image"><ExampleComparison example={example} priority/></div><div className="blog-post-copy"><span className="public-eyebrow">{article.category}</span><p className="editorial-date"><time dateTime={article.date}>{new Date(`${article.date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time></p><h2><Link href={`/blog/${article.slug}/`}>{article.title}</Link></h2><p>{article.description}</p><Link className="button outlined" href={`/blog/${article.slug}/`}>Lire l’article →</Link></div></article>; })}</div>
    <section className="public-next"><div><span className="public-eyebrow">PLACE AUX IMAGES</span><h2>Comparez les propositions.</h2><p>La photo originale, la demande et le résultat, réunis pour chaque exemple.</p></div><Link className="button dark" href="/exemples/">Explorer les huit exemples →</Link></section>
  </main><PublicFooter/></div>;
}

import type { MetadataRoute } from "next";
import { PHOTO_EXAMPLES } from "../../shared/photo-examples";
import { publishedArticles } from "./blog/articles";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://studioannonce.fr";
  return [
    ...["/", "/exemples/", "/application/", "/tarifs/", "/aide/", "/blog/", "/confidentialite/"].map(path => ({ url: `${base}${path}` })),
    ...PHOTO_EXAMPLES.map(example => ({ url: `${base}/exemples/${example.id}/` })),
    ...publishedArticles.map(article => ({ url: `${base}/blog/${article.slug}/`, lastModified: `${article.date}T12:00:00+07:00` })),
  ];
}

import type { MetadataRoute } from "next";
import { PHOTO_EXAMPLES, findPhotoExample, type PhotoExample } from "../../shared/photo-examples";
import { publishedArticles } from "./blog/articles";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://studioannonce.fr";
  const images = (example: PhotoExample) => ["avant", "apres"].map(side => `${base}/demo/exemples/${example.file}-${side}.webp`);
  return [
    ...["/", "/exemples/", "/application/", "/tarifs/", "/aide/", "/blog/", "/entreprise/", "/mentions-legales/", "/confidentialite/", "/cookies/", "/conditions-utilisation/"].map(path => ({ url: `${base}${path}` })),
    ...PHOTO_EXAMPLES.map(example => ({ url: `${base}/exemples/${example.id}/`, images: images(example) })),
    ...publishedArticles.map(article => {
      const cover = article.coverExample ? findPhotoExample(article.coverExample) : undefined;
      return { url: `${base}/blog/${article.slug}/`, lastModified: `${article.date}T12:00:00+07:00`, ...(cover ? { images: images(cover) } : {}) };
    }),
  ];
}

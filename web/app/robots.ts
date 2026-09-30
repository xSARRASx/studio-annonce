import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/app/", "/admin/", "/connexion/", "/mobile/", "/mobile-preview/"] }, sitemap: "https://studioannonce.fr/sitemap.xml" };
}

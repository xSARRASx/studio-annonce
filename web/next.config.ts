import type { NextConfig } from "next";

// Site 100 % statique : il se sert depuis n'importe quel hébergeur (GitHub Pages, PlanetHoster).
// NEXT_PUBLIC_BASE_PATH = "/studio-annonce" quand le site vit dans un sous-dossier (GitHub Pages).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

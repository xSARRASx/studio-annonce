import type { NextConfig } from "next";
import path from "node:path";

// Site 100 % statique : il se sert depuis n'importe quel hébergeur (GitHub Pages, PlanetHoster).
// NEXT_PUBLIC_BASE_PATH = "/studio-annonce" quand le site vit dans un sous-dossier (GitHub Pages).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  // Le questionnaire est partagé avec Expo dans ../shared.
  turbopack: { root: path.resolve(__dirname, "..") },
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

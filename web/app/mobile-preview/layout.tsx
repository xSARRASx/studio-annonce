import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aperçu mobile | Studio Annonce",
  robots: { index: false, follow: true },
};

export default function MobilePreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}

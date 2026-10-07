import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CookieInfoLink } from "@/components/cookie-info-link";
import { TrackingRoot } from "@/components/tracking-root";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://studioannonce.fr"),
  title: "Studio Annonce",
  description: "Studio Annonce réunit vos logements, vos photos et vos demandes de retouche dans un seul espace.",
};
export const viewport: Viewport = { themeColor: "#f8f7f2", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}<CookieInfoLink /><TrackingRoot /></body>
    </html>
  );
}

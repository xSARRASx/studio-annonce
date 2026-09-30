import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Studio Annonce",
  description: "Découvrez Studio Annonce : préparez vos photos immobilières et explorez le studio en démonstration.",
};
export const viewport: Viewport = { themeColor: "#f8f7f2", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}<CookieConsent /></body>
    </html>
  );
}

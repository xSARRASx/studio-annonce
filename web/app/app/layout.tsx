import type { Metadata } from "next";
import ConnectedLayoutClient from "./ConnectedLayoutClient";

export const metadata: Metadata = {
  title: "Mon studio | Studio Annonce",
  description: "Espace personnel Studio Annonce pour vos logements, photos, versions et demandes.",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ConnectedLayoutClient>{children}</ConnectedLayoutClient>;
}

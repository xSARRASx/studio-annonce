"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Coins, LogOut } from "lucide-react";
import { Embleme } from "@/components/logo";
import { api, jeton, poserJeton, type Compte } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const chemin = usePathname();
  const [compte, setCompte] = useState<Compte | null>(null);

  useEffect(() => {
    if (!jeton()) { routeur.replace("/"); return; }
    api<Compte>("/compte").then(setCompte).catch(() => { poserJeton(null); routeur.replace("/"); });
  }, [routeur, chemin]);

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur bg-bg/80 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/app" className="flex items-center gap-2 font-semibold tracking-tight">
            <Embleme className="size-8" />
            <span className="hidden sm:inline">Studio <span className="text-accent">Annonce</span></span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/app/compte" className="inline-flex items-center gap-2 rounded-full bg-surface-2 border border-line px-3 h-9 hover:border-line-strong">
              <Coins className="size-4 text-accent" />
              <span>{compte ? `${compte.solde} crédit${compte.solde > 1 ? "s" : ""}` : "…"}</span>
              {compte?.photo_offerte_disponible && <span className="text-xs text-accent">+1 offerte</span>}
            </Link>
            <button onClick={() => { poserJeton(null); routeur.replace("/"); }} className="size-9 grid place-items-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-2" title="Se déconnecter">
              <LogOut className="size-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}

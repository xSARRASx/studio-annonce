"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Coins, LogOut } from "lucide-react";
import { Embleme } from "@/components/logo";
import { api, ErreurApi, jeton, poserJeton, type Compte, type Sante } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const chemin = usePathname();
  const [sante, setSante] = useState<Sante | null>(null);
  const [compte, setCompte] = useState<Compte | null>(null);
  const [erreurCompte, setErreurCompte] = useState("");

  useEffect(() => {
    if (!jeton()) { routeur.replace("/connexion"); return; }
    let annule = false;
    const actualiser = () => {
      api<Compte>("/compte").then((valeur) => { if (!annule) { setErreurCompte(""); setCompte(valeur); if (!valeur.profil_complet && chemin !== "/app/compte" && chemin !== "/app/compte/") routeur.replace("/app/compte/"); } }).catch((erreur: ErreurApi) => {
        // Une panne après un téléchargement ne doit pas déconnecter l'utilisateur.
        if (!annule && erreur.statut === 401) { poserJeton(null); routeur.replace("/connexion"); }
        else if (!annule) setErreurCompte("Votre compte ne peut pas être chargé pour le moment.");
      });
    };
    actualiser();
    api<Sante>("/sante").then(v => { if (!annule) setSante(v); }).catch(() => {});
    window.addEventListener("studio:credits-updated", actualiser);
    return () => { annule = true; window.removeEventListener("studio:credits-updated", actualiser); };
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
            <button onClick={() => { poserJeton(null); routeur.replace("/connexion"); }} className="size-9 grid place-items-center rounded-full text-fg-muted hover:text-fg hover:bg-surface-2" title="Se déconnecter">
              <LogOut className="size-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">{sante && !sante.retouche_disponible && <p role="status" className="rounded-2xl border border-line bg-surface p-4 mb-6 text-sm text-fg-muted">La retouche photo est momentanément indisponible. Vous pouvez préparer vos photos ; aucun crédit n’est consommé.</p>}{erreurCompte && <div role="alert" className="mb-4 text-sm"><p>{erreurCompte}</p><button className="text-accent mt-2" onClick={() => window.dispatchEvent(new Event("studio:credits-updated"))}>Réessayer</button></div>}{compte ? children : !erreurCompte && <p className="text-fg-muted">Chargement de votre compte…</p>}</main>
    </div>
  );
}

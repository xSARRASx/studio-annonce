"use client";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Bouton({ children, variante = "primaire", chargement, className = "", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primaire" | "secondaire" | "discret" | "danger"; chargement?: boolean }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const styles = {
    primaire: "bg-accent text-accent-fg hover:brightness-110 shadow-[0_8px_30px_-10px_var(--accent)]",
    secondaire: "bg-surface-2 text-fg border border-line hover:border-line-strong",
    discret: "text-fg-muted hover:text-fg hover:bg-surface-2",
    danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
  }[variante];
  return (
    <button className={`${base} ${styles} ${className}`} disabled={chargement || props.disabled} {...props}>
      {chargement && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Champ({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-12 w-full rounded-2xl bg-surface-2 border border-line px-4 text-fg placeholder:text-fg-muted/60 outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition ${className}`} {...props} />;
}

export function Carte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-surface border border-line p-6 ${className}`}>{children}</div>;
}

export function Pastille({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "accent" | "ok" | "alerte" }) {
  const t = { neutre: "bg-surface-2 text-fg-muted", accent: "bg-accent/15 text-accent", ok: "bg-emerald-500/15 text-emerald-400", alerte: "bg-amber-500/15 text-amber-400" }[ton];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${t}`}>{children}</span>;
}

export function Message({ texte, ton = "erreur" }: { texte: string; ton?: "erreur" | "info" }) {
  if (!texte) return null;
  return <p className={`rounded-2xl px-4 py-3 text-sm ${ton === "erreur" ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-accent/10 text-accent border border-accent/20"}`}>{texte}</p>;
}

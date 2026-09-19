"use client";
import { useEffect, useState } from "react";
import { Coins, Gift } from "lucide-react";
import { api, type Compte } from "@/lib/api";
import { Bouton, Carte, Message } from "@/components/ui";

export default function PageCompte() {
  const [compte, setCompte] = useState<Compte | null>(null);
  const [erreur, setErreur] = useState("");
  useEffect(() => { api<Compte>("/compte").then(setCompte).catch((e) => setErreur(e.message)); }, []);
  const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return (
    <div className="apparait space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Mes crédits</h1>
        <p className="text-fg-muted mt-1">1 crédit = 1 photo gardée en HD. Les essais sont illimités avant de garder, et 7 jours après.</p>
      </div>
      <Message texte={erreur} />
      <Carte className="flex items-center gap-4">
        <span className="size-12 rounded-2xl bg-accent/15 grid place-items-center"><Coins className="size-6 text-accent" /></span>
        <div><p className="text-3xl font-semibold">{compte?.solde ?? "…"}</p><p className="text-sm text-fg-muted">crédit{(compte?.solde || 0) > 1 ? "s" : ""} disponible{(compte?.solde || 0) > 1 ? "s" : ""}</p></div>
        {compte?.photo_offerte_disponible && <span className="ml-auto inline-flex items-center gap-2 text-sm text-accent"><Gift className="size-4" /> Votre première photo est offerte</span>}
      </Carte>
      <div className="grid sm:grid-cols-3 gap-4">
        {compte?.packs.map((p) => (
          <Carte key={p.id} className="text-center">
            <p className="text-2xl font-semibold">{p.credits} photos</p>
            <p className="text-fg-muted text-sm">{euros(p.prix_centimes / p.credits)} la photo</p>
            <p className="text-xl mt-4">{euros(p.prix_centimes)}</p>
            <Bouton className="w-full mt-4" disabled title="Paiement bientôt disponible">Acheter</Bouton>
          </Carte>))}
      </div>
      {compte && compte.registre.length > 0 && (
        <Carte>
          <h2 className="font-medium mb-3">Historique</h2>
          <ul className="divide-y divide-line text-sm">
            {compte.registre.map((m, i) => (
              <li key={i} className="py-2 flex gap-3"><span className={m.delta > 0 ? "text-emerald-400" : "text-fg-muted"}>{m.delta > 0 ? "+" : ""}{m.delta}</span><span>{m.motif}</span><span className="ml-auto text-fg-muted">{new Date(m.le).toLocaleDateString("fr-FR")}</span></li>))}
          </ul>
        </Carte>)}
    </div>
  );
}

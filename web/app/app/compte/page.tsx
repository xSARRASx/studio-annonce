"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Coins, Gift, ShieldCheck } from "lucide-react";
import { api, ErreurApi, type Compte } from "@/lib/api";
import { Bouton, Carte, Champ, Message } from "@/components/ui";

export default function PageCompte() {
  const [compte, setCompte] = useState<Compte | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [achatEnCours, setAchatEnCours] = useState("");
  const demande = useRef<{ pack: string; cle: string } | null>(null);
  const verrou = useRef(false);
  useEffect(() => {
    let actif = true;
    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const charger = async () => {
      try {
        const c = await api<Compte>("/compte");
        if (actif) { setCompte(c); setPrenom(c.prenom); setNom(c.nom); }
      } catch (e) { if (actif) setErreur((e as Error).message); }
    };
    void charger();
    const query = new URLSearchParams(window.location.search);
    const achat = query.get("achat");
    if (query.get("paiement") === "annule") queueMicrotask(() => setMessage("Paiement annulé. Vous pouvez reprendre votre achat quand vous le souhaitez."));
    if (achat && /^[A-Za-z0-9_-]{1,24}$/.test(achat)) {
      let essais = 0;
      const verifier = async () => {
        try {
          const etat = await api<{ statut: string; credits: number }>(`/paiements/${achat}`);
          if (!actif) return;
          if (etat.statut === "paye") {
            setMessage(`Paiement confirmé : ${etat.credits} crédits ont été ajoutés à votre compte.`);
            await charger(); window.dispatchEvent(new Event("studio:credits-updated"));
          } else if (["expire", "echec"].includes(etat.statut)) setMessage("Ce paiement n’a pas abouti. Aucun crédit n’a été ajouté.");
          else {
            setMessage("Votre paiement est en cours de confirmation. Les crédits apparaîtront après validation.");
            if (++essais < 6) minuterie = setTimeout(verifier, 3000);
          }
        } catch (e) { if (actif) setErreur((e as Error).message); }
      };
      void verifier();
    }
    return () => { actif = false; clearTimeout(minuterie); };
  }, []);

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault(); if (verrou.current) return;
    verrou.current = true; setEnregistrement(true); setErreur(""); setMessage("");
    try {
      setCompte(await api<Compte>("/compte/profil", { method: "PATCH", body: JSON.stringify({ prenom, nom }) }));
      setMessage("Votre profil est enregistré."); window.dispatchEvent(new Event("studio:credits-updated"));
    } catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setEnregistrement(false); }
  }

  async function acheter(pack: string) {
    if (verrou.current) return;
    verrou.current = true; setAchatEnCours(pack); setErreur("");
    if (demande.current?.pack !== pack) demande.current = { pack, cle: crypto.randomUUID() };
    try {
      const resultat = await api<{ url: string | null; statut: string }>("/paiements/checkout", {
        method: "POST", body: JSON.stringify({ pack_id: pack, cle_demande: demande.current.cle }) });
      if (resultat.statut === "paye") { setCompte(await api<Compte>("/compte")); setMessage("Cet achat a déjà été ajouté à votre compte."); demande.current = null; return; }
      const url = new URL(resultat.url || "");
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Le paiement ne peut pas être ouvert pour le moment.");
      window.location.assign(url.href);
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 409) demande.current = null;
      setErreur((e as Error).message);
    }
    finally { verrou.current = false; setAchatEnCours(""); }
  }

  const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return <div className="apparait space-y-7 max-w-3xl mx-auto">
    <div><h1 className="text-3xl font-semibold tracking-tight">Mon compte</h1><p className="text-fg-muted mt-2">Vos informations, vos crédits et vos achats.</p></div>
    <Message texte={erreur}/><Message texte={message} ton="info"/>
    <Carte>
      <h2 className="text-xl font-semibold">Mes informations</h2>
      {compte && !compte.profil_complet && <p className="text-sm text-accent mt-2">Complétez votre prénom et votre nom pour accéder à votre espace et à votre photo offerte.</p>}
      <p className="text-sm text-fg-muted mt-2 flex items-center gap-2"><ShieldCheck className="size-4"/> {compte?.email} · email vérifié</p>
      <form onSubmit={enregistrer} className="mt-5 grid sm:grid-cols-2 gap-4">
        <label className="text-sm">Prénom<Champ className="mt-1.5" autoComplete="given-name" required maxLength={80} value={prenom} onChange={e => setPrenom(e.target.value)}/></label>
        <label className="text-sm">Nom<Champ className="mt-1.5" autoComplete="family-name" required maxLength={80} value={nom} onChange={e => setNom(e.target.value)}/></label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4"><Bouton type="submit" chargement={enregistrement} disabled={!prenom.trim() || !nom.trim()}>Enregistrer mon profil</Bouton>{compte?.profil_complet && <Link href="/app/" className="text-sm text-accent">Accéder à mes logements →</Link>}</div>
      </form>
    </Carte>
    <Carte className="flex flex-wrap items-center gap-4">
      <span className="size-12 rounded-2xl bg-accent/15 grid place-items-center"><Coins className="size-6 text-accent"/></span>
      <div><p className="text-3xl font-semibold">{compte?.solde ?? "…"}</p><p className="text-sm text-fg-muted">crédits disponibles</p></div>
      {compte?.photo_offerte_disponible && <span className="sm:ml-auto inline-flex items-center gap-2 text-sm text-accent"><Gift className="size-4"/> Votre première photo est offerte</span>}
    </Carte>
    <div><h2 className="text-xl font-semibold">Acheter des crédits photo</h2>
      <p className="text-fg-muted text-sm mt-2">1 crédit = 1 photo gardée en HD. Les téléchargements d’une version déjà obtenue restent gratuits.</p>
      {!compte?.paiement_disponible && <p className="mt-3 rounded-2xl bg-surface-2 p-4 text-sm">Les achats ne sont pas encore ouverts. Les prix ci-dessous sont en préparation ; aucun paiement n’est possible pour le moment.</p>}
    </div>
    <div className="grid sm:grid-cols-3 gap-4">{compte?.packs.map(p => <Carte key={p.id} className="text-center">
      <p className="text-xl font-semibold">{p.credits} photos</p><p className="text-fg-muted text-sm mt-2">{euros(p.prix_centimes / p.credits)} par photo</p>
      <p className="text-2xl font-semibold mt-5">{euros(p.prix_centimes)}</p>
      <Bouton className="w-full mt-5" disabled={!compte.paiement_disponible || !compte.profil_complet || !!achatEnCours} chargement={achatEnCours === p.id} onClick={() => acheter(p.id)}>{compte.paiement_disponible ? "Choisir ce pack" : "Bientôt disponible"}</Bouton>
    </Carte>)}</div>
    {compte?.paiement_disponible && <p className="text-sm text-fg-muted">Paiement sécurisé par Stripe. Achat ponctuel, sans abonnement.</p>}
    {compte && compte.registre.length > 0 && <Carte><h2 className="font-semibold mb-3">Historique des crédits</h2>
      <ul className="divide-y divide-line text-sm">{compte.registre.map((m, i) => <li key={i} className="py-3 flex flex-wrap gap-3"><span className={m.delta > 0 ? "text-emerald-700" : "text-fg-muted"}>{m.delta > 0 ? "+" : ""}{m.delta}</span><span>{m.motif}</span><span className="ml-auto text-fg-muted">{new Date(m.le).toLocaleDateString("fr-FR")}</span></li>)}</ul>
    </Carte>}
  </div>;
}

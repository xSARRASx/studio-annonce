"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, Gift, History, ShieldCheck } from "lucide-react";
import { api, ErreurApi, type Compte } from "@/lib/api";
import { Bouton, Champ, Message } from "@/components/ui";

export default function AccountPage({ billing = false }: { billing?: boolean }) {
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
  return <main className="st-main st-billing">
    <p className="eyebrow">{billing ? "FACTURATION" : "VOTRE ESPACE PERSONNEL"}</p>
    <h1>{billing ? "Vos crédits et vos achats." : "Mon compte"}</h1>
    <p className="connected-account-intro">{billing ? "Retrouvez votre solde et les crédits utilisés." : "Vos informations pour retrouver toutes vos créations."}</p>
    <Message texte={erreur}/><Message texte={message} ton="info"/>
    {!billing ? <>
      <section className="st-bill-block">
        <div className="st-block-head"><h2>Mes informations</h2><span><ShieldCheck size={16}/> Email vérifié</span></div>
        <p className="connected-account-email">{compte?.email}</p>
        {compte && !compte.profil_complet && <p className="connected-account-intro">Complétez votre prénom et votre nom pour accéder à votre espace et à votre photo offerte.</p>}
        <form onSubmit={enregistrer} className="connected-profile-form">
          <label>Prénom<Champ autoComplete="given-name" required maxLength={80} value={prenom} onChange={e => setPrenom(e.target.value)}/></label>
          <label>Nom<Champ autoComplete="family-name" required maxLength={80} value={nom} onChange={e => setNom(e.target.value)}/></label>
          <div><Bouton type="submit" chargement={enregistrement} disabled={!prenom.trim() || !nom.trim()}>Enregistrer mon profil</Bouton>{compte?.profil_complet && <Link href="/app/" className="text-action">Mes créations <ArrowRight size={15}/></Link>}</div>
        </form>
      </section>
      <div className="st-free"><Gift size={22}/><div><strong>{compte?.photo_offerte_disponible ? "Votre première photo est offerte" : "Votre studio vous attend"}</strong><p>Vos photos, vos demandes et leurs différentes versions au même endroit.</p></div><Link className="text-action" href="/app/#creer">Créer <ArrowRight size={15}/></Link></div>
      <Link className="connected-billing-link text-action" href="/app/facturation/">Consulter mes crédits et mes achats <ArrowRight size={15}/></Link>
    </> : <>
      <div className="st-bill-top">
        <div className="st-balance"><span>Crédits disponibles</span><strong>{compte?.solde ?? "…"}<small>crédits</small></strong><p>1 crédit = 1 photo gardée en HD.</p></div>
        <div className="st-free"><Gift size={22}/><div><strong>{compte?.photo_offerte_disponible ? "1 photo offerte" : "Votre essai photo"}</strong><p>{compte?.photo_offerte_disponible ? "Votre première photo retouchée est gratuite." : "Retrouvez votre photo offerte dans Mes créations."}</p></div><Link className="text-action" href={compte?.photo_offerte_disponible ? "/app/#nouvelle" : "/app/"}>{compte?.photo_offerte_disponible ? "Créer ma retouche" : "Mes créations"} <ArrowRight size={15}/></Link></div>
      </div>
      <section className="st-bill-block"><div className="st-block-head"><h2>Recharger</h2><span>{compte?.paiement_disponible ? "Achat ponctuel, sans abonnement." : "Les achats ne sont pas encore ouverts."}</span></div>
        {!compte?.paiement_disponible && <p className="connected-account-intro">Tarifs en préparation. Aucun paiement n’est possible pour le moment.</p>}
        <div className="st-packs">{compte?.packs.map(p => <div className="st-pack" key={p.id}><span>{p.credits} photos</span><strong>{euros(p.prix_centimes)}</strong><small>{euros(p.prix_centimes / p.credits)} par photo</small><Bouton disabled={!compte.paiement_disponible || !compte.profil_complet || !!achatEnCours} chargement={achatEnCours === p.id} onClick={() => acheter(p.id)}>{compte.paiement_disponible ? "Choisir ce pack" : "Bientôt disponible"}</Bouton></div>)}</div>
      </section>
      <section className="st-bill-block"><div className="st-block-head"><h2><History size={18}/> Historique</h2><span>{compte?.registre.length || 0} opérations</span></div>
        {compte?.registre.length ? <ul className="st-ledger">{compte.registre.map((m, i) => <li key={i}><span><strong>{m.motif}</strong><small>{new Date(m.le).toLocaleDateString("fr-FR")}</small></span><b className={m.delta < 0 ? "debit" : ""}>{m.delta > 0 ? "+" : ""}{m.delta} crédits</b></li>)}</ul> : <p className="st-empty-line">Aucun crédit utilisé pour l’instant.</p>}
      </section>
      <div className="st-bill-rules"><p><Download size={17}/> Les téléchargements d’une version HD déjà obtenue restent gratuits.</p><p><ShieldCheck size={17}/> {compte?.paiement_disponible ? "Paiement sécurisé par Stripe." : "Aucun prélèvement automatique."}</p></div>
    </>}
  </main>;
}

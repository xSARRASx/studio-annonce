"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, Gift, History, ShieldCheck } from "lucide-react";
import { api, ErreurApi, type Compte } from "@/lib/api";
import { Bouton, Champ, Message } from "@/components/ui";
import { CreationLimits, SupportContact } from "@/components/creation-limits";
import { useStudioAccount } from "@/components/studio-account";

export default function AccountPage({ billing = false }: { billing?: boolean }) {
  const { compte: comptePartage } = useStudioAccount();
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
          const etat = await api<{ statut: string; credits: number; nature: "photo" | "video" }>(`/paiements/${achat}`);
          if (!actif) return;
          if (etat.statut === "paye") {
            setMessage(`Paiement confirmé : ${etat.credits} crédits ${etat.nature === "video" ? "vidéo" : "photo"} ont été ajoutés à votre compte.`);
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
  const packsPhoto = compte?.packs_photo || compte?.packs || [];
  const packsVideo = compte?.packs_video || [];
  const paiementPhoto = compte?.paiement_photo_disponible ?? compte?.paiement_disponible ?? false;
  const paiementVideo = compte?.paiement_video_disponible ?? false;
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
        <div className="st-balance"><span>Crédits photo</span><strong>{compte?.solde ?? "…"}<small>crédits</small></strong><p>1 crédit pour garder une photo en HD, ou pour ajouter une correction.</p><span className="connected-video-balance">Crédits vidéo : <b>{compte?.solde_video ?? 0}</b> · 1 crédit = 5 secondes</span></div>
        <div className="st-free"><Gift size={22}/><div><strong>{compte?.photo_offerte_disponible ? "1 photo offerte" : "Votre essai photo"}</strong><p>{compte?.photo_offerte_disponible ? "Votre première photo retouchée est gratuite." : "Retrouvez votre photo offerte dans Mes créations."}</p></div><Link className="text-action" href={compte?.photo_offerte_disponible ? "/app/#nouvelle" : "/app/"}>{compte?.photo_offerte_disponible ? "Créer ma retouche" : "Mes créations"} <ArrowRight size={15}/></Link></div>
      </div>
      <section className="st-bill-block"><div className="st-block-head"><h2>Vos créations depuis le dernier achat</h2></div><CreationLimits limites={comptePartage.limites}/><CreationLimits limites={comptePartage.limites} kind="video"/><p className="connected-account-intro">Une première génération et une correction sont incluses par photo, y compris la photo offerte. Chaque correction supplémentaire nécessite 1 crédit. La génération vidéo n’est pas encore ouverte.</p></section>
      <section className="st-bill-block"><div className="st-block-head"><h2>Packs photo</h2><span>Achat ponctuel, sans abonnement.</span></div>
        {!paiementPhoto && <p className="connected-account-intro">Les tarifs sont fixés. Le paiement ouvrira dès que la génération photo aura passé sa recette de production.</p>}
        <div className="st-packs">{packsPhoto.map(p => <div className={`st-pack${p.avantage ? " st-pack-featured" : ""}`} key={p.id}>{p.avantage && <em>{p.avantage}</em>}<span>{p.libelle}</span><strong>{euros(p.prix_centimes)}</strong><small>{euros(p.prix_unitaire_centimes)} par photo · sans abonnement</small><Bouton disabled={!paiementPhoto || !compte?.profil_complet || !!achatEnCours} chargement={achatEnCours === p.id} onClick={() => acheter(p.id)}>{paiementPhoto ? "Choisir ce pack" : "Bientôt disponible"}</Bouton></div>)}</div>
      </section>
      <section className="st-bill-block"><div className="st-block-head"><h2>Packs vidéo</h2><span>Des crédits séparés pour un prix clair.</span></div>
        <p className="connected-account-intro">1 crédit vidéo = 5 secondes en 720p. Les crédits photo ne sont jamais consommés par une vidéo.</p>
        {!paiementVideo && <p className="connected-account-intro">Les packs sont préparés, mais aucun paiement vidéo ne peut partir avant la validation de Higgsfield.</p>}
        <div className="st-packs">{packsVideo.map(p => <div className={`st-pack${p.avantage ? " st-pack-featured" : ""}`} key={p.id}>{p.avantage && <em>{p.avantage}</em>}<span>{p.libelle}</span><strong>{euros(p.prix_centimes)}</strong><small>{p.credits} crédits vidéo · {euros(p.prix_unitaire_centimes)} les 5 secondes</small><Bouton disabled={!paiementVideo || !compte?.profil_complet || !!achatEnCours} chargement={achatEnCours === p.id} onClick={() => acheter(p.id)}>{paiementVideo ? "Choisir ce pack" : "Bientôt disponible"}</Bouton></div>)}</div>
      </section>
      <section className="st-bill-block"><div className="st-block-head"><h2><History size={18}/> Historique</h2><span>{compte?.registre.length || 0} opérations</span></div>
        {(compte?.registre.length || compte?.registre_video?.length) ? <ul className="st-ledger">{[...(compte?.registre || []).map(m => ({...m, nature: "photo" as const})), ...(compte?.registre_video || []).map(m => ({...m, nature: "video" as const}))].sort((a, b) => Date.parse(b.le) - Date.parse(a.le)).map((m, i) => <li key={`${m.nature}-${m.le}-${i}`}><span><strong>{m.motif}</strong><small>{new Date(m.le).toLocaleDateString("fr-FR")}</small></span><b className={m.delta < 0 ? "debit" : ""}>{m.delta > 0 ? "+" : ""}{m.delta} crédit{Math.abs(m.delta) > 1 ? "s" : ""} {m.nature}</b></li>)}</ul> : <p className="st-empty-line">Aucun crédit utilisé pour l’instant.</p>}
      </section>
      <div className="st-bill-rules"><p><Download size={17}/> Les téléchargements d’une version HD déjà obtenue restent gratuits.</p><p><ShieldCheck size={17}/> {compte?.paiement_disponible ? "Paiement sécurisé par Stripe." : "Aucun prélèvement automatique."}</p></div>
    </>}
    <SupportContact limites={comptePartage.limites}/>
  </main>;
}

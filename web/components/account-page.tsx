"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, Gift, History, ShieldCheck } from "lucide-react";
import { api, ErreurApi, type Achat, type Compte, type Pack } from "@/lib/api";
import { Bouton, Champ, Message } from "@/components/ui";
import { CreationLimits, SupportContact } from "@/components/creation-limits";
import { useStudioAccount } from "@/components/studio-account";
import PurchaseDocument from "@/components/purchase-document";

type Panier = Record<string, number>;
const articlesDuPanier = (packs: Pack[], panier: Panier) => packs.flatMap(p => panier[p.id] ? [{ pack_id: p.id, quantite: panier[p.id] }] : []);
const totalDuPanier = (packs: Pack[], panier: Panier) => packs.reduce((total, p) => total + p.prix_centimes * (panier[p.id] || 0), 0);
const creditsDuPanier = (packs: Pack[], panier: Panier) => packs.reduce((total, p) => total + p.credits * (panier[p.id] || 0), 0);

export default function AccountPage({ billing = false, credits = false }: { billing?: boolean; credits?: boolean }) {
  const router = useRouter();
  const { compte: comptePartage } = useStudioAccount();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [achatEnCours, setAchatEnCours] = useState("");
  const [panierPhoto, setPanierPhoto] = useState<Panier>({});
  const [panierVideo, setPanierVideo] = useState<Panier>({});
  const demande = useRef<{ signature: string; cle: string } | null>(null);
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
    if (billing) void api<Achat[]>("/compte/achats").then(items => { if (actif) setAchats(items); }).catch(e => { if (actif) setErreur((e as Error).message); });
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
  }, [billing]);

  async function enregistrer(event: React.FormEvent) {
    event.preventDefault(); if (verrou.current) return;
    verrou.current = true; setEnregistrement(true); setErreur(""); setMessage("");
    try {
      setCompte(await api<Compte>("/compte/profil", { method: "PATCH", body: JSON.stringify({ prenom, nom }) }));
      setMessage("Votre profil est enregistré."); window.dispatchEvent(new Event("studio:credits-updated"));
      if (new URLSearchParams(window.location.search).get("suite") === "photo") router.replace("/app/#nouvelle");
    } catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setEnregistrement(false); }
  }

  async function acheter(nature: "photo" | "video", packs: Pack[], panier: Panier) {
    if (verrou.current) return;
    const articles = articlesDuPanier(packs, panier);
    if (!articles.length) return;
    const signature = `${nature}:${JSON.stringify(articles)}`;
    verrou.current = true; setAchatEnCours(nature); setErreur("");
    if (demande.current?.signature !== signature) demande.current = { signature, cle: crypto.randomUUID() };
    try {
      const resultat = await api<{ url: string | null; statut: string }>("/paiements/checkout", {
        method: "POST", body: JSON.stringify({ articles, cle_demande: demande.current.cle }) });
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

  function modifierPanier(nature: "photo" | "video", pack: string, delta: number) {
    const changer = nature === "photo" ? setPanierPhoto : setPanierVideo;
    changer(courant => {
      const total = Object.values(courant).reduce((somme, quantite) => somme + quantite, 0);
      const prochaine = Math.max(0, Math.min(20, (courant[pack] || 0) + delta));
      if (delta > 0 && total >= 20) return courant;
      const copie = { ...courant, [pack]: prochaine };
      if (!prochaine) delete copie[pack];
      demande.current = null;
      return copie;
    });
  }

  const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const packsPhoto = compte?.packs_photo || compte?.packs || [];
  const packsVideo = compte?.packs_video || [];
  const paiementPhoto = compte?.paiement_photo_disponible ?? compte?.paiement_disponible ?? false;
  const paiementVideo = compte?.paiement_video_disponible ?? false;
  const totalPhoto = totalDuPanier(packsPhoto, panierPhoto), creditsPhoto = creditsDuPanier(packsPhoto, panierPhoto);
  const totalVideo = totalDuPanier(packsVideo, panierVideo), creditsVideo = creditsDuPanier(packsVideo, panierVideo);
  if (billing) return <main className="st-main st-billing">
    <p className="eyebrow">FACTURATION</p><h1>Vos achats et justificatifs.</h1>
    <p className="connected-account-intro">Retrouvez les commandes associées à votre compte. Pour acheter des crédits, ouvrez l’onglet Crédits.</p>
    <Message texte={erreur}/><Message texte={message} ton="info"/>
    <Link className="button dark" href="/app/credits/">Acheter des crédits <ArrowRight size={17}/></Link>
    <section className="st-bill-block" style={{ marginTop: 24 }}><div className="st-block-head"><h2>Historique des achats</h2><span>{achats.length} commande{achats.length > 1 ? "s" : ""}</span></div>
      {achats.length ? <ul className="st-ledger">{achats.map(a => <li key={a.id}><span><strong>{a.credits} crédit{a.credits > 1 ? "s" : ""} {a.nature === "video" ? "vidéo" : "photo"} · {a.statut === "paye" ? "Paiement confirmé" : a.statut === "rembourse" ? "Remboursé" : a.statut === "conteste" ? "Contestation bancaire" : a.statut === "en_attente" ? "En attente" : "Paiement non abouti"}{a.test ? " · Test" : ""}</strong><small>{new Date(a.cree_le).toLocaleDateString("fr-FR")} · Réf. {a.id}</small><PurchaseDocument achat={a}/></span><b>{euros(a.montant_centimes)}</b></li>)}</ul> : <p className="st-empty-line">Aucun achat enregistré pour ce compte.</p>}
      <p className="connected-account-intro">Ouvrez le reçu de chaque paiement confirmé. Si une facture a été émise par Stripe pour votre commande, le bouton ouvre son PDF. Pour toute question, transmettez la référence de la commande au support.</p>
    </section>
    <SupportContact limites={comptePartage.limites}/>
  </main>;
  return <main className="st-main st-billing">
    <p className="eyebrow">{credits ? "ACHETER DES CRÉDITS" : "VOTRE ESPACE PERSONNEL"}</p>
    <h1>{credits ? "Choisissez vos crédits." : "Mon compte"}</h1>
    <p className="connected-account-intro">{credits ? "Les tarifs d’abord, puis vos soldes et vos créations déjà utilisées." : "Vos informations pour retrouver toutes vos créations."}</p>
    <Message texte={erreur}/><Message texte={message} ton="info"/>
    {!credits ? <>
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
      <div className="st-free"><Gift size={22}/><div><strong>{compte?.gratuit_illimite ? "Vos créations sont offertes" : compte?.photo_offerte_disponible ? "Votre première photo est offerte" : "Votre studio vous attend"}</strong><p>Vos photos, vos demandes et leurs différentes versions au même endroit.</p></div><Link className="text-action" href={compte?.gratuit_illimite || compte?.photo_offerte_disponible ? "/app/#nouvelle" : "/app/#creer"}>{compte?.gratuit_illimite ? "Créer gratuitement" : compte?.photo_offerte_disponible ? "Préparer ma photo offerte" : "Créer"} <ArrowRight size={15}/></Link></div>
      <Link className="connected-billing-link text-action" href="/app/credits/">Acheter des crédits <ArrowRight size={15}/></Link>
    </> : <>
      <section className="st-bill-block"><div className="st-block-head"><h2>Packs photo</h2><span>Achat ponctuel, sans abonnement.</span></div>
        <p className="connected-account-intro">Le filigrane protège seulement l’aperçu d’une retouche payante. Une fois la photo gardée, son fichier HD est net et sans filigrane ; vous pouvez le télécharger à nouveau sans second crédit.</p>
        {!paiementPhoto && <p className="connected-account-intro" role="status">Le paiement photo est momentanément indisponible. Votre panier reste modifiable ; aucun débit ne sera effectué.</p>}
        <div className="st-packs">{packsPhoto.map(p => <div className={`st-pack${p.avantage ? " st-pack-featured" : ""}`} key={p.id}>{p.avantage && <em>{p.avantage}</em>}<span>{p.libelle}</span><strong>{euros(p.prix_centimes)}</strong><small>{euros(p.prix_unitaire_centimes)} par photo · sans abonnement</small><div className="connected-pack-quantity" aria-label={`Quantité pour ${p.libelle}`}><button type="button" aria-label={`Retirer un pack ${p.libelle}`} disabled={!panierPhoto[p.id]} onClick={() => modifierPanier("photo", p.id, -1)}>−</button><b>{panierPhoto[p.id] || 0}</b><button type="button" aria-label={`Ajouter un pack ${p.libelle}`} disabled={(Object.values(panierPhoto).reduce((a, b) => a + b, 0)) >= 20} onClick={() => modifierPanier("photo", p.id, 1)}>+</button></div></div>)}</div>
        <div className="connected-cart-summary"><span>{creditsPhoto ? `${creditsPhoto} crédits photo sélectionnés` : "Choisissez un ou plusieurs packs"}</span><strong>{euros(totalPhoto)}</strong><Bouton disabled={!paiementPhoto || !compte?.profil_complet || !creditsPhoto || !!achatEnCours} chargement={achatEnCours === "photo"} onClick={() => acheter("photo", packsPhoto, panierPhoto)}>{paiementPhoto ? "Payer mon panier photo" : "Paiement indisponible"}</Bouton></div>
      </section>
      <section className="st-bill-block"><div className="st-block-head"><h2>Packs vidéo</h2><span>Des crédits séparés pour un prix clair.</span></div>
        <p className="connected-account-intro">En HD 720p, 1 crédit vidéo finance 5 secondes ; en Full HD 1080p, il en faut 2 pour 5 secondes. La qualité et le débit exact sont affichés avant le lancement. Vos crédits restent dans votre solde : un pack de 30 secondes représente 6 crédits, utilisables en plusieurs vidéos de 5 à 30 secondes. Un nouvel essai consomme de nouveaux crédits ; revoir et télécharger une vidéo terminée n’en utilise pas. Les crédits photo restent séparés.</p>
        {!paiementVideo && <p className="connected-account-intro" role="status">Le paiement vidéo est momentanément indisponible. Votre panier reste modifiable ; aucun débit ne sera effectué.</p>}
        <div className="st-packs st-packs-video">{packsVideo.map(p => <div className={`st-pack${p.avantage ? " st-pack-featured" : ""}`} key={p.id}>{p.avantage && <em>{p.avantage}</em>}<span>{p.libelle}</span><strong>{euros(p.prix_centimes)}</strong><small>{p.credits} crédit{p.credits > 1 ? "s" : ""} vidéo · {euros(p.prix_unitaire_centimes)} les 5 secondes en 720p</small><div className="connected-pack-quantity" aria-label={`Quantité pour ${p.libelle}`}><button type="button" aria-label={`Retirer un pack ${p.libelle}`} disabled={!panierVideo[p.id]} onClick={() => modifierPanier("video", p.id, -1)}>−</button><b>{panierVideo[p.id] || 0}</b><button type="button" aria-label={`Ajouter un pack ${p.libelle}`} disabled={(Object.values(panierVideo).reduce((a, b) => a + b, 0)) >= 20} onClick={() => modifierPanier("video", p.id, 1)}>+</button></div></div>)}</div>
        <div className="connected-cart-summary"><span>{creditsVideo ? `${creditsVideo * 5} secondes de crédits sélectionnées` : "Choisissez un ou plusieurs packs"}</span><strong>{euros(totalVideo)}</strong><Bouton disabled={!paiementVideo || !compte?.profil_complet || !creditsVideo || !!achatEnCours} chargement={achatEnCours === "video"} onClick={() => acheter("video", packsVideo, panierVideo)}>{paiementVideo ? "Payer mon panier vidéo" : "Paiement indisponible"}</Bouton></div>
      </section>
      <div className="st-bill-top">
        <div className="st-balance"><span>{compte?.gratuit_illimite ? "Votre compte" : "Crédits photo"}</span><strong>{compte?.gratuit_illimite ? "Offert" : compte?.solde ?? "…"}{!compte?.gratuit_illimite && <small>crédits</small>}</strong><p>{compte?.gratuit_illimite ? "Même atelier que les clients, sans débit pour vos photos et corrections." : "1 crédit pour garder une photo en HD sans filigrane, ou pour ajouter une correction."}</p><span className="connected-video-balance">{compte?.gratuit_illimite ? "Vos clips vidéo sont aussi offerts sur votre compte." : <>Crédits vidéo : <b>{compte?.solde_video ?? 0}</b> · jusqu’à {(compte?.solde_video ?? 0) * 5} secondes en HD 720p, à utiliser en plusieurs vidéos</>}</span></div>
        {!compte?.gratuit_illimite && !compte?.photo_offerte_telechargee && <div className="st-free"><Gift size={22}/><div><strong>{compte?.photo_offerte_disponible ? "1 photo offerte" : "Votre photo offerte vous attend"}</strong><p>{compte?.photo_offerte_disponible ? "Créez votre première retouche et téléchargez-la gratuitement." : "Votre photo est ajoutée, mais sa version offerte n’a pas encore été téléchargée."}</p></div><Link className="text-action" href={compte?.photo_offerte_disponible ? "/app/#nouvelle" : "/app/"}>{compte?.photo_offerte_disponible ? "Créer ma retouche" : "Terminer ma photo"} <ArrowRight size={15}/></Link></div>}
      </div>
      <section className="st-bill-block"><div className="st-block-head"><h2>Vos créations depuis le dernier achat</h2></div><CreationLimits limites={comptePartage.limites}/><CreationLimits limites={comptePartage.limites} kind="video"/><p className="connected-account-intro">Une première génération et une correction sont incluses par photo. {compte?.gratuit_illimite ? "Vos corrections supplémentaires et vos clips vidéo sont offerts." : "Chaque correction supplémentaire nécessite 1 crédit photo. Une vidéo utilise les crédits vidéo annoncés avant son lancement."}</p></section>
      <section className="st-bill-block"><div className="st-block-head"><h2><History size={18}/> Historique</h2><span>{compte?.registre.length || 0} opérations</span></div>
        {(compte?.registre.length || compte?.registre_video?.length) ? <ul className="st-ledger">{[...(compte?.registre || []).map(m => ({...m, nature: "photo" as const})), ...(compte?.registre_video || []).map(m => ({...m, nature: "video" as const}))].sort((a, b) => Date.parse(b.le) - Date.parse(a.le)).map((m, i) => <li key={`${m.nature}-${m.le}-${i}`}><span><strong>{m.motif}</strong><small>{new Date(m.le).toLocaleDateString("fr-FR")}</small></span><b className={m.delta < 0 ? "debit" : ""}>{m.delta > 0 ? "+" : ""}{m.delta} crédit{Math.abs(m.delta) > 1 ? "s" : ""} {m.nature}</b></li>)}</ul> : <p className="st-empty-line">Aucun crédit utilisé pour l’instant.</p>}
      </section>
      <div className="st-bill-rules"><p><Download size={17}/> Les téléchargements d’une version HD déjà obtenue restent gratuits.</p><p><ShieldCheck size={17}/> {compte?.paiement_disponible ? "Paiement sécurisé par Stripe." : "Aucun prélèvement automatique."}</p></div>
    </>}
    <SupportContact limites={comptePartage.limites}/>
  </main>;
}

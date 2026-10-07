"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, FolderOpen, Info, LogOut, Menu, Plus, ShieldCheck, UserRound, Wallet, X } from "lucide-react";
import { Brand } from "../demo/studio-parts";
import { StudioAccount } from "@/components/studio-account";
import { CreditDialog } from "@/components/credit-dialog";
import { api, ErreurApi, jeton, poserJeton, type Compte, type Sante } from "@/lib/api";
import "../demo/studio.css";
import "../demo/workspace.css";
import "../demo/studio-screens.css";
import "./studio-connected.css";

const tools = ["creer", "nouvelle", "importer", "creer-image", "video-photos", "visite"];
const titles: Record<string, string> = { creer: "Créer", nouvelle: "Retoucher une photo", importer: "Mon annonce", "creer-image": "Créer une image", "video-photos": "Vidéo → photos", visite: "Photos → vidéo", credits: "Crédits", facturation: "Facturation", compte: "Mon compte", photo: "Votre photo", logement: "Mes créations", admin: "Administration" };

export default function ConnectedLayoutClient({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const chemin = usePathname();
  const [sante, setSante] = useState<Sante | null>(null);
  const [compte, setCompte] = useState<Compte | null>(null);
  const [erreurCompte, setErreurCompte] = useState("");
  const [hash, setHash] = useState("");
  const [menu, setMenu] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const [creditDialog, setCreditDialog] = useState(false);
  const [creditNature, setCreditNature] = useState<"photo" | "video">("photo");
  const route = chemin.replace(/\/$/, "").split("/").at(-1) || "app";
  const screen = route === "app" ? hash.split("/")[0] || "studio" : route;
  const creating = tools.includes(screen);

  useEffect(() => {
    const read = () => { setHash(window.location.hash.slice(1)); setMenu(false); };
    queueMicrotask(read);
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => { window.removeEventListener("hashchange", read); window.removeEventListener("popstate", read); };
  }, [chemin]);

  useEffect(() => {
    if (!compte?.role) return;
    for (const destination of ["/app/", "/app/photo/", "/app/logement/", "/app/compte/", "/app/credits/", "/app/facturation/", ...(compte.role === "proprietaire" || compte.role === "admin" ? ["/app/admin/"] : [])]) {
      routeur.prefetch(destination);
    }
  }, [compte?.role, routeur]);

  useEffect(() => {
    if (!/Android|iPhone|iPod|iPad/i.test(navigator.userAgent) || chemin.startsWith("/app/admin")) return;
    const destination = chemin.replace(/\/$/, "").split("/").at(-1) || "app";
    const mobileScreen = destination === "app" ? window.location.hash.slice(1).split("/")[0] : destination;
    const routeMobile: Record<string, string> = { nouvelle: "nouvelle", visite: "visite", "video-photos": "video-photos", "creer-image": "creer-image", creer: "creer", compte: "compte", credits: "credits", facturation: "facturation", photo: "retouche", importer: "nouvelle" };
    const params = new URLSearchParams(window.location.search);
    if (mobileScreen === "photo" && params.has("id")) params.set("mode", "compte");
    if (mobileScreen === "importer" && params.get("suite") === "video") params.set("retour", "visite");
    const cible = routeMobile[mobileScreen] || "";
    window.location.replace(`/mobile/${cible ? `${cible}/` : ""}${params.size ? `?${params}` : ""}`);
  }, [chemin]);

  useEffect(() => {
    // Le studio mobile vérifie lui-même la session et les crédits : évitons deux appels avant d'y entrer.
    if (/Android|iPhone|iPod|iPad/i.test(navigator.userAgent) && !window.location.pathname.startsWith("/app/admin")) return;
    if (!jeton()) { routeur.replace("/se-connecter/"); return; }
    let annule = false;
    const actualiserSante = () => {
      api<Sante>("/sante").then(v => { if (!annule) setSante(v); }).catch(() => {
        if (!annule) setSante(null);
      });
    };
    const actualiser = () => {
      actualiserSante();
      api<Compte>("/compte").then(valeur => {
        if (annule) return;
        setErreurCompte(""); setCompte(valeur);
        if (!valeur.profil_complet && !window.location.pathname.startsWith("/app/compte")) routeur.replace(window.location.hash === "#nouvelle" ? "/app/compte/?suite=photo" : "/app/compte/");
      }).catch((erreur: ErreurApi) => {
        if (annule) return;
        if (erreur.statut === 401) { poserJeton(null); routeur.replace("/se-connecter/"); }
        else setErreurCompte("Votre compte ne peut pas être chargé pour le moment.");
      });
    };
    actualiser();
    window.addEventListener("studio:credits-updated", actualiser);
    window.addEventListener("focus", actualiser);
    return () => { annule = true; window.removeEventListener("studio:credits-updated", actualiser); window.removeEventListener("focus", actualiser); };
  }, [routeur]);

  useEffect(() => {
    if (!compte) return;
    const nature = ["visite", "video-photos"].includes(screen) || (screen === "importer" && new URLSearchParams(window.location.search).get("suite") === "video") ? "video" : "photo";
    const creation = ["nouvelle", "creer-image", "visite", "video-photos", "importer"].includes(screen);
    const disponible = compte.gratuit_illimite || (nature === "photo" ? compte.photo_offerte_disponible || compte.solde > 0 : compte.solde_video > 0);
    if (creation && !disponible) {
      queueMicrotask(() => { setCreditNature(nature); setCreditDialog(true); });
      if (window.location.pathname.replace(/\/$/, "") === "/app") window.location.hash = "creer";
      else routeur.replace("/app/#creer");
    }
  }, [compte, screen, routeur]);

  function nav(destination: string) {
    setMenu(false);
    if (chemin.replace(/\/$/, "") === "/app" && (destination === "/app/" || destination.startsWith("/app/#"))) {
      window.location.hash = destination.split("#")[1] || "";
    } else {
      routeur.push(destination);
    }
    window.scrollTo({ top: 0 });
  }

  async function deconnecter() {
    if (deconnexionEnCours) return;
    setDeconnexionEnCours(true);
    try { await api("/auth/deconnexion", { method: "POST" }); poserJeton(null); routeur.replace("/se-connecter/"); }
    catch { setErreurCompte("La déconnexion n’a pas abouti. Réessayez pour fermer votre session."); }
    finally { setDeconnexionEnCours(false); }
  }

  return <div className="studio-demo connected-studio">
    <div className="workspace studio-workspace">
      {menu && <button className="sidebar-scrim" aria-label="Fermer le menu" onClick={() => setMenu(false)}/>}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <Brand onClick={() => nav("/")}/>
        <button className="close-menu icon-button" aria-label="Fermer le menu" onClick={() => setMenu(false)}><X/></button>
        <div className="sidebar-section-label">VOTRE ESPACE</div>
        <nav aria-label="Navigation du studio">
          <button className={`nav-create ${creating ? "active" : ""}`} aria-current={creating ? "page" : undefined} onClick={() => nav("/app/#creer")}><Plus size={19}/> Créer</button>
          <button className={["studio", "photo", "logement"].includes(screen) ? "active" : ""} aria-current={["studio", "photo", "logement"].includes(screen) ? "page" : undefined} onClick={() => nav("/app/")}><FolderOpen size={19}/> Mes créations</button>
          <button className={screen === "credits" ? "active" : ""} aria-current={screen === "credits" ? "page" : undefined} onClick={() => nav("/app/credits/")}><Wallet size={19}/> Crédits</button>
          <button className={screen === "facturation" ? "active" : ""} aria-current={screen === "facturation" ? "page" : undefined} onClick={() => nav("/app/facturation/")}><Wallet size={19}/> Facturation</button>
          <button className={screen === "compte" ? "active" : ""} aria-current={screen === "compte" ? "page" : undefined} onClick={() => nav("/app/compte/")}><UserRound size={19}/> Mon compte</button>
          {compte && ["proprietaire", "admin"].includes(compte.role) && <button className={screen === "admin" ? "active" : ""} aria-current={screen === "admin" ? "page" : undefined} onClick={() => nav("/app/admin/")}><ShieldCheck size={19}/> Administration</button>}
        </nav>
        <div className="studio-sidebar-note"><ShieldCheck size={19}/><p>Votre espace à vous.<small>Vos photos et leurs versions, retrouvées dans votre compte.</small></p></div>
        <div className="sidebar-bottom">
          {compte && <button className="connected-identity" onClick={() => nav("/app/compte/")}><span>{(compte.prenom || "M").slice(0, 1)}</span><strong>{compte.prenom || "Mon compte"}<small>Mon espace personnel</small></strong></button>}
          <Link className="studio-help-link" href="/aide/">Une question ? Consulter l’aide</Link>
          <button className="back-site" onClick={() => nav("/")}><ArrowLeft size={15}/> Retour au site</button>
          <button className="connected-logout" disabled={deconnexionEnCours} onClick={deconnecter}><LogOut size={15}/> {deconnexionEnCours ? "Déconnexion…" : "Se déconnecter"}</button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <button className="mobile-menu icon-button" onClick={() => setMenu(!menu)} aria-label="Ouvrir le menu" aria-expanded={menu}><Menu/></button>
          <div className="breadcrumb"><button onClick={() => nav(creating ? "/app/#creer" : "/app/")}>{creating ? "Créer" : "Mon studio"}</button><ChevronRight size={13}/><strong>{titles[screen] || "Mes créations"}</strong></div>
          <button className="workspace-credit" aria-label="Voir les offres et acheter des crédits" onClick={() => nav("/app/credits/")}><span className="status-dot"/>{compte?.gratuit_illimite ? "Créations offertes" : compte ? `${compte.solde} crédit${compte.solde > 1 ? "s" : ""}` : "…"}{compte?.photo_offerte_disponible && !compte.gratuit_illimite && <span className="connected-gift">+ 1 photo offerte</span>}</button>
        </header>
        {erreurCompte && <div className="connected-service" role="alert"><Info size={17}/><p>{erreurCompte}</p><button className="text-action" onClick={() => window.dispatchEvent(new Event("studio:credits-updated"))}>Réessayer</button></div>}
        {compte ? <StudioAccount.Provider key={compte.id} value={{ compte, sante, screen }}>{children}</StudioAccount.Provider> : !erreurCompte && <main className="st-main"><p role="status">Ouverture de votre studio…</p></main>}
        <CreditDialog open={creditDialog} onClose={() => setCreditDialog(false)} nature={creditNature} paiementDisponible={creditNature === "video" ? !!compte?.paiement_video_disponible : !!compte?.paiement_photo_disponible}/>
      </div>
    </div>
  </div>;
}

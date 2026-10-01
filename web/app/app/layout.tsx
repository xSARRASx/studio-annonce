"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, FolderOpen, Info, LogOut, Menu, Plus, ShieldCheck, UserRound, Wallet, X } from "lucide-react";
import { Brand } from "../demo/studio-parts";
import { StudioAccount } from "@/components/studio-account";
import { api, ErreurApi, jeton, poserJeton, type Compte, type Sante } from "@/lib/api";
import "../demo/studio.css";
import "../demo/workspace.css";
import "../demo/studio-screens.css";
import "./studio-connected.css";

const tools = ["creer", "nouvelle", "importer", "creer-image", "video-photos", "visite"];
const titles: Record<string, string> = { creer: "Créer", nouvelle: "Retoucher une photo", importer: "Mon annonce", "creer-image": "Créer une image", "video-photos": "Vidéo → photos", visite: "Photos → vidéo", facturation: "Facturation", compte: "Mon compte", photo: "Votre photo", logement: "Mes créations", admin: "Administration" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const chemin = usePathname();
  const [sante, setSante] = useState<Sante | null>(null);
  const [compte, setCompte] = useState<Compte | null>(null);
  const [erreurCompte, setErreurCompte] = useState("");
  const [hash, setHash] = useState("");
  const [menu, setMenu] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const route = chemin.replace(/\/$/, "").split("/").at(-1) || "app";
  const screen = route === "app" ? hash.split("/")[0] || "studio" : route;
  const creating = tools.includes(screen);

  useEffect(() => {
    const read = () => { setHash(window.location.hash.slice(1)); setMenu(false); };
    queueMicrotask(read);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [chemin]);

  useEffect(() => {
    if (!jeton()) { routeur.replace("/connexion/"); return; }
    let annule = false;
    const actualiser = () => {
      api<Compte>("/compte").then(valeur => {
        if (annule) return;
        setErreurCompte(""); setCompte(valeur);
        if (!valeur.profil_complet && !chemin.startsWith("/app/compte")) routeur.replace(window.location.hash === "#nouvelle" ? "/app/compte/?suite=photo" : "/app/compte/");
      }).catch((erreur: ErreurApi) => {
        if (annule) return;
        if (erreur.statut === 401) { poserJeton(null); routeur.replace("/connexion/"); }
        else setErreurCompte("Votre compte ne peut pas être chargé pour le moment.");
      });
    };
    actualiser();
    api<Sante>("/sante").then(v => { if (!annule) setSante(v); }).catch(() => {});
    window.addEventListener("studio:credits-updated", actualiser);
    window.addEventListener("focus", actualiser);
    return () => { annule = true; window.removeEventListener("studio:credits-updated", actualiser); window.removeEventListener("focus", actualiser); };
  }, [routeur, chemin]);

  function nav(destination: string) {
    setMenu(false);
    if (chemin.replace(/\/$/, "") === "/app" && (destination === "/app/" || destination.startsWith("/app/#"))) {
      window.location.hash = destination.split("#")[1] || "";
    } else routeur.push(destination);
    window.scrollTo({ top: 0 });
  }

  async function deconnecter() {
    if (deconnexionEnCours) return;
    setDeconnexionEnCours(true);
    try { await api("/auth/deconnexion", { method: "POST" }); poserJeton(null); routeur.replace("/connexion/"); }
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
          <button className="workspace-credit" aria-label={compte?.photo_offerte_disponible ? "Préparer ma photo offerte" : "Voir mes crédits"} onClick={() => nav(compte?.photo_offerte_disponible ? "/app/#nouvelle" : "/app/facturation/")}><span className="status-dot"/>{compte ? `${compte.solde} crédit${compte.solde > 1 ? "s" : ""}` : "…"}{compte?.photo_offerte_disponible && <span className="connected-gift">+ 1 photo offerte</span>}</button>
        </header>
        {erreurCompte && <div className="connected-service" role="alert"><Info size={17}/><p>{erreurCompte}</p><button className="text-action" onClick={() => window.dispatchEvent(new Event("studio:credits-updated"))}>Réessayer</button></div>}
        {compte ? <StudioAccount.Provider key={compte.id} value={{ compte, sante, screen }}>{children}</StudioAccount.Provider> : !erreurCompte && <main className="st-main"><p role="status">Ouverture de votre studio…</p></main>}
      </div>
    </div>
  </div>;
}

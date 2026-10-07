"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Smartphone } from "lucide-react";
import "./preview.css";

// Adresse de l'appli mobile en version web : le serveur Expo local, ou la copie publiée à côté du site.
const APPLI_MOBILE = (process.env.NEXT_PUBLIC_MOBILE_URL || "https://studioannonce.fr/mobile").replace(/\/$/, "");

export default function MobilePreview() {
  const [device, setDevice] = useState<"iphone" | "android">("iphone");
  return <main className="mobile-preview-shell">
    <Link className="preview-back" href="/"><ArrowLeft size={16}/> Retour au site</Link>
    <section className="preview-intro">
      <p className="preview-kicker">STUDIO ANNONCE · APPLICATION</p>
      <h1>Votre studio.<br/><em>Dans votre poche.</em></h1>
      <p className="preview-description">Ajoutez une photo, retrouvez vos projets et comparez toutes vos versions.</p>
      <div className="device-switch" role="group" aria-label="Format de l’aperçu">
        <button aria-pressed={device === "iphone"} onClick={() => setDevice("iphone")}><Smartphone size={16}/> iPhone</button>
        <button aria-pressed={device === "android"} onClick={() => setDevice("android")}><Smartphone size={16}/> Android</button>
      </div>
      <p className="preview-explainer">Touchez l’écran pour essayer.<br/>Connectez-vous avec le même compte que sur le site.</p>
      <a className="preview-open" href={`${APPLI_MOBILE}/`} target="_blank" rel="noreferrer">Ouvrir l’app en grand <ArrowUpRight size={16}/></a>
      <p className="preview-disclosure">Application mobile accessible dans le navigateur, sans installation. Retrouvez le même compte, vos créations et vos crédits. La disponibilité de chaque création et du paiement est indiquée dans votre espace.</p>
    </section>
    <div className={`phone-shell ${device}`}>
      <iframe title="Studio Annonce — aperçu de l’application mobile" src={`${APPLI_MOBILE}/`} allow="camera"/>
    </div>
  </main>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Smartphone } from "lucide-react";
import "./preview.css";

// Adresse de l'appli mobile en version web : le serveur Expo local, ou la copie publiée à côté du site.
const APPLI_MOBILE = process.env.NEXT_PUBLIC_MOBILE_URL || "http://127.0.0.1:8173";

export default function MobilePreview() {
  const [device, setDevice] = useState<"iphone" | "android">("iphone");
  return <main className="mobile-preview-shell">
    <Link className="preview-back" href="/demo/#studio"><ArrowLeft size={16}/> Retour au studio</Link>
    <section className="preview-intro">
      <p className="preview-kicker">STUDIO ANNONCE · APPLICATION</p>
      <h1>Votre studio.<br/><em>Dans votre poche.</em></h1>
      <p className="preview-description">Ajoutez une photo, retrouvez vos projets et comparez toutes vos versions.</p>
      <div className="device-switch" role="group" aria-label="Format de l’aperçu">
        <button aria-pressed={device === "iphone"} onClick={() => setDevice("iphone")}><Smartphone size={16}/> iPhone</button>
        <button aria-pressed={device === "android"} onClick={() => setDevice("android")}><Smartphone size={16}/> Android</button>
      </div>
      <p className="preview-explainer">Touchez l’écran pour essayer.<br/>Vos essais sont conservés dans cet aperçu.</p>
      <a className="preview-open" href={`${APPLI_MOBILE}/atelier`} target="_blank" rel="noreferrer">Ouvrir l’app en grand <ArrowUpRight size={16}/></a>
      <p className="preview-disclosure">Aperçu interactif, sans installation. La génération IA et les paiements restent à connecter.</p>
    </section>
    <div className={`phone-shell ${device}`}>
      <iframe title="Studio Annonce — aperçu de l’application mobile" src={`${APPLI_MOBILE}/atelier`} allow="camera"/>
    </div>
  </main>;
}

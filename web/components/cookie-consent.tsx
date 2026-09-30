"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, Settings2, X } from "lucide-react";

const CLE = "studioannonce:consentement-cookies:v1";
const SIX_MOIS = 180 * 24 * 60 * 60 * 1000;

type Choix = "acceptes" | "refuses";
type Consentement = { choix: Choix; choisiLe: string; expireLe: number };

function lireChoix(): Choix | null {
  try {
    const valeur = JSON.parse(localStorage.getItem(CLE) || "null") as Consentement | null;
    if (!valeur || valeur.expireLe <= Date.now() || !["acceptes", "refuses"].includes(valeur.choix)) {
      localStorage.removeItem(CLE);
      return null;
    }
    return valeur.choix;
  } catch {
    localStorage.removeItem(CLE);
    return null;
  }
}

function enregistrer(choix: Choix) {
  const maintenant = Date.now();
  const consentement: Consentement = { choix, choisiLe: new Date(maintenant).toISOString(), expireLe: maintenant + SIX_MOIS };
  localStorage.setItem(CLE, JSON.stringify(consentement));
  window.dispatchEvent(new CustomEvent("studio:consentement-cookies", { detail: { choix } }));
}

export function cookiesOptionnelsAcceptes() {
  if (typeof window === "undefined") return false;
  return lireChoix() === "acceptes";
}

export function CookieConsent() {
  const [pret, setPret] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);

  useEffect(() => {
    const animation = window.requestAnimationFrame(() => {
      const actuel = lireChoix();
      setChoix(actuel);
      setOuvert(!actuel);
      setPret(true);
    });
    return () => window.cancelAnimationFrame(animation);
  }, []);

  function choisir(valeur: Choix) {
    enregistrer(valeur);
    setChoix(valeur);
    setOuvert(false);
  }

  if (!pret) return null;
  if (!ouvert) return (
    <button className="sa-consent-settings" type="button" onClick={() => setOuvert(true)} aria-label="Modifier mes choix de cookies">
      <Settings2 size={15} aria-hidden="true" /> Cookies
    </button>
  );

  return <div className="sa-consent-layer" role="presentation">
    <section className="sa-consent-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description">
      {choix && <button className="sa-consent-close" type="button" onClick={() => setOuvert(false)} aria-label="Fermer les réglages des cookies"><X size={18}/></button>}
      <span className="sa-consent-icon"><Cookie size={21} aria-hidden="true" /></span>
      <div className="sa-consent-text">
        <h2 id="cookie-title">Vos choix de cookies</h2>
        <p id="cookie-description">Les éléments indispensables gardent votre session et vos préférences. Les cookies optionnels servent uniquement à mesurer l’audience et améliorer Studio Annonce ; ils restent désactivés sans votre accord.</p>
        <Link href="/confidentialite/">En savoir plus et gérer vos données</Link>
      </div>
      <div className="sa-consent-actions">
        <button type="button" onClick={() => choisir("refuses")}>Tout refuser</button>
        <button type="button" onClick={() => choisir("acceptes")}>Tout accepter</button>
      </div>
    </section>
  </div>;
}

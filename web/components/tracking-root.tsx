"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CONSENT_CHANGED, CONSENT_KEY, CONSENT_PREFERENCES, initializeTracking, pageNavigation, readConsent, setConsent, revokeAttribution } from "../../shared/tracking";
import { API, jeton } from "@/lib/api";
import "./tracking.css";

export function TrackingRoot() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    initializeTracking();
    const update = () => { setVisible(readConsent() === null); if (readConsent()?.accepte === false) void revokeAttribution({ base: API, token: jeton, support: 'site' }); };
    const open = () => setVisible(true);
    const storage = (event: StorageEvent) => { if (event.key === CONSENT_KEY) window.location.reload(); };
    update();
    window.addEventListener(CONSENT_CHANGED, update);
    window.addEventListener(CONSENT_PREFERENCES, open);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(CONSENT_CHANGED, update); window.removeEventListener(CONSENT_PREFERENCES, open); window.removeEventListener('storage', storage); };
  }, []);
  useEffect(() => {
    const navigate = () => pageNavigation(pathname, 'site');
    navigate(); window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, [pathname]);
  if (!visible) return null;
  return <section className="sa-consent" role="region" aria-label="Choisir vos cookies">
    <strong>Vos cookies, votre choix.</strong>
    <p>Avec votre accord, Google Analytics et Google Ads mesurent les visites, inscriptions et achats. Google Ads peut utiliser votre email sous forme hachée pour relier une conversion à une publicité. Vous pouvez refuser et continuer à utiliser le studio.</p>
    <div><button type="button" onClick={() => setConsent(true)}>Tout accepter</button><button type="button" onClick={() => setConsent(false)}>Tout refuser</button></div>
    <Link href="/cookies/">Comprendre les cookies et changer mon choix</Link>
  </section>;
}

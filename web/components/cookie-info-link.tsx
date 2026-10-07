"use client";
import { Cookie } from "lucide-react";
import { openPreferences } from "../../shared/tracking";

export function CookieInfoLink() {
  return <button type="button" className="sa-cookie-info-link" onClick={openPreferences}>
    <Cookie size={15} aria-hidden="true" /> Gérer mes cookies
  </button>;
}

export function CookiePreferencesLink() {
  return <button type="button" onClick={openPreferences} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0, textAlign: 'left' }}>Gérer mes cookies</button>;
}

import { Info, Mail, MessageCircle } from "lucide-react";
import type { LimitesCreation } from "@/lib/api";

function supportHref(value: string | undefined) {
  if (!value) return null;
  try { const url = new URL(value); return ["https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function SupportContact({ limites }: { limites?: LimitesCreation }) {
  const whatsapp = supportHref(limites?.support_url) || "https://wa.me/33634972693";
  const email = limites?.support_email?.trim() || "contact@studioannonce.fr";
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : "mailto:contact@studioannonce.fr";
  return <section className="st-bill-block connected-support" aria-labelledby="support-title">
    <div className="st-block-head"><h2 id="support-title">Besoin d’aide ?</h2></div>
    <p className="connected-account-intro">Une question sur votre compte, une retouche ou vos crédits ? Retrouvez-nous sur WhatsApp ou par email.</p>
    <div className="connected-support-actions"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true"/>Contacter le support</a><a href={emailHref}><Mail size={17} aria-hidden="true"/>Envoyer un email</a></div>
    <p className="connected-account-intro">{limites?.support_telephone || "06 34 97 26 93"} · {email}</p>
  </section>;
}

export function CreationLimits({ limites, kind = "photo", compact = false }: { limites?: LimitesCreation; kind?: "photo" | "video"; compact?: boolean }) {
  if (!limites?.[kind]) return null;
  const count = limites[kind];
  const href = supportHref(limites.support_url);
  const phone = limites.support_telephone?.trim();
  const email = limites.support_email?.trim();
  const emailHref = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  const phoneHref = phone && /^\+?[\d ()-]{5,25}$/.test(phone) ? `tel:${phone.replace(/[ ()-]/g, "")}` : null;
  return <div className={`creation-limits${count.bloque ? " is-blocked" : ""}${compact ? " compact" : ""}`} role={count.bloque ? "status" : undefined}>
    <Info size={17} aria-hidden="true"/><div>
      <strong>{kind === "video" && limites.proprietaire ? "Vos vidéos sont offertes sur ce compte" : count.bloque ? "Limite d’essais atteinte" : `${count.restantes} création${count.restantes > 1 ? "s" : ""} ${kind === "photo" ? "photo" : "vidéo"} restante${count.restantes > 1 ? "s" : ""}`}</strong>
      <p>{kind === "video" && limites.proprietaire ? "Vous pouvez préparer et enregistrer autant de brouillons que vous le souhaitez. Un projet vidéo commence uniquement après votre confirmation, et peut réunir jusqu’à 6 photos. Pendant les essais, vous pouvez lancer jusqu’à 5 projets par logement sur 24 heures. Chaque nouveau lancement compte, même si vous ne téléchargez pas le résultat." : count.bloque ? "Les nouvelles créations sont en pause. Contactez le support pour les débloquer. Vos fichiers déjà achetés restent accessibles." : `${count.utilisees} sur ${count.limite} depuis votre dernier achat ${kind === "photo" ? "photo" : "vidéo"}. Une création correspond à une nouvelle génération ou correction réalisée par l’IA. Ce plafond d’essais est distinct de votre solde de crédits : il ne signifie pas que tous les téléchargements sont offerts. Importer des photos, enregistrer un brouillon ou télécharger à nouveau un fichier déjà acquis ne consomme pas de nouvel essai. Le compteur est partagé entre le site et l’application mobile.`}</p>
      {!(kind === "video" && limites.proprietaire) && <p>Un achat du pack correspondant ou un déblocage par le support remet ce compteur à zéro. À la limite, vos fichiers déjà acquis restent accessibles.</p>}
      {count.bloque && <div className="creation-limits-contact">{href && <a href={href}>Contacter le support</a>}{phoneHref && <a href={phoneHref}>{phone}</a>}{emailHref && <a href={emailHref}>Envoyer un email</a>}{!href && !phoneHref && !emailHref && <a href="/demo/aide/">Consulter l’aide</a>}</div>}
    </div>
  </div>;
}

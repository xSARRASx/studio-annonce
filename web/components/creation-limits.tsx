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
  if (limites.proprietaire) return <div className={`creation-limits${compact ? " compact" : ""}`}><Info size={17} aria-hidden="true"/><div><strong>Créations {kind === "photo" ? "photo" : "vidéo"} offertes sur ce compte administrateur</strong><p>Vous pouvez créer sans crédits client. Les appels aux fournisseurs restent facturés à Studio Annonce ; une seule opération sur la même création peut être en cours à la fois.</p></div></div>;
  const href = supportHref(limites.support_url);
  const phone = limites.support_telephone?.trim();
  const email = limites.support_email?.trim();
  const emailHref = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  const phoneHref = phone && /^\+?[\d ()-]{5,25}$/.test(phone) ? `tel:${phone.replace(/[ ()-]/g, "")}` : null;
  return <div className={`creation-limits${count.bloque ? " is-blocked" : ""}${compact ? " compact" : ""}`} role={count.bloque ? "status" : undefined}>
    <Info size={17} aria-hidden="true"/><div>
      <strong>{count.bloque ? "Limite d’essais atteinte" : `${count.restantes} création${count.restantes > 1 ? "s" : ""} ${kind === "photo" ? "photo" : "vidéo"} restante${count.restantes > 1 ? "s" : ""}`}</strong>
      {compact && !count.bloque ? <><p>Chaque génération ou correction utilise un essai. Vos crédits sont comptés séparément.</p><details><summary>Comprendre ce compteur</summary><p>{count.utilisees} essai{count.utilisees > 1 ? "s" : ""} utilisé{count.utilisees > 1 ? "s" : ""} sur {count.limite} depuis votre dernier achat {kind === "photo" ? "photo" : "vidéo"}. Importer des photos, enregistrer un brouillon et retélécharger un fichier acquis ne consomment pas d’essai. Le compteur est partagé entre le site et l’application mobile. L’achat d’un pack ou un déblocage par le support le remet à zéro.</p></details></> : <>
        <p>{count.bloque ? "Les nouvelles créations sont en pause. Contactez le support pour les débloquer. Vos fichiers déjà achetés restent accessibles." : `${count.utilisees} sur ${count.limite} depuis votre dernier achat ${kind === "photo" ? "photo" : "vidéo"}. Une création correspond à une nouvelle génération ou correction réalisée par l’IA. Ce plafond d’essais est distinct de votre solde de crédits : il ne signifie pas que tous les téléchargements sont offerts. Importer des photos, enregistrer un brouillon ou télécharger à nouveau un fichier déjà acquis ne consomme pas de nouvel essai. Le compteur est partagé entre le site et l’application mobile.`}</p>
        <p>Un achat du pack correspondant ou un déblocage par le support remet ce compteur à zéro. À la limite, vos fichiers déjà acquis restent accessibles.</p>
      </>}
      {count.bloque && <div className="creation-limits-contact">{href && <a href={href}>Contacter le support</a>}{phoneHref && <a href={phoneHref}>{phone}</a>}{emailHref && <a href={emailHref}>Envoyer un email</a>}{!href && !phoneHref && !emailHref && <a href="/demo/aide/">Consulter l’aide</a>}</div>}
    </div>
  </div>;
}

"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { API, api, jeton, poserJeton, type Sante } from "@/lib/api";
import { Bouton, Champ, Message } from "@/components/ui";

export default function Connexion() {
  const routeur = useRouter();
  const verrou = useRef(false);
  const [etape, setEtape] = useState<"identite" | "code">("identite");
  const [inscription, setInscription] = useState(true);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [service, setService] = useState<Sante | null>(null);
  const [indisponible, setIndisponible] = useState(false);
  const [renvoiDans, setRenvoiDans] = useState(0);
  const [confirmationEnvoi, setConfirmationEnvoi] = useState("");
  useEffect(() => { if (jeton()) routeur.replace("/app/"); }, [routeur]);
  useEffect(() => {
    const controle = new AbortController();
    fetch(`${API}/sante`, { cache: "no-store", signal: controle.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setService).catch(() => { if (!controle.signal.aborted) setIndisponible(true); });
    return () => controle.abort();
  }, []);
  useEffect(() => {
    if (!renvoiDans) return;
    const minuteur = window.setTimeout(() => setRenvoiDans(valeur => Math.max(0, valeur - 1)), 1000);
    return () => window.clearTimeout(minuteur);
  }, [renvoiDans]);

  async function demanderCode() {
    await api("/auth/code", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
    setEtape("code");
    setCode("");
    setRenvoiDans(30);
    setConfirmationEnvoi(`Un code vient d’être envoyé par no-reply@studioannonce.fr à ${email.trim()}.`);
  }

  async function envoyer(event: React.FormEvent) {
    event.preventDefault();
    if (verrou.current) return;
    verrou.current = true; setChargement(true); setErreur("");
    try {
      if (etape === "identite") {
        await demanderCode();
      } else {
        const r = await api<{ jeton: string; profil_complet: boolean }>("/auth/verifier", {
          method: "POST", body: JSON.stringify({ email: email.trim(), code }) });
        poserJeton(r.jeton);
        if (!r.profil_complet && inscription) {
          try {
            await api("/compte/profil", { method: "PATCH", body: JSON.stringify({ prenom, nom }) });
          } catch { routeur.replace("/app/compte/"); return; }
        }
        routeur.replace(r.profil_complet || inscription ? "/app/" : "/app/compte/");
      }
    } catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setChargement(false); }
  }

  async function renvoyer() {
    if (verrou.current || renvoiDans) return;
    verrou.current = true; setChargement(true); setErreur(""); setConfirmationEnvoi("");
    try { await demanderCode(); }
    catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setChargement(false); }
  }

  return <main className="flex-1 flex flex-col">
    <header className="px-6 py-5 flex items-center justify-between"><Logo taille="size-9" />
      <Link href="/" className="text-sm text-fg-muted">Retour au site</Link></header>
    <section className="flex-1 grid lg:grid-cols-2 gap-12 px-6 py-12 max-w-6xl mx-auto w-full items-center">
      <div className="apparait">
        <p className="text-accent text-sm font-medium mb-4">Votre première photo est offerte</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">Une belle annonce<br/>commence par une belle photo.</h1>
        <p className="text-fg-muted text-lg mt-5 max-w-lg">Créez votre compte pour retrouver vos logements, vos photos et vos retouches au même endroit.</p>
        <ul className="mt-8 space-y-4 text-sm">{["Une première photo par compte, sans carte bancaire.", "Un code par email : aucun mot de passe à retenir.", "Vos originaux conservés avec vos différentes versions."].map(t => <li key={t} className="flex items-center gap-3"><Check className="size-4 text-accent shrink-0"/>{t}</li>)}</ul>
        {service && !service.retouche_disponible && <p className="mt-8 text-sm text-fg-muted border-l-2 border-accent pl-4">La retouche est momentanément indisponible. Vous pouvez créer votre compte et préparer vos photos ; votre essai reste réservé.</p>}
      </div>
      <div className="apparait rounded-3xl bg-surface border border-line p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
        {!service?.connexion_disponible ? <>
          <h2 className="text-xl font-semibold">{indisponible || service ? "La connexion est momentanément indisponible" : "Vérification du service…"}</h2>
          <p className="text-fg-muted text-sm mt-3">Vous pouvez découvrir le studio de démonstration en attendant.</p>
          <Link href="/demo/#studio" className="mt-6 inline-flex text-accent">Explorer la démonstration</Link>
        </> : <>
          <span className="size-11 grid place-items-center rounded-2xl bg-accent/10 text-accent mb-5">{etape === "code" ? <Mail className="size-5"/> : <ShieldCheck className="size-5"/>}</span>
          <h2 className="text-2xl font-semibold">{etape === "code" ? "Consultez votre boîte mail" : inscription ? "Créer mon compte" : "Ravi de vous revoir"}</h2>
          <p className="text-fg-muted text-sm mt-2">{etape === "code" ? `Votre code a été envoyé à ${email.trim()}. Il est valable 10 minutes.` : "Quelques instants pour accéder à votre espace."}</p>
          <form onSubmit={envoyer} className="mt-6 space-y-4">
            {etape === "identite" ? <>
              {inscription && <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-sm">Prénom<Champ className="mt-1.5" name="given-name" autoComplete="given-name" required maxLength={80} value={prenom} onChange={e => setPrenom(e.target.value)}/></label>
                <label className="text-sm">Nom<Champ className="mt-1.5" name="family-name" autoComplete="family-name" required maxLength={80} value={nom} onChange={e => setNom(e.target.value)}/></label>
              </div>}
              <label className="text-sm block">Adresse email<Champ className="mt-1.5" type="email" name="email" autoComplete="email" placeholder="vous@exemple.fr" required value={email} onChange={e => setEmail(e.target.value)}/></label>
            </> : <label className="text-sm block">Code de connexion<Champ className="mt-1.5 text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" placeholder="123456" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}/></label>}
            <Message texte={erreur}/>
            {etape === "code" && confirmationEnvoi && <p role="status" className="text-xs leading-relaxed text-accent bg-accent/10 rounded-xl px-3 py-2">{confirmationEnvoi}</p>}
            <Bouton type="submit" className="w-full" chargement={chargement} disabled={etape === "code" ? code.length !== 6 : inscription && (!prenom.trim() || !nom.trim())}>{etape === "code" ? "Accéder à mon espace" : "Recevoir mon code"}</Bouton>
            {etape === "identite" ? <>
              <p className="text-xs text-fg-muted leading-relaxed">Votre prénom, votre nom et votre email servent à gérer votre compte et votre essai. Cette inscription ne vous abonne pas à des emails publicitaires.</p>
              <button type="button" onClick={() => { setInscription(!inscription); setErreur(""); }} className="text-sm text-accent w-full py-2">{inscription ? "J’ai déjà un compte — me connecter" : "Créer un compte"}</button>
            </> : <>
              <p className="text-xs text-fg-muted leading-relaxed">L’expéditeur est <strong>no-reply@studioannonce.fr</strong>. Vérifiez aussi les courriers indésirables. Seul le dernier code reçu fonctionne.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <button type="button" disabled={chargement || renvoiDans > 0} onClick={() => void renvoyer()} className="text-sm text-accent text-left py-2 disabled:opacity-50">{renvoiDans ? `Renvoyer dans ${renvoiDans} s` : "Renvoyer le code"}</button>
                <button type="button" disabled={chargement} onClick={() => { setEtape("identite"); setCode(""); setErreur(""); setConfirmationEnvoi(""); }} className="text-sm text-fg-muted flex items-center gap-2 py-2"><ArrowLeft className="size-4"/> Modifier l’adresse</button>
              </div>
            </>}
          </form>
        </>}
      </div>
    </section>
  </main>;
}

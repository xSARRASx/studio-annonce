"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { api, jeton, poserJeton } from "@/lib/api";
import { Bouton, Champ, Message } from "@/components/ui";

type Mode = "inscription" | "connexion" | "recuperation";
const destinationPhoto = () => new URLSearchParams(window.location.search).get("suite") === "photo";

export function AccesCompte({ mode = "inscription" }: { mode?: Mode }) {
  const routeur = useRouter();
  const verrou = useRef(false);
  const [etape, setEtape] = useState<"formulaire" | "code" | "termine">("formulaire");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [renvoiDans, setRenvoiDans] = useState(0);
  const inscription = mode === "inscription";
  const recuperation = mode === "recuperation";

  useEffect(() => {
    if (!jeton()) return;
    let actif = true;
    api("/compte").then(() => { if (actif) routeur.replace(destinationPhoto() ? "/app/#nouvelle" : "/app/"); })
      .catch(() => { /* La session expirée laisse le formulaire disponible. */ });
    return () => { actif = false; };
  }, [routeur]);
  useEffect(() => {
    if (!renvoiDans) return;
    const minuteur = window.setTimeout(() => setRenvoiDans(valeur => Math.max(0, valeur - 1)), 1000);
    return () => window.clearTimeout(minuteur);
  }, [renvoiDans]);

  async function envoyer(event: React.FormEvent) {
    event.preventDefault();
    if (verrou.current) return;
    verrou.current = true; setChargement(true); setErreur("");
    try {
      const adresse = email.trim().toLowerCase();
      if (inscription && etape === "formulaire") {
        await api("/auth/inscription", { method: "POST", body: JSON.stringify({ email: adresse, mot_de_passe: motDePasse, prenom: prenom.trim(), nom: nom.trim() }) });
        setEtape("code"); setCode(""); setRenvoiDans(30);
      } else if (inscription) {
        const reponse = await api<{ jeton: string }>("/auth/inscription/verifier", { method: "POST", body: JSON.stringify({ email: adresse, code }) });
        poserJeton(reponse.jeton);
        routeur.replace(destinationPhoto() ? "/app/#nouvelle" : "/app/");
      } else if (recuperation && etape === "formulaire") {
        await api("/auth/mot-de-passe/code", { method: "POST", body: JSON.stringify({ email: adresse }) });
        setEtape("code"); setCode(""); setRenvoiDans(30);
      } else if (recuperation) {
        await api("/auth/mot-de-passe/reinitialiser", { method: "POST", body: JSON.stringify({ email: adresse, code, mot_de_passe: motDePasse }) });
        setEtape("termine"); setMotDePasse(""); setCode("");
      } else {
        const reponse = await api<{ jeton: string }>("/auth/connexion", { method: "POST", body: JSON.stringify({ email: adresse, mot_de_passe: motDePasse }) });
        poserJeton(reponse.jeton);
        routeur.replace(destinationPhoto() ? "/app/#nouvelle" : "/app/");
      }
    } catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setChargement(false); }
  }

  async function renvoyer() {
    if (verrou.current || renvoiDans) return;
    verrou.current = true; setChargement(true); setErreur("");
    try {
      await api(inscription ? "/auth/inscription" : "/auth/mot-de-passe/code", {
        method: "POST", body: JSON.stringify(inscription
          ? { email: email.trim().toLowerCase(), mot_de_passe: motDePasse, prenom: prenom.trim(), nom: nom.trim() }
          : { email: email.trim().toLowerCase() }),
      });
      setRenvoiDans(30);
    } catch (e) { setErreur((e as Error).message); }
    finally { verrou.current = false; setChargement(false); }
  }

  return <main className="flex-1 flex flex-col">
    <header className="px-6 py-5 flex items-center justify-between"><Logo taille="size-9"/>
      <Link href="/" className="text-sm text-fg-muted">Retour au site</Link></header>
    <section className="flex-1 grid lg:grid-cols-2 gap-12 px-6 py-12 max-w-6xl mx-auto w-full items-center">
      <div className="apparait">
        <p className="text-accent text-sm font-medium mb-4">{inscription ? "Votre première photo est offerte" : recuperation ? "Retrouvez votre compte" : "Votre espace Studio Annonce"}</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">{inscription ? <>Créez votre compte.<br/>Votre studio vous attend.</> : recuperation ? <>Retrouvez l’accès<br/>à votre studio.</> : <>Retrouvez vos photos<br/>et vos vidéos.</>}</h1>
        <p className="text-fg-muted text-lg mt-5 max-w-lg">{inscription ? "Un compte pour retrouver vos logements, vos photos et vos retouches au même endroit." : recuperation ? "Recevez un code par email pour choisir un nouveau mot de passe, sans perdre vos créations." : "Connectez-vous avec votre email et votre mot de passe. Votre session restera ouverte sur cet appareil."}</p>
        <ul className="mt-8 space-y-4 text-sm">{[inscription ? "Une première photo par compte, sans carte bancaire." : "Vos créations et brouillons restent enregistrés.", "Vos originaux conservés avec leurs différentes versions.", "Votre compte fonctionne sur le site et l’application mobile."].map(t => <li key={t} className="flex items-center gap-3"><Check className="size-4 text-accent shrink-0"/>{t}</li>)}</ul>
      </div>
      <div className="apparait rounded-3xl bg-surface border border-line p-6 sm:p-8 max-w-md w-full mx-auto shadow-xl">
        <div className="flex gap-2 mb-6 text-sm" aria-label="Choisir un accès au compte">
          <Link href="/inscription/" aria-current={inscription ? "page" : undefined} className={`rounded-xl px-4 py-2.5 flex-1 text-center ${inscription ? "bg-accent text-white font-semibold" : "border border-line text-fg-muted"}`}>Créer un compte</Link>
          <Link href="/se-connecter/" aria-current={mode === "connexion" ? "page" : undefined} className={`rounded-xl px-4 py-2.5 flex-1 text-center ${mode === "connexion" ? "bg-accent text-white font-semibold" : "border border-line text-fg-muted"}`}>Se connecter</Link>
        </div>
        <span className="size-11 grid place-items-center rounded-2xl bg-accent/10 text-accent mb-5">{etape === "code" ? <Mail className="size-5"/> : <ShieldCheck className="size-5"/>}</span>
        <h2 className="text-2xl font-semibold">{etape === "termine" ? "Mot de passe modifié" : etape === "code" ? "Vérifiez votre email" : inscription ? "Créer mon compte" : recuperation ? "Mot de passe oublié" : "Me connecter"}</h2>
        <p className="text-fg-muted text-sm mt-2">{etape === "termine" ? "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." : etape === "code" ? `Saisissez le code envoyé à ${email.trim()}. Il expire dans 10 minutes.` : inscription ? "Indiquez vos coordonnées et choisissez un mot de passe." : recuperation ? "Saisissez l’email de votre compte : nous vous enverrons un code." : "Email et mot de passe de votre compte existant."}</p>
        {etape === "termine" ? <Link href="/se-connecter/" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-white">Me connecter</Link> : <>
          {etape === "code" && <p className="mt-4 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm leading-relaxed">Pas d’email reçu ? Vérifiez aussi les <strong>Spams / Courriers indésirables</strong> et cherchez no-reply@studioannonce.fr.</p>}
          <form onSubmit={envoyer} className="mt-6 space-y-4">
            {etape === "formulaire" ? <>
              {inscription && <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-sm">Prénom<Champ className="mt-1.5" name="given-name" autoComplete="given-name" required maxLength={80} value={prenom} onChange={e => setPrenom(e.target.value)}/></label>
                <label className="text-sm">Nom<Champ className="mt-1.5" name="family-name" autoComplete="family-name" required maxLength={80} value={nom} onChange={e => setNom(e.target.value)}/></label>
              </div>}
              <label className="text-sm block">Adresse email<Champ className="mt-1.5" type="email" name="email" autoComplete="email" placeholder="vous@exemple.fr" required value={email} onChange={e => setEmail(e.target.value)}/></label>
              {!recuperation && <label className="text-sm block">Mot de passe<Champ className="mt-1.5" type="password" name="password" autoComplete={inscription ? "new-password" : "current-password"} minLength={inscription ? 12 : undefined} maxLength={128} required value={motDePasse} onChange={e => setMotDePasse(e.target.value)}/>{inscription && <span className="text-xs text-fg-muted">12 caractères minimum.</span>}</label>}
            </> : <>
              <label className="text-sm block">Code reçu par email<Champ className="mt-1.5 text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" placeholder="123456" required maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}/></label>
              {recuperation && <label className="text-sm block">Nouveau mot de passe<Champ className="mt-1.5" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={motDePasse} onChange={e => setMotDePasse(e.target.value)}/><span className="text-xs text-fg-muted">12 caractères minimum.</span></label>}
            </>}
            <Message texte={erreur}/>
            <Bouton type="submit" className="w-full" chargement={chargement} disabled={etape === "code" ? code.length !== 6 : inscription && (!prenom.trim() || !nom.trim())}>{etape === "code" ? recuperation ? "Enregistrer mon nouveau mot de passe" : "Confirmer et ouvrir mon compte" : inscription ? "Créer mon compte" : recuperation ? "Recevoir un code" : "Me connecter"}</Bouton>
            {etape === "formulaire" ? <>
              {inscription && <p className="text-xs text-fg-muted leading-relaxed">Ces informations servent à gérer votre compte et votre essai, sans inscription à des emails publicitaires. Consultez les <Link href="/mentions-legales/" className="underline">mentions légales</Link>, la <Link href="/confidentialite/" className="underline">confidentialité</Link> et les <Link href="/conditions-utilisation/" className="underline">conditions d’utilisation</Link>.</p>}
              <div className="flex flex-col gap-2 items-center text-sm">{mode === "connexion" && <Link href="/mot-de-passe-oublie/" className="text-accent underline py-1">Mot de passe oublié ?</Link>}{recuperation && <Link href="/se-connecter/" className="text-accent py-1">Retour à la connexion</Link>}{inscription && <Link href="/se-connecter/" className="text-accent py-1">J’ai déjà un compte — me connecter</Link>}</div>
            </> : <button type="button" disabled={chargement || renvoiDans > 0} onClick={() => void renvoyer()} className="text-sm text-accent disabled:opacity-50">{renvoiDans ? `Renvoyer dans ${renvoiDans} s` : "Renvoyer un code"}</button>}
          </form>
        </>}
      </div>
    </section>
  </main>;
}

export default function Connexion() { return <AccesCompte mode="inscription"/>; }

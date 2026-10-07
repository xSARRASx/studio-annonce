"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Gift } from "lucide-react";
import { api, jeton, poserJeton } from "@/lib/api";
import "./signup-offer.css";

export function SignupOffer() {
  const router = useRouter();
  const busy = useRef(false);
  const [connected, setConnected] = useState(false);
  const [step, setStep] = useState<"details" | "code">("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jeton()) return;
    let active = true;
    void api("/compte").then(() => { if (active) setConnected(true); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setLoading(true); setError("");
    try {
      const address = email.trim().toLowerCase();
      if (step === "details") {
        await api("/auth/inscription", { method: "POST", body: JSON.stringify({
          email: address, mot_de_passe: password, prenom: firstName.trim(), nom: lastName.trim(),
        }) });
        setStep("code");
      } else {
        const result = await api<{ jeton: string }>("/auth/inscription/verifier", {
          method: "POST", body: JSON.stringify({ email: address, code }),
        });
        poserJeton(result.jeton);
        router.push("/app/#nouvelle");
      }
    } catch (cause) { setError((cause as Error).message); }
    finally { busy.current = false; setLoading(false); }
  }

  return <section className="free-photo-offer" id="photo-offerte" aria-labelledby="free-photo-title">
    <div className="free-photo-offer-copy">
      <span className="free-photo-kicker"><Gift size={17}/> VOTRE PREMIÈRE PHOTO OFFERTE</span>
      <h2 id="free-photo-title">Essayez sur <em>votre logement.</em></h2>
      <p>Créez votre compte, ajoutez une photo et lancez sa retouche. Votre première photo et son téléchargement HD sans filigrane sont offerts.</p>
      <ul><li><Check size={17}/> Aucun texte à écrire pour commencer</li><li><Check size={17}/> Demande modifiable à tout moment</li><li><Check size={17}/> Sans carte bancaire</li></ul>
    </div>
    <div className="free-photo-offer-form">
      {connected ? <><h3>Votre studio est prêt.</h3><p>Retrouvez votre photo offerte et vos créations dans votre compte.</p><Link className="button dark" href="/app/#nouvelle">Préparer ma photo <ArrowRight size={17}/></Link></> : <>
        <h3>{step === "details" ? "Créer mon compte" : "Confirmer mon email"}</h3>
        <p>{step === "details" ? "Quelques informations, puis votre première photo gratuite." : `Saisissez le code envoyé à ${email.trim()}. Vérifiez aussi vos spams.`}</p>
        <form onSubmit={submit}>
          {step === "details" ? <>
            <div className="free-photo-name-row"><label>Prénom<input autoComplete="given-name" required maxLength={80} value={firstName} onChange={event => setFirstName(event.target.value)}/></label><label>Nom<input autoComplete="family-name" required maxLength={80} value={lastName} onChange={event => setLastName(event.target.value)}/></label></div>
            <label>Email<input type="email" autoComplete="email" required placeholder="vous@exemple.fr" value={email} onChange={event => setEmail(event.target.value)}/></label>
            <label>Mot de passe<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)}/><small>12 caractères minimum</small></label>
          </> : <label>Code reçu par email<input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))}/></label>}
          {error && <p className="free-photo-error" role="alert">{error}</p>}
          <button className="button dark" type="submit" disabled={loading || (step === "code" && code.length !== 6)}>{loading ? "Un instant…" : step === "details" ? "Créer mon compte gratuit" : "Confirmer et préparer ma photo"}<ArrowRight size={17}/></button>
        </form>
        {step === "details" ? <p className="free-photo-fine">Déjà inscrit ? <Link href="/se-connecter/?suite=photo">Connectez-vous</Link>. En continuant, vous acceptez les <Link href="/conditions-utilisation/">conditions d’utilisation</Link>.</p> : <button className="free-photo-back" type="button" onClick={() => { setStep("details"); setCode(""); setError(""); }}>Corriger mon email</button>}
      </>}
    </div>
  </section>;
}

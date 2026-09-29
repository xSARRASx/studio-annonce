"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { API, api, jeton, poserJeton } from "@/lib/api";
import { Bouton, Champ, Message } from "@/components/ui";

export default function Accueil() {
  const routeur = useRouter();
  const [etape, setEtape] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [codeDemo, setCodeDemo] = useState("");
  const [chargement, setChargement] = useState(false);
  const [service, setService] = useState<"verification" | "disponible" | "indisponible">("verification");

  useEffect(() => { if (jeton()) routeur.replace("/app"); }, [routeur]);
  useEffect(() => {
    let actif = true;
    fetch(`${API}/sante`, { cache: "no-store" }).then((rep) => rep.ok ? rep.json() : null)
      .then((etat) => { if (actif) setService(etat?.connexion_disponible ? "disponible" : "indisponible"); })
      .catch(() => { if (actif) setService("indisponible"); });
    return () => { actif = false; };
  }, []);

  async function demanderCode() {
    setErreur(""); setChargement(true);
    try { const r = await api<{ code_demo?: string }>("/auth/code", { method: "POST", body: JSON.stringify({ email }) }); setCodeDemo(r.code_demo ?? ""); setEtape("code"); }
    catch (e) { setErreur((e as Error).message); } finally { setChargement(false); }
  }
  async function verifier() {
    setErreur(""); setChargement(true);
    try {
      const r = await api<{ jeton: string }>("/auth/verifier", { method: "POST", body: JSON.stringify({ email, code }) });
      poserJeton(r.jeton); routeur.push("/app");
    } catch (e) { setErreur((e as Error).message); } finally { setChargement(false); }
  }

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-6 py-5 flex items-center">
        <Logo taille="size-9" />
      </header>
      <section className="flex-1 grid lg:grid-cols-2 gap-10 px-6 pb-16 max-w-6xl mx-auto w-full items-center">
        <div className="apparait">
          <p className="text-accent text-sm font-medium mb-4">Pour bailleurs et hôtes</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">Vos photos de logement, prêtes pour une belle annonce.</h1>
          <p className="text-fg-muted text-lg mt-5 max-w-xl">
            Explorez le studio et préparez vos photos. La connexion aux comptes et la retouche par IA
            seront ouvertes après les derniers contrôles du service.
          </p>
          <ul className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
            {[[Wand2, "Retouche à la demande", "Un parcours à découvrir dans la démonstration."],
              [ShieldCheck, "Tarifs lisibles", "Prix prévus, aucun achat dans la démonstration."],
              [Sparkles, "Vos photos d'abord", "Préparez votre annonce à partir de vos images."]].map(([I, t, s]) => {
                const Icone = I as typeof Wand2;
                return (
                  <li key={t as string} className="rounded-2xl bg-surface border border-line p-4">
                    <Icone className="size-5 text-accent mb-2" />
                    <p className="font-medium">{t as string}</p>
                    <p className="text-fg-muted mt-1">{s as string}</p>
                  </li>);
              })}
          </ul>
        </div>
        <div className="apparait rounded-3xl bg-surface border border-line p-8 max-w-md w-full mx-auto shadow-2xl">
          {service !== "disponible" ? <>
            <h2 className="text-xl font-semibold">{service === "verification" ? "Vérification du service…" : "La connexion arrive bientôt"}</h2>
            <p className="text-fg-muted text-sm mt-3">{service === "verification" ? "Nous vérifions la disponibilité du serveur." : "Les codes par email ne sont pas encore activés. Vous pouvez déjà explorer le studio de démonstration, sans compte ni paiement."}</p>
            <Link href="/demo/" className="mt-6 inline-flex items-center justify-center w-full min-h-12 rounded-2xl bg-accent text-bg font-medium">Explorer le studio</Link>
          </> : <>
          <h2 className="text-xl font-semibold">{etape === "email" ? "Connectez-vous par email" : "Entrez le code reçu par mail"}</h2>
          <p className="text-fg-muted text-sm mt-1">{etape === "email" ? "Pas de mot de passe : un code par mail suffit." : `Envoyé à ${email}. Il est valable 10 minutes.`}</p>
          <div className="mt-6 space-y-3">
            {etape === "email" ? (
              <Champ type="email" placeholder="votre@email.fr" value={email} onChange={(e) => setEmail(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && demanderCode()} autoFocus />
            ) : (
              <Champ inputMode="numeric" placeholder="123456" maxLength={6} value={code} className="text-center text-2xl tracking-[0.4em]"
                     onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && verifier()} autoFocus />
            )}
            {etape === "code" && codeDemo && (
              <p className="text-xs text-fg-muted text-center">Mode démo, les mails ne partent pas encore. Votre code : <b className="text-accent tracking-widest">{codeDemo}</b></p>
            )}
            <Message texte={erreur} />
            {etape === "email"
              ? <Bouton className="w-full" chargement={chargement} onClick={demanderCode} disabled={!email.includes("@")}>Recevoir mon code</Bouton>
              : <>
                  <Bouton className="w-full" chargement={chargement} onClick={verifier} disabled={code.length !== 6}>Entrer</Bouton>
                  <Bouton variante="discret" className="w-full" onClick={() => setEtape("email")}>Changer d&apos;adresse</Bouton>
                </>}
          </div>
          </>}
        </div>
      </section>
    </main>
  );
}

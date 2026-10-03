import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

function Brand() {
  return (
    <Link className="public-brand" href="/" aria-label="Studio Annonce, accueil">
      <Image src={`${base}/demo/porte-lumineuse.svg`} alt="" width={36} height={42} />
      <span>studio<span>annonce</span></span>
    </Link>
  );
}

export function PublicHeader({ current }: { current: "tarifs" | "aide" | "exemples" | "blog" | "application" }) {
  return (
    <>
      <header className="public-header">
        <Brand />
        <nav aria-label="Navigation du site">
          <Link href="/exemples/" aria-current={current === "exemples" ? "page" : undefined}>Exemples</Link>
          <Link href="/application/" aria-current={current === "application" ? "page" : undefined}>Application</Link>
          <Link href="/tarifs/" aria-current={current === "tarifs" ? "page" : undefined}>Tarifs</Link>
          <Link href="/aide/" aria-current={current === "aide" ? "page" : undefined}>Aide</Link>
          <Link href="/blog/" aria-current={current === "blog" ? "page" : undefined}>Blog</Link>
        </nav>
        <Link className="public-studio-link" href="/connexion/">Ouvrir mon compte <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </header>
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <Brand />
      <p>Un nouveau regard sur votre intérieur.</p>
      <nav aria-label="Liens de bas de page">
        <Link href="/">Accueil</Link>
        <Link href="/application/">Application</Link>
        <Link href="/tarifs/">Tarifs</Link>
        <Link href="/aide/">Aide</Link>
        <Link href="/blog/">Blog</Link>
        <Link href="/mentions-legales/">Mentions légales</Link>
        <Link href="/confidentialite/">Confidentialité</Link>
        <Link href="/cookies/">Cookies</Link>
        <Link href="/conditions-utilisation/">Conditions d’utilisation</Link>
      </nav>
    </footer>
  );
}

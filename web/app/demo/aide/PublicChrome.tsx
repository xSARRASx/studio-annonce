import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

function Brand() {
  return (
    <Link className="public-brand" href="/demo/" aria-label="Studio Annonce, accueil">
      <Image src={`${base}/demo/porte-lumineuse.svg`} alt="" width={36} height={42} />
      <span>studio<span>annonce</span></span>
    </Link>
  );
}

export function PublicHeader({ current }: { current: "tarifs" | "aide" }) {
  return (
    <>
      <div className="public-demo-note"><span /> Démonstration · aucun achat activé</div>
      <header className="public-header">
        <Brand />
        <nav aria-label="Navigation du site">
          <Link href="/demo/exemples/">Exemples</Link>
          <Link href="/demo/tarifs/" aria-current={current === "tarifs" ? "page" : undefined}>Tarifs</Link>
          <Link href="/demo/aide/" aria-current={current === "aide" ? "page" : undefined}>Aide</Link>
        </nav>
        <Link className="public-studio-link" href="/demo/#studio">Ouvrir le studio <ArrowUpRight size={16} aria-hidden="true" /></Link>
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
        <Link href="/demo/">Accueil</Link>
        <Link href="/demo/tarifs/">Tarifs</Link>
        <Link href="/demo/aide/">Aide</Link>
      </nav>
    </footer>
  );
}

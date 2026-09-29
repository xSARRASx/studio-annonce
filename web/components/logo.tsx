import Image from "next/image";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Identité commune à l'accueil, la connexion et au studio. */
export function Logo({ taille = "size-8", texte = true }: { taille?: string; texte?: boolean }) {
  return <span className="inline-flex items-center gap-2.5 text-[#292d25]">
    <Image src={`${base}/demo/porte-lumineuse.svg`} alt="" width={40} height={44} className={`${taille} shrink-0 object-contain`}/>
    {texte && <span className="font-[650] tracking-tight">studio<span className="font-[350]">annonce</span></span>}
  </span>;
}

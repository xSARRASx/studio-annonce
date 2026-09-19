/** Emblème Studio Annonce en vectoriel (source : design/logo/embleme.py). */
export function Embleme({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#f2ede4" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="37.5" fill="none" stroke="#e8a33a" strokeWidth="7" />
      <g stroke="#0b0b0f" strokeWidth="2.4">
        <line x1="50" y1="17" x2="50" y2="8" />
        <line x1="21.42" y1="66.5" x2="13.63" y2="71" />
        <line x1="78.58" y1="66.5" x2="86.37" y2="71" />
      </g>
      <clipPath id="sa-obt"><circle cx="50" cy="40" r="16" /></clipPath>
      <circle cx="50" cy="40" r="16" fill="#f2ede4" />
      <g clipPath="url(#sa-obt)" stroke="#0b0b0f" strokeWidth="2.6">
        {[15, 75, 135, 195, 255, 315].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const px = 50 + 5.8 * Math.cos(a), py = 40 + 5.8 * Math.sin(a);
          return <line key={deg} x1={px} y1={py} x2={px - 30 * Math.sin(a)} y2={py + 30 * Math.cos(a)} />;
        })}
      </g>
      <polygon fill="#0b0b0f" points={[15, 75, 135, 195, 255, 315].map((deg) => {
        const a = ((deg + 30) * Math.PI) / 180, r = 5.8 / Math.cos(Math.PI / 6);
        return `${50 + r * Math.cos(a)},${40 + r * Math.sin(a)}`;
      }).join(" ")} />
      <path d="M50 58 L27 79 L27 100 L73 100 L73 79 Z" fill="#0b0b0f" stroke="#0b0b0f" strokeWidth="7" strokeLinejoin="round" />
      <path d="M50 61 L30 79 L30 100 M70 100 L70 79 L50 61" fill="none" stroke="#f2ede4" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="45" y="85" width="10" height="15" fill="#f2ede4" />
    </svg>
  );
}

/** Emblème + nom, tel qu'on le voit dans les en-têtes. */
export function Logo({ taille = "size-8", texte = true }: { taille?: string; texte?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Embleme className={taille} />
      {texte && <span className="font-semibold tracking-tight">Studio <span className="text-accent">Annonce</span></span>}
    </span>
  );
}

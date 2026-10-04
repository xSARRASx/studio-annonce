import Image from "next/image";
import Link from "next/link";
import "./site-footer.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-invite">
        <div>
          <span className="site-footer-kicker">STUDIO ANNONCE</span>
          <h2>Une belle annonce commence par des images claires.</h2>
          <p>Parcourez des avant/après réels et trouvez des idées pour préparer les photos de votre logement.</p>
        </div>
        <Link className="site-footer-cta" href="/exemples/">Voir les exemples <span aria-hidden="true">↗</span></Link>
      </div>

      <div className="site-footer-columns">
        <div className="site-footer-about">
          <Link className="site-footer-brand" href="/" aria-label="Studio Annonce, accueil">
            <Image src={`${base}/icone.svg`} alt="" width={48} height={48} />
            <span>studio<span>annonce</span></span>
          </Link>
          <p>Retouche photo immobilière et décoration virtuelle pour préparer les images de votre annonce.</p>
          <span className="site-footer-about-note">Comparez toujours le résultat avec la photo d’origine.</span>
        </div>

        <nav aria-label="Découvrir Studio Annonce">
          <h2>Découvrir</h2>
          <Link href="/exemples/">Les avant/après</Link>
          <Link href="/application/">L’application</Link>
          <Link href="/tarifs/">Les tarifs</Link>
          <Link href="/blog/">Les guides</Link>
        </nav>

        <nav aria-label="Utiliser Studio Annonce">
          <h2>À vos côtés</h2>
          <Link href="/aide/">Questions fréquentes</Link>
          <Link href="/connexion/">Ouvrir mon compte</Link>
          <Link href="/mobile-preview/">Aperçu mobile</Link>
          <a href="mailto:contact@studioannonce.fr">Nous contacter</a>
        </nav>

        <nav aria-label="Entreprise et informations légales">
          <h2>L’entreprise</h2>
          <Link href="/entreprise/">Qui sommes-nous ?</Link>
          <Link href="/mentions-legales/">Mentions légales</Link>
          <Link href="/confidentialite/">Confidentialité</Link>
          <Link href="/cookies/">Cookies et stockage local</Link>
          <Link href="/conditions-utilisation/">Conditions d’utilisation</Link>
        </nav>
      </div>

      <section className="site-footer-app" aria-labelledby="site-footer-app-title">
        <div>
          <span className="site-footer-kicker">APPLICATION MOBILE</span>
          <h2 id="site-footer-app-title">Bientôt sur iPhone et Android.</h2>
          <p>Les liens de téléchargement seront activés dès la publication de l’application sur les deux stores.</p>
        </div>
        <div className="site-footer-stores" aria-label="Application mobile bientôt disponible">
          <span className="site-footer-store-badge">
            <Image src={`${base}/icone.svg`} alt="" width={42} height={42} />
            <span><small>Bientôt sur l’</small><strong>App Store</strong></span>
          </span>
          <span className="site-footer-store-badge">
            <Image src={`${base}/icone.svg`} alt="" width={42} height={42} />
            <span><small>Bientôt sur</small><strong>Google Play</strong></span>
          </span>
        </div>
      </section>

      <div className="site-footer-bottom">
        <span>© 2026 Studio Annonce</span>
        <span>Un service édité par MA INDUSTRY COMPANY LIMITED</span>
      </div>
    </div>
  </footer>;
}

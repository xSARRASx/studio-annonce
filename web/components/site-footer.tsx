import Image from "next/image";
import Link from "next/link";
import { CookiePreferencesLink } from './cookie-info-link';
import "./site-footer.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-columns">
        <div className="site-footer-about">
          <Link className="site-footer-brand" href="/" aria-label="Studio Annonce, accueil">
            <Image src={`${base}/icone.svg`} alt="" width={36} height={36} />
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
          <Link href="/entreprise/">Qui sommes-nous ?</Link>
        </nav>

        <nav aria-label="Utiliser Studio Annonce">
          <h2>À vos côtés</h2>
          <Link href="/aide/">Questions fréquentes</Link>
          <Link href="/se-connecter/">Ouvrir mon compte</Link>
          <a href="/mobile/">Ouvrir l’application mobile</a>
          <a href="mailto:contact@studioannonce.fr">Nous contacter</a>
        </nav>

        <div className="site-footer-app" aria-labelledby="site-footer-app-title">
          <h2 id="site-footer-app-title">À emporter partout</h2>
          <p>Retrouvez votre studio et vos créations sur votre téléphone, depuis le navigateur.</p>
          <a className="site-footer-mobile-link" href="/mobile/">Ouvrir l’application mobile →</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 Studio Annonce</span>
        <nav aria-label="Informations légales">
          <Link href="/mentions-legales/">Mentions légales</Link>
          <Link href="/confidentialite/">Confidentialité</Link>
          <Link href="/cookies/">Cookies et stockage local</Link>
          <CookiePreferencesLink />
          <Link href="/conditions-utilisation/">Conditions d’utilisation</Link>
          <Link href="/conditions-vente/">Conditions de vente</Link>
        </nav>
      </div>
      <p className="site-footer-editor">Un service édité par MA INDUSTRY COMPANY LIMITED</p>
    </div>
  </footer>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { demoInteraction } from '../../../shared/tracking';
import { ArrowRight, Monitor, Play, Smartphone } from "lucide-react";
import "./presentation.css";

type Format = "ordinateur" | "mobile";

const films: Record<Format, { src: string; poster: string; label: string }> = {
  ordinateur: {
    src: "/presentation/studio-annonce-v5-ordinateur.mp4",
    poster: "/presentation/studio-annonce-v5-ordinateur.jpg",
    label: "Présentation de Studio Annonce sur ordinateur",
  },
  mobile: {
    src: "/presentation/studio-annonce-v5-mobile.mp4",
    poster: "/presentation/studio-annonce-v5-mobile.jpg",
    label: "Présentation de Studio Annonce sur téléphone",
  },
};

export function Presentation() {
  const [format, setFormat] = useState<Format>("ordinateur");
  const [started, setStarted] = useState(false);
  const userChoseFormat = useRef(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const smallScreen = window.matchMedia("(max-width: 700px)");
    const adapt = () => {
      if (!userChoseFormat.current) setFormat(smallScreen.matches ? "mobile" : "ordinateur");
    };
    adapt();
    smallScreen.addEventListener("change", adapt);
    return () => smallScreen.removeEventListener("change", adapt);
  }, []);

  function chooseFormat(next: Format) {
    userChoseFormat.current = true;
    video.current?.pause();
    setStarted(false);
    setFormat(next);
  }

  function startFilm() {
    setStarted(true);
  }

  const film = films[format];

  return (
    <section className="presentation" aria-labelledby="presentation-title">
      <div className="presentation-heading">
        <div>
          <span className="section-kicker">LE STUDIO EN IMAGES</span>
          <h2 id="presentation-title">Voyez comment ça se passe.</h2>
          <p>Une photo de votre logement, une idée en quelques mots, puis une proposition à comparer avec l’original.</p>
          <ol className="presentation-steps">
            <li><span>01</span> Choisissez votre photo</li>
            <li><span>02</span> Décrivez votre idée</li>
            <li><span>03</span> Comparez la proposition</li>
          </ol>
        </div>
        <Link className="button dark" href="/inscription/?suite=photo">Préparer ma photo <ArrowRight size={18} /></Link>
      </div>

      <div className="presentation-panel">
        <div className="presentation-bar">
          <div className="presentation-bar-copy"><span className="presentation-live-dot" /> Le film · 43 s</div>
          <div className="presentation-formats" role="group" aria-label="Format du film">
            <button type="button" aria-pressed={format === "ordinateur"} onClick={() => chooseFormat("ordinateur")}><Monitor size={17} /> Ordinateur</button>
            <button type="button" aria-pressed={format === "mobile"} onClick={() => chooseFormat("mobile")}><Smartphone size={17} /> Téléphone</button>
          </div>
        </div>
        <div className={`presentation-stage presentation-stage-${format}`}>
          <div className="presentation-player">
            <video
              key={format}
              ref={video}
              src={started ? film.src : undefined}
              poster={film.poster}
              controls={started}
              autoPlay={started}
              playsInline
              onPlay={() => demoInteraction('film')}
              preload="none"
              aria-label={film.label}
            >Votre navigateur ne peut pas lire cette vidéo.</video>
            {!started && <button className="presentation-play" type="button" onClick={startFilm} aria-label={`Voir le film ${format} de Studio Annonce`}><Play size={24} fill="currentColor" /><span>Voir le film</span></button>}
          </div>
        </div>
        <p className="presentation-note">Film de présentation du parcours. Le lien d’annonce est enregistré, puis les photos sont ajoutées depuis votre appareil. Une vraie visite vidéo d’exemple est présentée plus bas.</p>
      </div>
    </section>
  );
}

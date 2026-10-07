/** Extrait localement quelques vues d'une vidéo. Le fichier ne quitte pas l'appareil. */
export async function extraireVues(file: File): Promise<string[]> {
  if (!file.type.startsWith("video/") || file.size > 250 * 1024 * 1024) {
    throw new Error("Choisissez une vidéo du logement de 250 Mo maximum.");
  }
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.cssText = "position:fixed;width:1px;height:1px;left:-10000px;top:-10000px";
  document.body.appendChild(video);
  function attendre(evenement: string, delai = 9000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => finir(new Error("La vidéo ne peut pas être lue sur cet appareil. Décrivez les portes à la main.")), delai);
      const ok = () => finir();
      const ko = () => finir(new Error("La vidéo ne peut pas être lue sur cet appareil. Décrivez les portes à la main."));
      const finir = (erreur?: Error) => {
        clearTimeout(timer);
        video.removeEventListener(evenement, ok);
        video.removeEventListener("error", ko);
        if (erreur) reject(erreur); else resolve();
      };
      video.addEventListener(evenement, ok, { once: true });
      video.addEventListener("error", ko, { once: true });
    });
  }
  try {
    video.src = url;
    video.load();
    if (video.readyState < 1) await attendre("loadedmetadata");
    const duree = video.duration;
    if (!Number.isFinite(duree) || duree < 3 || duree > 180 || !video.videoWidth || !video.videoHeight) {
      throw new Error("Filmez une visite de 3 secondes à 3 minutes pour repérer le logement.");
    }
    const canvas = document.createElement("canvas");
    const echelle = Math.min(1, 560 / video.videoWidth, 360 / video.videoHeight);
    canvas.width = Math.max(1, Math.round(video.videoWidth * echelle));
    canvas.height = Math.max(1, Math.round(video.videoHeight * echelle));
    const contexte = canvas.getContext("2d");
    if (!contexte) throw new Error("L'extraction des images est indisponible sur cet appareil.");
    const nombre = Math.min(10, Math.max(6, Math.ceil(duree / 5)));
    const vues: string[] = [];
    for (let index = 0; index < nombre; index++) {
      const cible = Math.min(duree - 0.1, (index + 0.5) * duree / nombre);
      const attente = attendre("seeked");
      video.currentTime = cible;
      await attente;
      contexte.drawImage(video, 0, 0, canvas.width, canvas.height);
      vues.push(canvas.toDataURL("image/jpeg", 0.68).split(",")[1]);
    }
    return vues;
  } finally {
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

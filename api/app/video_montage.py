"""Montage de clips privés, dans l'ordre confirmé, sans inventer de transition."""
from pathlib import Path
import subprocess
import tempfile

import imageio_ffmpeg


def assembler(clips: list[bytes], duree: int | None = None, resolution: str = "720p") -> bytes:
    if not 1 <= len(clips) <= 6 or any(not clip or len(clip) > 100 * 1024 * 1024 for clip in clips):
        raise ValueError("Choisissez de un à six clips pour le montage.")
    duree = duree if duree is not None else 5 * len(clips)
    if duree not in (5, 10, 15, 20, 25, 30):
        raise ValueError("Durée de montage non prise en charge.")
    if resolution not in ("720p", "1080p"):
        raise ValueError("Qualité de montage non prise en charge.")
    largeur, hauteur = (1920, 1080) if resolution == "1080p" else (1280, 720)
    frames, reste = divmod(duree * 24, len(clips))
    executable = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory(prefix="studio-montage-") as temporaire:
        dossier = Path(temporaire)
        for index, contenu in enumerate(clips):
            source = dossier / f"source-{index}.mp4"
            destination = dossier / f"plan-{index}.mp4"
            source.write_bytes(contenu)
            lecteur = imageio_ffmpeg.read_frames(str(source))
            try:
                meta = next(lecteur)
            finally:
                lecteur.close()
            source_duration = meta.get("duration", 0)
            if source_duration <= 0:
                raise RuntimeError("La durée du clip est illisible.")
            nb_frames = frames + (index < reste)
            rythme = nb_frames / (24 * source_duration)
            # Conserver tout le mouvement de chaque plan, et toutes les photos.
            # Même canevas pour toutes les photos. Pas d'étirement ni de recadrage.
            subprocess.run([executable, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(source), "-frames:v", str(nb_frames), "-an", "-vf",
                f"setpts={rythme}*(PTS-STARTPTS),scale={largeur}:{hauteur}:force_original_aspect_ratio=decrease,pad={largeur}:{hauteur}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,tpad=stop_mode=clone:stop_duration=0.1",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20" if resolution == "1080p" else "22", "-threads", "1",
                "-pix_fmt", "yuv420p", str(destination)], check=True, timeout=120, capture_output=True)
        liste = dossier / "plans.txt"
        liste.write_text("".join(f"file 'plan-{index}.mp4'\n" for index in range(len(clips))))
        resultat = dossier / "video.mp4"
        subprocess.run([executable, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "1", "-i", str(liste), "-c", "copy", "-movflags", "+faststart",
            str(resultat)], check=True, timeout=60, capture_output=True)
        if not resultat.is_file() or resultat.stat().st_size > 100 * 1024 * 1024:
            raise RuntimeError("Le montage dépasse la taille autorisée.")
        return resultat.read_bytes()

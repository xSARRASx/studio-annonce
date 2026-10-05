"""Direction de caméra versionnée, sans appel IA ni dépense pendant la préparation."""
from typing import Literal

Mouvement = Literal["auto", "traversee", "orbite", "revelation", "calme"]
VERSION = "camera-2026-10-04-v1"
ORDRE = ("traversee", "orbite", "revelation")
TRAJETS = {
    "traversee": (
        "A lively indoor FPV-style travelling shot at eye level. Start moving immediately, "
        "travel forward along the visible free aisle, then bank into a broad lateral arc beside "
        "the existing furniture. Cover meaningful ground, about 1–2 metres if the visible space allows. "
        "Foreground furniture must shift clearly against the background through real camera parallax."
    ),
    "orbite": (
        "A decisive curved camera move around the visible table or kitchen island; if neither exists, "
        "arc beside the principal piece of furniture already visible. Move sideways as you turn the "
        "camera towards it, describing a 45–70 degree partial orbit where visible clearance permits. "
        "The object stays stationary while its perspective and the background change clearly through parallax. "
        "Never complete a 360-degree orbit or invent the unseen reverse side of the room."
    ),
    "revelation": (
        "A brisk lateral tracking reveal across the existing room. Pass beside a visible foreground "
        "edge or piece of furniture, then arc towards the main open area. Move roughly 1–2 metres "
        "where the visible aisle permits, with a slight rise of the camera and pronounced foreground/"
        "background parallax. Finish on an inviting wide view of the space already evidenced."
    ),
    "calme": (
        "An unhurried architectural camera dolly along the visible free space, with a modest lateral "
        "arc and readable parallax. Maintain a calm, continuous pace and a level horizon."
    ),
}


def mouvement_du_plan(mouvement: Mouvement, index: int) -> str:
    if mouvement == "auto":
        return ORDRE[index % len(ORDRE)]
    if mouvement not in TRAJETS:
        raise ValueError("Mouvement de caméra inconnu.")
    return mouvement


def preparer_consigne(demande: str, mouvement: Mouvement = "auto", index: int = 0, total: int = 1, duree: int = 5) -> str:
    """Une trajectoire par source ; la demande explicite du client garde priorité."""
    trajet = mouvement_du_plan(mouvement, index)
    rythme = (
        f"Keep a calm, even pace for these {duree} seconds."
        if trajet == "calme" else
        f"{duree}-second take: enter the move immediately, commit to clear, energetic spatial "
        "travel through most of the shot, then ease into the final composition. Smooth means stable, not slow or barely moving."
    )
    return "\n\n".join([
        f"REAL ESTATE CAMERA DIRECTION — shot {index + 1}/{total}, one continuous {duree}-second take. "
        "Use the supplied photograph as the exact opening frame. "
        "The CLIENT REQUEST below controls the desired pace, direction and subject; when it specifies "
        "a different camera move, follow it instead of the proposed path. Apply only instructions "
        "relevant to this source room; other rooms belong to their own shots.",
        "PROPOSED CAMERA PATH: " + TRAJETS[trajet] + " " + rythme,
        "SPATIAL FIDELITY: The camera travels; walls and furniture do not. Preserve the actual doors, "
        "windows, radiators, layout, proportions, materials and furnishings. Keep a level horizon, "
        "natural daylight and realistic optical perspective. Follow only free space visible in the "
        "source; shorten or bend the path if obstructed, keeping a visible lateral displacement. "
        "No digital zoom, flat image pan, Ken Burns slideshow, warping, moving furniture, new openings, "
        "passage through walls or closed glass, or invented connecting rooms. No visible drone or "
        "text overlay. Other photographs are joined by editing cuts outside this generated take.",
        "CLIENT REQUEST (original wording):\n" + demande.strip(),
    ])

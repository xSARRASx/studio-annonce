"""Direction de caméra versionnée, sans appel IA ni dépense pendant la préparation."""
from typing import Literal
import re
import unicodedata

Mouvement = Literal["auto", "traversee", "orbite", "revelation", "calme"]
VERSION = "camera-2026-10-06-v5-visit-style"
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


def identifier_piece(analyse: dict | None) -> str:
    """Ne transmettre au moteur qu'un nom de pièce canonique, jamais du texte libre issu de l'analyse."""
    valeur = (analyse or {}).get("piece", "")
    if not isinstance(valeur, str):
        return "unidentified room"
    valeur = unicodedata.normalize("NFKD", valeur).encode("ascii", "ignore").decode().lower()
    for motif, nom in (
        (r"salle de bain|salle d.eau|\bsdb\b", "bathroom"),
        (r"\bcuisine\b", "kitchen"),
        (r"\bchambre\b", "bedroom"),
        (r"\bsalon\b|\bsejour\b", "living room"),
        (r"salle a manger", "dining room"),
        (r"\bentree\b|\bhall\b", "entrance"),
        (r"\bcouloir\b", "hallway"),
        (r"\bterrasse\b", "terrace"),
        (r"\bbalcon\b", "balcony"),
        (r"\bjardin\b|\bexterieur\b", "outdoor area"),
    ):
        if re.search(motif, valeur):
            return nom
    return "unidentified room"


def preparer_visite_continue(demande: str, mouvements: list[Mouvement], duree: int,
                             pieces: list[str] | None = None, agencement: str = "", montage: str = "montage") -> str:
    """Une seule génération ; l'ordre et les liens spatiaux prouvés priment sur le style."""
    if pieces is not None and len(pieces) != len(mouvements):
        raise ValueError("Une pièce doit correspondre à chaque photo.")
    etapes = "\n".join(
        f"Reference image {index + 1} — {(pieces or ['unidentified room'] * len(mouvements))[index]} — {trajet}: {TRAJETS[trajet]}"
        for index, mouvement in enumerate(mouvements)
        for trajet in [mouvement_du_plan(mouvement, index)]
    )
    disposition = agencement.strip() or "No verified room-to-room connections were supplied."
    style = (
        "EDITING CHOICE: The client requests one flowing drone-style tour with no editorial cuts where the mapped, visible openings permit it. "
        "Move through each confirmed doorway in the specified order, with controlled changes of speed and a stable horizon. "
        "If a real passage cannot be established, use a clean cut rather than inventing architecture. Never promise a single take."
        if montage == "continue" else
        "EDITING CHOICE: The client accepts clean cinematic cuts between rooms. Make each room's camera movement purposeful and dynamic; "
        "do not morph walls or invent a doorway to avoid a cut."
    )
    return "\n\n".join([
        f"PHOTOREALISTIC REAL-ESTATE FPV TOUR, {duree} seconds, following the reference images in their exact order. "
        "The client request controls camera style and pace, never the physical layout. Start moving immediately within each evidenced room, "
        "make a partial orbit around an existing table or island when requested. Stable horizon, visible parallax and meaningful camera "
        "displacement; never a still-image zoom or slideshow.",
        "REFERENCE ORDER AND MOVES: " + etapes,
        style,
        "CLIENT-REVIEWED LAYOUT AND DOOR MAP (derived from a walkthrough or manual description; the walkthrough video "
        "is not supplied to this generation model):\n" + disposition,
        "NON-NEGOTIABLE PROPERTY FIDELITY: Reference image 1 is the first room, image 2 the second, and so on. "
        "Never swap room identities, turn a kitchen into a bedroom, relocate a room, or rearrange doors, windows, walls, fixed equipment, "
        "furniture or materials. Preserve the actual geometry and orientation shown in each reference. The camera may move only through "
        "visible free space. If a room has two doors, never swap their destinations: use only the exact left/centre/right opening "
        "identified in the client-reviewed map. A route marked uncertain or 'cut' overrides any request for a continuous drone move. "
        "Cross between rooms in one continuous shot ONLY when the departure opening is visible in the reference and its destination "
        "is explicitly confirmed in the map. If either the opening or its destination is uncertain, use a clean cinematic cut between "
        "faithful room shots; do not morph rooms together or fabricate a corridor, doorway, passage, staircase or view through a wall or "
        "closed glass. A client's desired camera motion never authorizes inventing architecture. No floating furniture, warped "
        "architecture, visible drone, text or watermark.",
        "CLIENT REQUEST (original wording):\n" + demande.strip(),
    ])

"""Dessine l'emblème Studio Annonce en vectoriel (obturateur + maison dans un anneau)."""
import math

CREME = "#f2ede4"
AMBRE = "#e8a33a"
FOND = "#0b0b0f"

def embleme(fond=True, taille=100):
    cx, cy = 50, 50
    parts = []
    if fond:
        parts.append(f'<rect width="100" height="100" fill="{FOND}"/>')
    # anneau extérieur crème
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="45" fill="none" stroke="{CREME}" stroke-width="3.5"/>')
    # anneau ambre, coupé en trois arcs
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="37.5" fill="none" stroke="{AMBRE}" stroke-width="7"/>')
    for a in (-90, 150, 30):
        r = math.radians(a)
        x1, y1 = cx + 33 * math.cos(r), cy + 33 * math.sin(r)
        x2, y2 = cx + 42 * math.cos(r), cy + 42 * math.sin(r)
        parts.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{FOND}" stroke-width="2.4"/>')
    # obturateur : disque crème + 6 lames
    ox, oy, R, ri = cx, cy - 10, 16, 5.8
    parts.append(f'<clipPath id="obt"><circle cx="{ox}" cy="{oy}" r="{R}"/></clipPath>')
    parts.append(f'<circle cx="{ox}" cy="{oy}" r="{R}" fill="{CREME}"/>')
    pts, lignes = [], []
    for i in range(6):
        a = math.radians(i * 60 + 15)
        px, py = ox + ri * math.cos(a), oy + ri * math.sin(a)
        tx, ty = -math.sin(a), math.cos(a)
        lignes.append((px, py, tx, ty))
    for i in range(6):
        px, py, tx, ty = lignes[i]
        qx, qy, ux, uy = lignes[(i + 1) % 6]
        # intersection des deux tangentes
        det = tx * (-uy) - ty * (-ux)
        t = ((qx - px) * (-uy) - (qy - py) * (-ux)) / det
        pts.append((px + t * tx, py + t * ty))
    hexa = " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)
    parts.append(f'<polygon points="{hexa}" fill="{FOND}"/>')
    for px, py, tx, ty in lignes:
        parts.append(f'<line x1="{px:.2f}" y1="{py:.2f}" x2="{px + 30 * tx:.2f}" y2="{py + 30 * ty:.2f}" '
                     f'stroke="{FOND}" stroke-width="2.6" clip-path="url(#obt)"/>')
    # maison : masque sombre puis contour crème
    maison = "M50 58 L27 79 L27 100 L73 100 L73 79 Z"
    parts.append(f'<path d="{maison}" fill="{FOND}" stroke="{FOND}" stroke-width="7" stroke-linejoin="round"/>')
    parts.append(f'<path d="M50 61 L30 79 L30 100 M70 100 L70 79 L50 61" fill="none" stroke="{CREME}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>')
    parts.append(f'<rect x="45" y="85" width="10" height="15" fill="{CREME}"/>')
    corps = "\n  ".join(parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{taille}" height="{taille}">\n  {corps}\n</svg>\n')

if __name__ == "__main__":
    import pathlib
    ici = pathlib.Path(__file__).parent
    (ici / "embleme.svg").write_text(embleme(fond=False))
    (ici / "embleme-fond.svg").write_text(embleme(fond=True))
    print("ok")


def icone(taille=1024):
    """Icône carrée (appli, favicon) : fond sombre plein, emblème centré à 78 %."""
    dessin = embleme(fond=False).split("\n", 1)[1].rsplit("</svg>", 1)[0]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{taille}" height="{taille}">\n'
            f'  <rect width="100" height="100" fill="{FOND}"/>\n'
            f'  <g transform="translate(11 9) scale(0.78)">\n{dessin}  </g>\n</svg>\n')


def logo_horizontal():
    """Emblème + nom, pour l'en-tête du site et les partages."""
    dessin = embleme(fond=False).split("\n", 1)[1].rsplit("</svg>", 1)[0]
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 100" width="470" height="100">\n'
            f'  <g>\n{dessin}  </g>\n'
            '  <text x="118" y="66" font-family="Geist, Inter, system-ui, sans-serif" font-size="44" font-weight="600" letter-spacing="-1">'
            f'<tspan fill="{CREME}">Studio </tspan><tspan fill="{AMBRE}">Annonce</tspan></text>\n</svg>\n')


if __name__ == "__main__":
    ici = pathlib.Path(__file__).parent
    (ici / "icone.svg").write_text(icone())
    (ici / "logo-horizontal.svg").write_text(logo_horizontal())
    web = ici.parent.parent / "web"
    (web / "app" / "icon.svg").write_text(icone(64))
    (web / "public").mkdir(exist_ok=True)
    (web / "public" / "embleme.svg").write_text(embleme(fond=False))
    (web / "public" / "icone.svg").write_text(icone(512))
    (web / "public" / "logo-horizontal.svg").write_text(logo_horizontal())
    print("fichiers écrits")

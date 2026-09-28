/** Consignes communes aux deux aperçus. Elles préparent un brief, sans retoucher les médias. */
export function videoVisitContext(photos: readonly string[], cleanup: string, route: string): string {
  const sources = photos.length
    ? `Photos sources dans l’ordre de la visite : ${photos.map((photo, index) => `${index + 1}. ${photo}`).join(' ; ')}.`
    : 'Aucune photo source choisie : la scène demandée sera fictive si elle est imaginée sans références.';
  const cleaning = cleanup.trim()
    ? `Rangement et retouches souhaités avant animation : ${cleanup.trim()}`
    : 'Rangement avant animation : retirer les objets personnels et le désordre, faire les lits visibles, dégager les surfaces sans modifier les volumes, les ouvertures, les équipements fixes ni le mobilier à préserver.';
  const circulation = route.trim()
    ? `Trajet et raccords indiqués : ${route.trim()}`
    : 'Trajet : suivre l’ordre des photos et identifier les vraies portes, baies et escaliers visibles. Si un passage entre deux pièces n’est pas démontré par les sources, prévoir une coupe de montage claire.';
  return [sources, cleaning, circulation, 'Contrôle avant livraison : valider les images rangées plan par plan ; aucun objet retiré ne réapparaît, aucun passage à travers un mur ou un vitrage fermé, aucune pièce inventée. Les photos seules ne prouvent pas la continuité spatiale.'].join('\n');
}

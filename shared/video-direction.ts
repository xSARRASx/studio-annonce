/** Choix de réalisation communs au site et au mobile. Aucun appel IA ici. */
export const CAMERA_MOVES = [
  { id: 'auto', label: 'Varier les mouvements', description: 'Avancée, orbite, puis révélation : les plans alternent selon leur ordre.' },
  { id: 'traversee', label: 'Traversée dynamique', description: 'La caméra avance franchement et prend un virage près du mobilier.' },
  { id: 'orbite', label: 'Autour du mobilier', description: 'Un arc autour de la table ou de l’îlot visible, sans tour complet.' },
  { id: 'revelation', label: 'Révélation latérale', description: 'Un déplacement de côté avec de la profondeur, puis une vue plus ouverte.' },
  { id: 'calme', label: 'Visite calme', description: 'Un déplacement plus posé, à choisir si vous préférez un rythme lent.' },
] as const;
export type CameraMove = typeof CAMERA_MOVES[number]['id'];
export function cameraMove(value: unknown): CameraMove {
  return CAMERA_MOVES.some(move => move.id === value) ? value as CameraMove : 'auto';
}
export function readCameraMoves(value: unknown): Record<string, CameraMove> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id]) => id.length <= 24).map(([id, move]) => [id, cameraMove(move)]));
}
export function cameraDescription(value: unknown, index: number): string {
  const id = cameraMove(value);
  const move = id === 'auto' ? CAMERA_MOVES[1 + index % 3] : CAMERA_MOVES.find(move => move.id === id)!;
  return `${move.label} · ${move.description}`;
}
export const DYNAMIC_VIDEO_EXAMPLE = 'Une visite immobilière vivante, façon drone intérieur : avance franchement dans l’espace libre, contourne la table ou l’îlot quand il est visible, puis révèle la pièce de côté. Varie les mouvements d’un plan à l’autre avec un rythme soutenu et une caméra stable. Garde les meubles, les murs, les portes et les fenêtres à leur place. Relie les pièces par des coupes, sans inventer de passage.';

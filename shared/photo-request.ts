/** Ajouter une précision sans remplacer ni tronquer le brief déjà saisi. */
export function appendPhotoRequest(current: string, addition: string, maximum = 4000): string {
  if (!addition.trim() || current.split('\n').some(line => line.trim() === addition.trim())) return current;
  const next = current ? `${current}\n\n${addition}` : addition;
  return next.length <= maximum ? next : current;
}

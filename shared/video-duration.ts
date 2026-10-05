/** Durée finale confirmée, distincte de la durée des prises fournisseur. */
export const VIDEO_DURATIONS = [5, 10, 15, 20, 25, 30] as const;
export const VIDEO_REQUEST_MAX = 6000;
export function videoDuration(value: unknown): number | null {
  return typeof value === "number" && VIDEO_DURATIONS.includes(value as typeof VIDEO_DURATIONS[number]) ? value : null;
}
export function durationFromBrief(brief: string): number | null {
  const section = brief.match(/Quelle durée[^\n]*\n([\s\S]*?)(?=\n\n|$)/i)?.[1] || "";
  const values = [...section.matchAll(/\b(5|10|15|20|25|30)\s*(?:secondes?|s)\b/gi)].map(match => Number(match[1]));
  return new Set(values).size === 1 ? values[0] : null;
}
export function finalVideoDuration(value: unknown, count: number, brief = ""): number {
  return videoDuration(value) ?? durationFromBrief(brief) ?? Math.min(30, Math.max(5, count * 5));
}

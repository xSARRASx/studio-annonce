export type VideoQuality = "720p" | "1080p";
export type VideoEditing = "montage" | "continue";

export function videoCreditsRequired(duration: number, quality: VideoQuality): number {
  return (duration / 5) * (quality === "1080p" ? 2 : 1);
}

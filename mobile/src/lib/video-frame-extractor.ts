import * as VideoThumbnails from 'expo-video-thumbnails';

export async function extractVideoFrame(uri: string, timeMs: number) {
  const result = await VideoThumbnails.getThumbnailAsync(uri, { time: Math.max(0, Math.round(timeMs)), quality: .95 });
  return result.uri;
}

export async function getVideoDuration(_uri: string): Promise<number> {
  throw new Error('La durée de cette vidéo est indisponible. Essayez un fichier enregistré dans Photos.');
}

export function releaseVideoFrame(_uri: string) {}

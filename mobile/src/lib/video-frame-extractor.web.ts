function openVideo(uri: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error('Cette vidéo ne peut pas être lue dans le navigateur.'));
    video.src = uri;
    video.load();
  });
}

export async function getVideoDuration(uri: string) {
  const video = await openVideo(uri);
  return Number.isFinite(video.duration) ? video.duration * 1000 : 0;
}

export async function extractVideoFrame(uri: string, timeMs: number) {
  const video = await openVideo(uri);
  const time = Math.min(Math.max(0, timeMs / 1000), Math.max(0, video.duration - .04));
  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error('Cet instant de la vidéo ne peut pas être lu.'));
    video.currentTime = time;
  });
  const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Le navigateur ne permet pas d’extraire cette image.');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .94));
  if (!blob?.size) throw new Error('L’image extraite est vide.');
  return URL.createObjectURL(blob);
}

export function releaseVideoFrame(uri: string) {
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

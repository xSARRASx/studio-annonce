import type { ImagePickerAsset } from 'expo-image-picker';
export async function photoPayload(asset: ImagePickerAsset, cleImport: string) {
  const source = asset.file || await (await fetch(asset.uri)).blob();
  const bitmap = await createImageBitmap(source);
  try {
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Cette photo ne peut pas être préparée.');
    context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', .82).split(',', 2)[1];
    return JSON.stringify({ image, cle_import: cleImport });
  } finally { bitmap.close(); }
}
export async function canSavePhoto() { /* Browser downloads are available. */ }
export async function savePhoto(result: Response, filename: string) {
  const url = URL.createObjectURL(await result.blob());
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

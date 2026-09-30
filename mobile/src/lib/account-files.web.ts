import type { ImagePickerAsset } from 'expo-image-picker';
export async function photoForm(asset: ImagePickerAsset) {
  const form = new FormData();
  form.append('fichier', asset.file || await (await fetch(asset.uri)).blob(), asset.fileName || 'photo.jpg');
  return form;
}
export async function canSavePhoto() { /* Browser downloads are available. */ }
export async function savePhoto(result: Response, filename: string) {
  const url = URL.createObjectURL(await result.blob());
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

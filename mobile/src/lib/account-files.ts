import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ImagePickerAsset } from 'expo-image-picker';

export async function photoForm(asset: ImagePickerAsset) {
  const form = new FormData();
  form.append('fichier', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' } as unknown as Blob);
  return form;
}
export async function canSavePhoto() {
  if (!await Sharing.isAvailableAsync()) throw new Error('Le partage de fichiers est indisponible sur cet appareil. Votre photo reste accessible depuis le site.');
}
export async function savePhoto(result: Response, filename: string) {
  const file = new File(Paths.cache, filename);
  file.write(new Uint8Array(await result.arrayBuffer()));
  await Sharing.shareAsync(file.uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle: 'Enregistrer votre photo Studio Annonce' });
}

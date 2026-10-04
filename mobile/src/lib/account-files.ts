import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

export async function photoPayload(asset: ImagePickerAsset, cleImport: string) {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 2048) context.resize(asset.width >= asset.height ? { width: 2048, height: null } : { width: null, height: 2048 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: .82, base64: true });
  if (!result.base64) throw new Error('Cette photo ne peut pas être préparée. Choisissez-la à nouveau.');
  return JSON.stringify({ image: result.base64, cle_import: cleImport });
}
export async function canSavePhoto() {
  if (!await Sharing.isAvailableAsync()) throw new Error('Le partage de fichiers est indisponible sur cet appareil. Votre photo reste accessible depuis le site.');
}
export async function savePhoto(result: Response, filename: string) {
  const file = new File(Paths.cache, filename);
  file.write(new Uint8Array(await result.arrayBuffer()));
  await Sharing.shareAsync(file.uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle: 'Enregistrer votre photo Studio Annonce' });
}

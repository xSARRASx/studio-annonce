import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { extraireVues } from '../../../shared/video-reperage-web';

/** Seules des vignettes JPEG sortent de l'appareil ; jamais le fichier vidéo. */
export async function choisirVuesVideo(): Promise<string[] | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Autorisez l’accès à vos vidéos pour repérer le logement.');
  }
  const choix = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsMultipleSelection: false });
  if (choix.canceled) return null;
  const asset = choix.assets[0];
  const duree = asset.duration;
  if (!duree || duree < 3000 || duree > 180000) throw new Error('Choisissez une visite filmée de 3 secondes à 3 minutes.');
  if (Platform.OS === 'web') {
    if (!asset.file) throw new Error('Cette vidéo ne peut pas être lue dans le navigateur. Décrivez les portes à la main.');
    return extraireVues(asset.file);
  }
  const nombre = Math.min(10, Math.max(6, Math.ceil(duree / 5000)));
  const vues: string[] = [];
  for (let index = 0; index < nombre; index++) {
    const time = Math.min(duree - 100, (index + .5) * duree / nombre);
    const miniature = await VideoThumbnails.getThumbnailAsync(asset.uri, { time, quality: .6 });
    const manipulation = ImageManipulator.manipulate(miniature.uri);
    if (miniature.width > 560 || miniature.height > 360) manipulation.resize(miniature.width >= miniature.height ? { width: 560, height: null } : { width: null, height: 360 });
    const image = await manipulation.renderAsync();
    const jpeg = await image.saveAsync({ format: SaveFormat.JPEG, compress: .68, base64: true });
    if (!jpeg.base64) throw new Error('La vidéo ne peut pas être analysée sur cet appareil.');
    vues.push(jpeg.base64);
  }
  return vues;
}

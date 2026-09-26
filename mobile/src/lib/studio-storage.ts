// Native adapter. Metro chooses studio-storage.web.ts in the browser.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { STORAGE_KEY, type StudioData } from './studio-model';

export async function loadState(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}
export async function saveState(value: StudioData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
export async function storePhoto(id: string, uri: string, mimeType?: string): Promise<string> {
  const directory = new Directory(Paths.document, 'studio-annonce-photos');
  directory.create({ intermediates: true, idempotent: true });
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/heic' ? 'heic' : 'jpg';
  const destination = new File(directory, `${id}.${extension}`);
  new File(uri).copy(destination);
  return destination.uri;
}
export async function photoUri(key: string): Promise<string> {
  if (!new File(key).exists) throw new Error('Local photo missing');
  return key;
}

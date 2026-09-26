import { STORAGE_KEY, type StudioData } from './studio-model';

let database: Promise<IDBDatabase> | undefined;
const urls = new Map<string, string>();
function openDatabase(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('studio-annonce-mobile', 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('studio'); request.result.createObjectStore('photos'); };
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onsuccess = () => resolve(request.result);
    request.onblocked = () => { database = undefined; reject(new Error('Local database blocked')); };
  });
  return database;
}
async function read(store: string, key: string): Promise<unknown> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}
async function write(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Local save interrupted'));
  });
}
export async function loadState(): Promise<unknown> { return read('studio', STORAGE_KEY); }
export async function saveState(value: StudioData): Promise<void> { return write('studio', STORAGE_KEY, value); }
export async function storePhoto(id: string, uri: string, mimeType?: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  if (!blob.size || blob.size > 20 * 1024 * 1024 || !((mimeType ?? blob.type).startsWith('image/'))) throw new Error('Photo not supported');
  await write('photos', id, blob);
  urls.set(id, URL.createObjectURL(blob));
  return id;
}
export async function photoUri(key: string): Promise<string> {
  const existing = urls.get(key);
  if (existing) return existing;
  const blob = await read('photos', key);
  if (!(blob instanceof Blob)) throw new Error('Local photo missing');
  const uri = URL.createObjectURL(blob);
  urls.set(key, uri);
  return uri;
}

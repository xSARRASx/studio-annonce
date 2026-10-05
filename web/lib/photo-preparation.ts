export type PhotoPreparation = { fichiers: File[]; demande: string; choix: string; nouveau: string };
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("studio-annonce-preparations", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function operation(key: string, value?: PhotoPreparation): Promise<PhotoPreparation | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("photos", value ? "readwrite" : "readonly");
    const store = transaction.objectStore("photos");
    const request = value ? store.put(value, key) : store.get(key);
    transaction.oncomplete = () => { db.close(); resolve(value || request.result); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

let writes: Promise<unknown> = Promise.resolve();
export function photoPreparation(key: string, value?: PhotoPreparation): Promise<PhotoPreparation | undefined> {
  const task = writes.catch(() => {}).then(() => operation(key, value));
  writes = task;
  return task;
}

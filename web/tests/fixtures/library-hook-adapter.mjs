// Point d'injection réservé aux tests de courses asynchrones du hook.
export const initialLibrary = () => globalThis.__libraryHookAdapter.initialLibrary();
export const readLibrary = () => globalThis.__libraryHookAdapter.readLibrary();
export const changeLibrary = change => globalThis.__libraryHookAdapter.changeLibrary(change);
export const storageError = error => globalThis.__libraryHookAdapter.storageError(error);

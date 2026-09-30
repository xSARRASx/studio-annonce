import * as SecureStore from 'expo-secure-store';
const KEY = 'studio-annonce.account-session';
export function readSession() { return SecureStore.getItemAsync(KEY); }
export async function writeSession(token: string | null) {
  if (token) await SecureStore.setItemAsync(KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  else await SecureStore.deleteItemAsync(KEY);
}

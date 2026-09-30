// Session storage is separate from preserved demo data and closes with this tab.
const KEY = 'studio-annonce.account-session';
export async function readSession() { return typeof window === 'undefined' ? null : window.sessionStorage.getItem(KEY); }
export async function writeSession(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem(KEY, token);
  else window.sessionStorage.removeItem(KEY);
}

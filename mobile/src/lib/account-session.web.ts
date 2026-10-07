// A verified account stays connected across tabs and browser restarts.
const KEY = 'studio-annonce.account-session';
const WEB_KEY = 'jeton';
export async function readSession() { return typeof window === 'undefined' ? null : window.localStorage.getItem(WEB_KEY) || window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY); }
export async function writeSession(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) { window.localStorage.setItem(KEY, token); window.localStorage.setItem(WEB_KEY, token); window.sessionStorage.setItem(KEY, token); }
  else { window.localStorage.removeItem(KEY); window.localStorage.removeItem(WEB_KEY); window.sessionStorage.removeItem(KEY); }
}

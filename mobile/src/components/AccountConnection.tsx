import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { createAccountApi, type Account, type Health } from '../lib/account-api';
import { readSession, writeSession } from '../lib/account-session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://studioannonce.fr/api';
type Connection = {
  ready: boolean; account: Account | null; health: Health | null; error: string;
  api: ReturnType<typeof createAccountApi>; refresh: () => Promise<void>;
  login: (email: string, code: string) => Promise<void>; logout: () => Promise<void>;
};
const ConnectionContext = createContext<Connection | null>(null);
export function AccountConnection({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState('');
  const [session] = useState(() => {
    let bearer: string | null = null;
    return { get: () => bearer, set: (next: string | null) => { bearer = next; } };
  });
  const route = usePathname();
  const mounted = useRef(true);
  const api = useMemo(() => createAccountApi(API_URL, session.get, expired => {
    if (session.get() !== expired) return;
    session.set(null); setAccount(null); setError('Votre session a expiré. Reconnectez-vous.');
    void writeSession(null).catch(() => setError('Reconnectez-vous. La session locale n’a pas pu être effacée.'));
  }), [session]);
  const refresh = useCallback(async () => {
    const requestedToken = session.get();
    const [service, profile] = await Promise.allSettled([
      api.json<Health>('/sante'), requestedToken ? api.json<Account>('/compte') : Promise.resolve(null),
    ]);
    if (!mounted.current || requestedToken !== session.get()) return;
    if (service.status === 'fulfilled') setHealth(service.value);
    else setHealth(null);
    if (profile.status === 'fulfilled') { setAccount(profile.value); setError(service.status === 'rejected' ? 'Le service est momentanément inaccessible.' : ''); }
    else setError(profile.reason instanceof Error ? profile.reason.message : 'Impossible de synchroniser votre compte.');
  }, [api, session]);
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try { session.set(await readSession()); await refresh(); }
      catch { setError('Votre session n’a pas pu être restaurée. Vous pouvez vous reconnecter.'); }
      finally { if (mounted.current) setReady(true); }
    })();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { mounted.current = false; subscription.remove(); };
  }, [refresh, session]);
  useEffect(() => {
    if (!ready) return;
    // Refresh after the navigation transition, including a return from checkout.
    const pending = requestAnimationFrame(() => { void refresh(); });
    return () => cancelAnimationFrame(pending);
  }, [route, ready, refresh]);
  const login = async (email: string, code: string) => {
    const loginSession = await api.json<{ jeton: string }>('/auth/verifier', { method: 'POST', body: JSON.stringify({ email, code }) });
    await writeSession(loginSession.jeton); session.set(loginSession.jeton);
    await refresh();
  };
  const logout = async () => {
    // The server invalidation must succeed before declaring the session closed.
    await api.json('/auth/deconnexion', { method: 'POST' });
    await writeSession(null); session.set(null); setAccount(null); setError('');
  };
  return <ConnectionContext.Provider value={{ ready, account, health, error, api, refresh, login, logout }}>{children}</ConnectionContext.Provider>;
}
export function useAccount() {
  const value = useContext(ConnectionContext);
  if (!value) throw new Error('AccountConnection missing');
  return value;
}

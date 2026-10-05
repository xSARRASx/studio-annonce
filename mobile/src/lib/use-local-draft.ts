import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Local-only drafts. A failed read never overwrites the existing stored value. */
export function useLocalDraft<T>(key: string | undefined, initial: T, parse: (value: unknown) => T) {
  const [scope, setScope] = useState({ key, draft: initial, ready: !key, writable: !key, notice: '', saved: null as string | null });
  const queue = useRef(Promise.resolve());
  const decoder = useRef(parse);
  const fallback = useRef(initial);
  const matches = scope.key === key;
  const draft = matches ? scope.draft : initial;
  const ready = matches && scope.ready;
  const serialized = JSON.stringify(draft);

  useEffect(() => {
    let active = true;
    // Wait for writes already queued for the old scope before reading again.
    void queue.current.then(() => key ? AsyncStorage.getItem(key) : null).then(raw => {
      if (!active) return;
      const restored = raw === null ? fallback.current : decoder.current(JSON.parse(raw));
      setScope({ key, draft: restored, ready: true, writable: true, saved: raw === null ? null : JSON.stringify(restored), notice: '' });
    }).catch(() => {
      if (active) setScope({ key, draft: fallback.current, ready: true, writable: false, saved: null, notice: 'Le brouillon local ne peut pas être ouvert. Les données existantes sont préservées ; gardez cette page ouverte pour cet essai.' });
    });
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (!ready || !key || !scope.writable || scope.saved === serialized) return;
    let active = true;
    queue.current = queue.current.then(() => AsyncStorage.setItem(key, serialized)).then(() => {
      if (active) setScope(previous => previous.key === key ? { ...previous, saved: serialized, notice: '' } : previous);
    }).catch(() => {
      if (active) setScope(previous => previous.key === key ? { ...previous, notice: 'Enregistrement impossible. Gardez cette page ouverte pour conserver votre brouillon.' } : previous);
    });
    return () => { active = false; };
  }, [ready, key, serialized, scope.writable, scope.saved]);

  const setDraft = useCallback((update: SetStateAction<T>) => {
    setScope(previous => previous.key === key && previous.ready ? { ...previous, draft: typeof update === 'function' ? (update as (draft: T) => T)(previous.draft) : update } : previous);
  }, [key]);

  return { draft, setDraft, ready, notice: matches ? scope.notice : '', saved: !!key && ready && scope.saved === serialized && !scope.notice };
}

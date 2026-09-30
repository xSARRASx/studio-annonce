import React, { useCallback, useRef, useState } from 'react';
import { AppState, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';

type Alert = {
  id: string; nature: 'photo' | 'video'; utilisees: number; limite: number; message: string;
  compte: { id: string; email: string; prenom: string; nom: string; role: string; revision: number };
};
type Alerts = { total: number; page: number; par_page: number; alertes: Alert[] };

/** Uses the same protected alerts and account action as the web administration. */
export function AdminAlerts() {
  const { api, account } = useAccount();
  const [data, setData] = useState<Alerts | null>(null);
  const [page, setPage] = useState(1);
  const reload = useRef<() => void>(() => {});
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending || AppState.currentState === 'background') return;
      pending = true;
      try {
        const result = await api.json<Alerts>(`/admin/alertes?page=${page}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const last = Math.max(1, Math.ceil(result.total / result.par_page));
        if (page > last) { setPage(last); return; }
        setData(result); setError('');
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Les notifications sont indisponibles.'); }
      finally { pending = false; }
    };
    reload.current = () => { void load(); };
    void load();
    const timer = setInterval(() => void load(), 60_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { reload.current = () => {}; controller.abort(); clearInterval(timer); subscription.remove(); };
  }, [api, page]));

  async function unblock() {
    if (!selected || mutation.current || email.trim().toLowerCase() !== selected.compte.email) return;
    mutation.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await api.json(`/admin/comptes/${selected.compte.id}/actions`, { method: 'POST', body: JSON.stringify({
        action: 'reinitialiser_essais', revision: selected.compte.revision, confirmation_email: email.trim(),
      }) });
      setNotice(`Les créations de ${selected.compte.email} sont débloquées sur tous ses appareils.`);
      setSelected(null); setEmail(''); reload.current();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Le compte n’a pas pu être débloqué.');
    } finally { mutation.current = false; setBusy(false); }
  }

  const canManage = (item: Alert) => item.compte.id !== account?.id && item.compte.role !== 'proprietaire'
    && (account?.role === 'proprietaire' || item.compte.role === 'client');

  return <View style={s.card}>
    <Text style={s.eyebrow}>ADMINISTRATION</Text>
    <Text style={s.title}>{data ? `${data.total} notification${data.total === 1 ? '' : 's'} à traiter` : 'Vos notifications'}</Text>
    <Text style={s.body}>Les comptes ayant atteint leur limite de créations, avec le même suivi que sur le site.</Text>
    <Button title={open ? 'Réduire les notifications' : 'Voir les notifications'} secondary onPress={() => setOpen(value => !value)}/>
    {!!error && <Text accessibilityRole="alert" style={s.notice}>{error}</Text>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
    {open && <>
      {!data && !error && <Text style={s.body}>Chargement…</Text>}
      {data?.total === 0 && <Text style={s.body}>Aucun compte à débloquer.</Text>}
      {data?.alertes.map(item => <View key={item.id} style={s.alert}>
        <Text style={s.name}>{`${item.compte.prenom} ${item.compte.nom}`.trim() || 'Profil à compléter'}</Text>
        <Text selectable style={s.body}>{item.compte.email}</Text>
        <Text style={s.quota}>{item.utilisees} / {item.limite} {item.nature === 'photo' ? 'photos' : 'vidéos'}</Text>
        <Text style={s.body}>{item.message}</Text>
        {canManage(item) ? <Button title="Débloquer les créations" secondary onPress={() => { setSelected(item); setEmail(''); setError(''); }}/>
          : <Text style={s.body}>Ce niveau d’accès est protégé.</Text>}
      </View>)}
      {!!data && data.total > data.par_page && <View style={s.pagination}>
        <Button title="Précédent" secondary disabled={page === 1} onPress={() => setPage(value => value - 1)}/>
        <Text style={s.body}>{page} / {Math.ceil(data.total / data.par_page)}</Text>
        <Button title="Suivant" secondary disabled={page * data.par_page >= data.total} onPress={() => setPage(value => value + 1)}/>
      </View>}
      <Button title="Actualiser les notifications" secondary onPress={() => reload.current()}/>
    </>}
    <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => { if (!mutation.current) setSelected(null); }}>
      <View style={s.scrim}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.dialog}>
        <Text style={s.title}>Débloquer les créations ?</Text>
        <Text style={s.name}>{selected?.compte.email}</Text>
        <Text style={s.body}>Les compteurs photo et vidéo seront remis à zéro sur le site et sur mobile. Les crédits et les corrections incluses restent inchangés. Cette action est enregistrée dans le journal.</Text>
        <Text style={s.body}>Recopiez l’email du compte pour confirmer.</Text>
        <TextInput accessibilityLabel="Email du compte à débloquer" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} style={s.input} editable={!busy}/>
        {!!error && <Text accessibilityRole="alert" style={s.notice}>{error}</Text>}
        <Button title={busy ? 'Déblocage…' : 'Confirmer le déblocage'} disabled={busy || email.trim().toLowerCase() !== selected?.compte.email} onPress={() => void unblock()}/>
        <Button title="Annuler" secondary disabled={busy} onPress={() => setSelected(null)}/>
      </ScrollView></View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  card: { padding: 19, borderRadius: 23, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e1e5d9', gap: 14 },
  eyebrow: { fontSize: 11, color: colors.muted, letterSpacing: 1.4, fontWeight: '600' },
  title: { fontSize: 20, color: colors.ink, lineHeight: 27, fontWeight: '600' },
  name: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  body: { fontSize: 13, lineHeight: 21, color: colors.muted },
  alert: { borderTopWidth: 1, borderColor: '#e1e5d9', paddingTop: 17, gap: 10 },
  quota: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  notice: { fontSize: 13, lineHeight: 21, color: '#655831', backgroundColor: '#f5efdd', padding: 12, borderRadius: 12 },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  scrim: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(35,42,28,.45)' },
  dialog: { padding: 22, backgroundColor: colors.cream, borderRadius: 22, gap: 16, maxWidth: 520, width: '100%', alignSelf: 'center' },
  input: { fontSize: 16, borderWidth: 1, borderColor: '#dce1d1', borderRadius: 13, padding: 13, backgroundColor: '#fffefa', color: colors.ink },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';

type Cost = { id: string; fournisseur: string; reference: string; montant_centimes: number; compte: string; date: string; annule: boolean };
type Commerce = { encaissements_bruts_centimes: number; remboursements_centimes: number; ca_total_centimes: number; retouches_creees: number; videos_creees: number; note_couts: string;
  frais: { montant_centimes: number | null; marge_provisoire_centimes: number | null; lignes: Cost[] };
  par_compte: { id: string; nom: string; email: string; retouches_creees: number; videos_creees: number; ca_photo_centimes: number; ca_video_centimes: number; remboursements_centimes: number; frais_centimes: number | null }[] };
const euro = (v: number) => (v / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Le tableau n’a pas pu être actualisé.';

export function AdminCommerce() {
  const { api } = useAccount();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Commerce | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState(false);
  const [provider, setProvider] = useState('Higgsfield');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState('video');
  const [account, setAccount] = useState('');
  const [cancelId, setCancelId] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useFocusEffect(useCallback(() => { setRefresh(v => v + 1); }, []));
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    api.json<Commerce>('/admin/activite-commerciale', { signal: controller.signal }).then(value => { if (!controller.signal.aborted) { setData(value); setError(''); } }).catch(e => { if (!controller.signal.aborted) setError(errorText(e)); });
    return () => controller.abort();
  }, [api, open, refresh]);
  async function save() {
    if (lock.current) return;
    const cents = Math.round(Number(amount.replace(',', '.')) * 100);
    if (!/^[0-9]+([.,][0-9]{1,2})?$/.test(amount) || !Number.isSafeInteger(cents) || cents <= 0 || !reference.trim()) { setError('Indiquez le montant payé en euros et la référence du justificatif.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { await api.json('/admin/frais', { method: 'POST', body: JSON.stringify({ fournisseur: provider, reference: reference.trim(), nature: kind, montant_centimes: cents, date, compte_id: account || null }) }); setReference(''); setAmount(''); setForm(false); setRefresh(v => v + 1); }
    catch (e) { setError(errorText(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function cancel() {
    if (!cancelId || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await api.json(`/admin/frais/${encodeURIComponent(cancelId)}/annuler`, { method: 'POST' }); setCancelId(''); setRefresh(v => v + 1); }
    catch (e) { setError(errorText(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View style={s.card}><Text style={s.title}>Administration · Ventes et créations</Text><Text style={s.body}>Les ventes, remboursements, créations et frais, communs au site et à l’application.</Text><Button secondary title={open ? 'Réduire le tableau' : 'Voir le tableau administrateur'} onPress={() => setOpen(v => !v)}/>
    {open && <>{!data && !error && <ActivityIndicator color={colors.ink}/>} {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
      {data && <><View style={s.metrics}>{[['Encaissements bruts', euro(data.encaissements_bruts_centimes)], ['Remboursements', euro(data.remboursements_centimes)], ['Chiffre d’affaires net', euro(data.ca_total_centimes)], ['Retouches créées', String(data.retouches_creees)], ['Vidéos lancées', String(data.videos_creees)], ['Frais réels saisis', data.frais.montant_centimes != null ? euro(data.frais.montant_centimes) : 'À renseigner'], ['Marge provisoire', data.frais.marge_provisoire_centimes != null ? euro(data.frais.marge_provisoire_centimes) : 'À rapprocher']].map(([label, value]) => <View style={s.metric} key={label}><Text style={s.small}>{label}</Text><Text style={s.title}>{value}</Text></View>)}</View>
      <Text style={s.small}>{data.note_couts}</Text><Button title="Ajouter des frais réels" secondary onPress={() => { setError(''); setForm(true); }}/>
      <Text style={s.title}>Activité par compte</Text>{data.par_compte.map(c => <View style={s.row} key={c.id}><Text style={s.title}>{c.nom || c.email}</Text><Text style={s.small}>{c.email}</Text><Text style={s.body}>{c.retouches_creees} retouche(s) · {c.videos_creees} vidéo(s)</Text><Text style={s.body}>Ventes photo : {euro(c.ca_photo_centimes)} · vidéo : {euro(c.ca_video_centimes)}</Text><Text style={s.small}>Remboursements : {euro(c.remboursements_centimes)} · Frais saisis : {c.frais_centimes != null ? euro(c.frais_centimes) : 'À rapprocher'}</Text></View>)}
      {!!data.frais.lignes.length && <Text style={s.title}>Frais rapprochés des justificatifs</Text>}{data.frais.lignes.map(f => <View key={f.id} style={s.row}><Text style={s.title}>{f.fournisseur} · {euro(f.montant_centimes)}</Text><Text style={s.small}>{f.date} · {f.reference} · {f.compte}</Text>{f.annule ? <Text style={s.small}>Saisie annulée</Text> : <Button secondary title="Annuler la saisie" disabled={busy} onPress={() => setCancelId(f.id)}/>}</View>)}
      </>}<Button title="Actualiser le tableau" secondary onPress={() => setRefresh(v => v + 1)}/></>}
    <Modal visible={form} transparent animationType="fade" onRequestClose={() => { if (!busy) setForm(false); }}><View style={s.scrim}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.dialog}>
      <Text style={s.title}>Ajouter des frais réels</Text><Text style={s.small}>Le montant réellement facturé en euros sur un justificatif fournisseur ou bancaire. Une recharge API n’est pas le coût d’une génération.</Text>
      <Text style={s.body}>Fournisseur</Text><View style={s.choices}>{['OpenAI', 'Higgsfield', 'Stripe', 'Stockage', 'Autre'].map(p => <Button key={p} secondary={provider !== p} title={p} onPress={() => setProvider(p)}/>)}</View>
      <Text style={s.body}>Montant payé (€)</Text><TextInput accessibilityLabel="Montant payé en euros" keyboardType="decimal-pad" style={s.input} value={amount} onChangeText={setAmount} placeholder="Ex. : 1,96"/>
      <Text style={s.body}>Référence du justificatif</Text><TextInput accessibilityLabel="Référence du justificatif" maxLength={160} style={s.input} value={reference} onChangeText={setReference}/>
      <Text style={s.body}>Date (AAAA-MM-JJ)</Text><TextInput accessibilityLabel="Date du frais" style={s.input} value={date} onChangeText={setDate}/>
      <Text style={s.body}>Produit</Text><View style={s.choices}>{[['video', 'Vidéo'], ['photo', 'Photo'], ['autre', 'Autres frais']].map(([id, label]) => <Button key={id} title={label} secondary={kind !== id} onPress={() => setKind(id)}/>)}</View>
      <Text style={s.body}>Compte concerné (facultatif)</Text><Button title="Frais du studio" secondary={!!account} onPress={() => setAccount('')}/>{data?.par_compte.map(c => <Button key={c.id} title={c.nom || c.email} secondary={account !== c.id} onPress={() => setAccount(c.id)}/>)}
      {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}<Button title={busy ? 'Enregistrement…' : 'Enregistrer ces frais'} disabled={busy} onPress={() => void save()}/><Button title="Fermer" secondary disabled={busy} onPress={() => setForm(false)}/>
    </ScrollView></View></Modal>
    <Modal visible={!!cancelId} transparent animationType="fade" onRequestClose={() => { if (!busy) setCancelId(''); }}><View style={s.scrim}><View style={s.dialog}><Text style={s.title}>Retirer ces frais du calcul ?</Text><Text style={s.body}>La saisie reste conservée dans l’historique.</Text>{!!error && <Text accessibilityRole="alert">{error}</Text>}<Button title="Confirmer l’annulation de la saisie" disabled={busy} onPress={() => void cancel()}/><Button secondary title="Garder ces frais" disabled={busy} onPress={() => setCancelId('')}/></View></View></Modal>
  </View>;
}
const s = StyleSheet.create({ card: { padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#dce2d1', backgroundColor: '#fffefa', gap: 12 }, title: { color: colors.ink, fontWeight: '600', fontSize: 17 }, body: { color: colors.ink, fontSize: 14, lineHeight: 21 }, small: { color: colors.muted, fontSize: 13, lineHeight: 20 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { flexGrow: 1, flexBasis: '44%', padding: 12, borderRadius: 12, backgroundColor: colors.sage, gap: 8 }, row: { paddingVertical: 12, borderTopWidth: 1, borderColor: '#dce2d1', gap: 6 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#bfc9b2', minHeight: 44, padding: 12, borderRadius: 10, color: colors.ink }, scrim: { flex: 1, padding: 20, backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'center' }, dialog: { padding: 20, borderRadius: 20, backgroundColor: colors.cream, gap: 14 } });

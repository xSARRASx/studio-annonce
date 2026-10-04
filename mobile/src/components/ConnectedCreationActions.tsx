import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';

export type CreationAction = { id: string; nature: 'photos' | 'videos'; titre: string; vignette?: string; action: 'archiver' | 'supprimer' };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Réessayez dans un instant.';
export function ConnectedCreationConfirmation({ item, onClose, onDone }: { item: CreationAction; onClose: () => void; onDone: () => void }) {
  const { api } = useAccount(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const archive = item.action === 'archiver'; const name = item.nature === 'photos' ? 'photo' : 'vidéo';
  async function confirm() {
    if (busy) return; setBusy(true); setError('');
    try { await api.json(archive ? `/photos/${item.id}/archiver` : `/creations/${item.nature}/${item.id}`, { method: archive ? 'POST' : 'DELETE' }); onDone(); }
    catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }
  return <Modal transparent visible animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}><View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal>
    <Text style={s.title}>{archive ? 'Archiver' : 'Supprimer'} cette {name} ?</Text>
    {item.vignette && <Image source={{ uri: item.vignette }} style={s.preview}/>}<Text style={s.title}>{item.titre}</Text>
    <Text style={s.small}>{archive ? 'Elle sera rangée dans vos archives, où vous pourrez la restaurer.' : 'Elle sera retirée de Mes créations et placée dans la corbeille. Vous pourrez la restaurer en cas d’erreur.'}</Text>
    {item.nature === 'photos' && <Text style={s.small}>L’original et ses retouches restent ensemble. Les vidéos déjà créées restent disponibles.</Text>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Button title={busy ? 'En cours…' : archive ? 'Oui, archiver' : 'Oui, supprimer'} disabled={busy} onPress={() => void confirm()}/><Button secondary title="Annuler" disabled={busy} onPress={onClose}/>
  </View></View></Modal>;
}
export function ConnectedCreationFeedback({ text, onClose }: { text: string; onClose: () => void }) {
  return <Modal transparent visible={!!text} animationType="fade" onRequestClose={onClose}><View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal><Text accessibilityLiveRegion="polite" style={s.title}>{text}</Text><Button title="Terminé" onPress={onClose}/></View></View></Modal>;
}
type Item = { id: string; nature: 'photos' | 'videos'; titre: string; logement: string; vignette: string; duree?: number; url?: string; en_cours: boolean; statut?: string };
export function ConnectedCreationExtras({ revision, onChange }: { revision: number; onChange: () => void }) {
  const { api } = useAccount(); const [trash, setTrash] = useState(false); const [items, setItems] = useState<Item[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(''); const [confirmation, setConfirmation] = useState<CreationAction | null>(null); const [feedback, setFeedback] = useState('');
  useFocusEffect(useCallback(() => { let active = true; void api.json<Item[]>(`/creations?corbeille=${trash}`).then(data => { if (active) { setItems(data); setError(''); setLoading(false); } }).catch(cause => { if (active) { setItems([]); setError(errorMessage(cause)); setLoading(false); } }); return () => { active = false; }; }, [api, trash, revision]));
  async function restore(item: Item) {
    if (busy) return; setBusy(item.id); setError('');
    try { await api.json(`/creations/${item.nature}/${item.id}/restaurer`, { method: 'POST' }); setItems(current => current.filter(p => p.id !== item.id)); setFeedback('Création restaurée dans Mes créations.'); onChange(); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(''); }
  }
  return <View style={s.card}><Text style={s.title}>{trash ? 'Ma corbeille' : 'Mes vidéos'}</Text><Button secondary title={trash ? 'Voir mes vidéos' : 'Ouvrir la corbeille'} onPress={() => { setTrash(value => !value); setLoading(true); }}/>
    {!!error && <><Text accessibilityRole="alert" style={s.error}>{error}</Text><Button secondary title="Réessayer" onPress={onChange}/></>}
    {loading ? <ActivityIndicator/> : !items.length ? <Text style={s.small}>{trash ? 'La corbeille est vide.' : 'Vos vidéos apparaîtront ici après leur création.'}</Text> : items.map(item => <View key={`${item.nature}-${item.id}`} style={s.card}>
      {!!item.vignette && <Image source={{ uri: item.vignette }} style={s.preview}/>}<Text style={s.title}>{item.titre}</Text><Text style={s.small}>{item.nature === 'photos' ? item.logement : `${item.duree || 5} secondes · ${item.en_cours ? 'En cours' : item.statut === 'echec' ? 'À vérifier' : 'Terminée'}`}</Text>
      {!trash && !!item.url && <Button secondary title="Voir la vidéo" onPress={() => void Linking.openURL(item.url!).catch(cause => setError(errorMessage(cause)))}/>}
      {trash ? <Button secondary title={busy === item.id ? 'Restauration…' : 'Restaurer'} disabled={!!busy} onPress={() => void restore(item)}/> : <Button secondary title="Supprimer la vidéo" disabled={item.en_cours} onPress={() => setConfirmation({ ...item, action: 'supprimer' })}/>}
      {item.en_cours && <Text style={s.small}>Vous pourrez la supprimer une fois sa création terminée.</Text>}
    </View>)}
    {confirmation && <ConnectedCreationConfirmation key={confirmation.id} item={confirmation} onClose={() => setConfirmation(null)} onDone={() => { setConfirmation(null); setFeedback('Vidéo déplacée dans la corbeille.'); onChange(); }}/>}<ConnectedCreationFeedback text={feedback} onClose={() => setFeedback('')}/>
  </View>;
}
const s = StyleSheet.create({ scrim: { flex: 1, backgroundColor: '#20271988', padding: 20, justifyContent: 'center', alignItems: 'center' }, dialog: { width: '100%', maxWidth: 420, backgroundColor: '#fffefa', borderRadius: 22, padding: 20, gap: 13 }, card: { backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#dce2d1', padding: 15, borderRadius: 18, gap: 12 }, title: { fontSize: 17, fontWeight: '600', color: colors.ink }, small: { fontSize: 13, lineHeight: 20, color: colors.muted }, error: { color: '#973f28', fontSize: 13, lineHeight: 20 }, preview: { width: '100%', height: 100, borderRadius: 12, resizeMode: 'cover' } });

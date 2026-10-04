import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';
import { ApiError, type AccountPhoto, type Property } from '../lib/account-api';

const message = (error: unknown) => error instanceof Error ? error.message : 'Cette action n’a pas abouti.';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function ConnectedLibraryContent() {
  const { api, account, health, refresh } = useAccount();
  const [properties, setProperties] = useState<Property[]>([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [oldest, setOldest] = useState(false); const [archives, setArchives] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]); const [notice, setNotice] = useState('');
  const [archive, setArchive] = useState<string | null>(null); const [archiving, setArchiving] = useState(false);
  const [prompt, setPrompt] = useState(''); const [running, setRunning] = useState(false);
  const [jobs, setJobs] = useState<Record<string, string>>({}); const active = useRef(false);
  const load = useCallback(async () => {
    try { setProperties(await api.json<Property[]>('/logements?archives=true')); }
    catch (error) { setNotice(message(error)); } finally { setLoading(false); }
  }, [api]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const photos = properties.flatMap(property => property.photos.map(photo => ({ ...photo, home: property.nom, homeId: property.id })))
    .sort((a, b) => ((a.cree_le || '').localeCompare(b.cree_le || '') || (a.ordre || 0) - (b.ordre || 0)) * (oldest ? 1 : -1));
  const selected = chosen.flatMap(id => { const photo = photos.find(item => item.id === id && !item.archivee); return photo ? [photo] : []; });
  async function archivePhoto(restore = false, id = archive || '') {
    if (!id || archiving) return; setArchiving(true);
    try { await api.json(`/photos/${id}/${restore ? 'restaurer' : 'archiver'}`, { method: 'POST' }); setChosen(current => current.filter(item => item !== id)); setArchive(null); await load(); setNotice(restore ? 'Photo restaurée.' : 'Photo archivée. Vous pouvez la restaurer dans les archives.'); }
    catch (error) { setNotice(message(error)); } finally { setArchiving(false); }
  }
  async function batch() {
    if (active.current || !selected.length || !prompt.trim() || prompt.length > 4000 || !health?.retouche_disponible || account?.limites?.photo.bloque) return;
    if (selected.some(photo => photo.essais)) { setNotice('Pour corriger une photo déjà retouchée, ouvrez-la et choisissez sa version de départ. Le lot est réservé aux premières retouches.'); return; }
    active.current = true; setRunning(true); setNotice('');
    const queue = [...selected]; setJobs(Object.fromEntries(queue.map(photo => [photo.id, 'En attente'])));
    const update = (id: string, status: string) => setJobs(previous => ({ ...previous, [id]: status }));
    const worker = async () => {
      let photo;
      while ((photo = queue.shift())) {
        update(photo.id, 'Retouche en cours…');
        try {
          try { await api.json<AccountPhoto>(`/photos/${photo.id}/essai`, { method: 'POST', body: JSON.stringify({ demande: prompt.trim(), depuis_version_id: null }) }); }
          catch (error) {
            if (!(error instanceof ApiError) || ![0, 409, 502, 504].includes(error.status)) throw error;
            let recovered = false;
            for (let turn = 0; turn < 36; turn++) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              const state = await api.json<AccountPhoto>(`/photos/${photo.id}`).catch(() => null);
              if (state?.versions.length) { recovered = true; break; }
            }
            if (!recovered) throw new Error('Réponse interrompue : ouvrez cette photo pour vérifier le résultat avant un nouvel essai.');
          }
          update(photo.id, 'Prête · ouvrir pour comparer');
        } catch (error) { update(photo.id, message(error)); }
      }
    };
    try { await Promise.all([worker(), worker()]); await load(); await refresh(); }
    finally { active.current = false; setRunning(false); }
  }
  return <>
    <Button title={account?.gratuit_illimite ? 'Retoucher de nouvelles photos' : account?.photo_offerte_disponible ? 'Préparer ma photo offerte' : 'Ajouter des photos'} onPress={() => router.navigate('/nouvelle')}/>
    <Button secondary title="Préparer une vidéo" onPress={() => router.navigate('/visite')}/>
    <View style={s.card}><TextInput accessibilityLabel="Retrouver une création" value={search} onChangeText={setSearch} placeholder="Une pièce ou un logement…" style={s.input}/><View style={s.row}><Button secondary title={oldest ? 'Les plus anciennes' : 'Les plus récentes'} onPress={() => setOldest(value => !value)}/><Button secondary title={archives ? 'Voir mes photos actives' : 'Voir mes archives'} onPress={() => setArchives(value => !value)}/></View></View>
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
    {loading ? <ActivityIndicator/> : <View style={s.grid}>{photos.filter(photo => !!photo.archivee === archives && normalize(`${photo.home} ${photo.titre || ''}`).includes(normalize(search))).map(photo => <View key={photo.id} style={[s.tile, chosen.includes(photo.id) && s.chosen]}>
      <Pressable accessibilityRole="button" disabled={archives || running} accessibilityState={{ selected: chosen.includes(photo.id) }} accessibilityLabel={`Sélectionner ${photo.titre || 'Photo'} · ${photo.home}`} onPress={() => setChosen(current => current.includes(photo.id) ? current.filter(id => id !== photo.id) : [...current, photo.id])}><Image source={{ uri: photo.vignette }} style={s.thumb}/><Text style={s.title}>{chosen.includes(photo.id) ? `${chosen.indexOf(photo.id) + 1} · ` : ''}{photo.titre || `Photo ${(photo.ordre || 0) + 1}`}</Text><Text style={s.small}>{photo.home} · {photo.essais ? 'Retouche disponible' : 'Original'}</Text></Pressable>
      {!!jobs[photo.id] && <Text accessibilityLiveRegion="polite" style={s.small}>{jobs[photo.id]}</Text>}
      <Button secondary title="Ouvrir" onPress={() => router.push({ pathname: '/retouche', params: { id: photo.id, mode: 'compte' } })}/>
      <Pressable accessibilityRole="button" disabled={archiving || running} onPress={() => archives ? void archivePhoto(true, photo.id) : setArchive(photo.id)}><Text style={s.link}>{archives ? 'Restaurer' : 'Archiver'}</Text></Pressable>
    </View>)}</View>}
    {!loading && !photos.some(photo => !!photo.archivee === archives) && <Text style={s.small}>{archives ? 'Aucune photo archivée.' : 'Ajoutez vos premières photos pour les retrouver ici.'}</Text>}
    {!!selected.length && !archives && <View style={s.card}><Text style={s.title}>{selected.length} photos choisies</Text><Text style={s.small}>{account?.gratuit_illimite ? 'Sans débit sur votre compte.' : `Si vous gardez toutes les retouches en HD : ${selected.filter(photo => !photo.offerte && !photo.creditee).length} crédits. Vous décidez pour chacune.`}</Text>
      <Button secondary title="Retoucher une par une" onPress={() => router.push({ pathname: '/retouche', params: { id: selected[0].id, mode: 'compte', lot: selected.map(photo => photo.id).join(',') } })}/>
      <Button secondary title="Préparer la vidéo avec cette sélection" disabled={selected.length > 6 || new Set(selected.map(photo => photo.homeId)).size > 1} onPress={() => router.push({ pathname: '/visite', params: { photos: selected.map(photo => photo.id).join(',') } })}/>
      <Text style={s.label}>Une même demande pour les premières retouches</Text><TextInput accessibilityLabel="Demande pour la retouche du lot" value={prompt} onChangeText={setPrompt} editable={!running} multiline maxLength={4000} placeholder="Éclaircir les photos et ranger les objets, garder les pièces identiques…" style={[s.input, s.multiline]}/><Text style={s.small}>Deux photos au maximum sont traitées en même temps. Chaque résultat se retrouve dans sa photo.</Text><Button title={running ? 'Retouches en cours…' : `Lancer les ${selected.length} premières retouches`} onPress={() => void batch()} disabled={running || !prompt.trim() || selected.some(photo => photo.essais > 0) || !health?.retouche_disponible || account?.limites?.photo.bloque}/>
    </View>}
    <Button secondary title="Actualiser mes créations" onPress={() => { void load(); void refresh(); }}/>
    <Modal visible={!!archive} transparent onRequestClose={() => setArchive(null)}><View style={s.scrim}><View style={s.card}><Text style={s.title}>Archiver cette photo ?</Text><Text style={s.small}>Elle sera masquée dans vos créations. Son original et ses versions seront conservés et pourront être restaurés.</Text><Button title={archiving ? 'Archivage…' : 'Archiver la photo'} disabled={archiving} onPress={() => void archivePhoto()}/><Button secondary title="Annuler" disabled={archiving} onPress={() => setArchive(null)}/></View></View></Modal>
  </>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#dce2d1', padding: 17, borderRadius: 20, gap: 13 }, input: { borderWidth: 1, borderColor: '#dce2d1', borderRadius: 12, padding: 13, color: colors.ink, fontSize: 16, backgroundColor: '#f5f7f0' }, multiline: { minHeight: 100, textAlignVertical: 'top' }, title: { fontSize: 17, fontWeight: '600', color: colors.ink }, label: { fontSize: 14, fontWeight: '600', color: colors.ink }, small: { color: colors.muted, fontSize: 12, lineHeight: 19 }, row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, grid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' }, tile: { width: '47%', maxWidth: 375, flexGrow: 1, padding: 10, gap: 9, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 18, backgroundColor: '#fffefa' }, chosen: { borderColor: '#738d55', backgroundColor: '#eff4e8' }, thumb: { width: '100%', aspectRatio: 1.3, borderRadius: 11 }, link: { fontSize: 13, color: '#566847', minHeight: 38, paddingVertical: 9 }, notice: { backgroundColor: '#f7eddd', padding: 13, borderRadius: 12, fontSize: 13, lineHeight: 20, color: '#75553c' }, scrim: { flex: 1, backgroundColor: '#20271988', padding: 24, justifyContent: 'center' },
});

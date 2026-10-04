import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAccount } from './AccountConnection';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { Button, colors } from './Studio';
import { ApiError, type CreatedVideo, type Property } from '../lib/account-api';
import { CAMERA_MOVES, cameraDescription, readCameraMoves, DYNAMIC_VIDEO_EXAMPLE, type CameraMove } from '../../../shared/video-direction';
import { useLocalDraft } from '../lib/use-local-draft';

type Draft = { movements: Record<string, CameraMove>; ids: string[]; versions: Record<string, string>; idea: string; intent: string; videoId: string };
const empty: Draft = { movements: {}, ids: [], versions: {}, idea: '', intent: '', videoId: '' };
function readDraft(value: unknown): Draft {
  const v = value as Partial<Draft>;
  if (!v || typeof v !== 'object') throw new Error('Brouillon illisible');
  return { movements: readCameraMoves(v.movements), ids: Array.isArray(v.ids) ? v.ids.filter((id): id is string => typeof id === 'string').slice(0, 6) : [],
    versions: v.versions && typeof v.versions === 'object' ? Object.fromEntries(Object.entries(v.versions).filter(([, id]) => typeof id === 'string')) : {},
    idea: typeof v.idea === 'string' ? v.idea.slice(0, 20000) : '', intent: typeof v.intent === 'string' ? v.intent.slice(0, 20000) : '', videoId: typeof v.videoId === 'string' ? v.videoId : '' };
}
const pending = (video: CreatedVideo | null) => !!video && ['preparation', 'en_attente', 'clips', 'montage'].includes(video.statut);
const message = (error: unknown) => error instanceof Error ? error.message : 'Cette action n’a pas abouti.';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function ConnectedVideoPreparation() {
  const { api, account, health } = useAccount();
  const params = useLocalSearchParams<{ photos?: string; version?: string }>();
  const { draft, setDraft, ready, notice: storageNotice } = useLocalDraft(`studio:${account?.id}:video.v2`, empty, readDraft);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true); const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState(''); const [notice, setNotice] = useState('');
  const [video, setVideo] = useState<CreatedVideo | null>(null); const [starting, setStarting] = useState(false);
  const [syncedVideoId, setSyncedVideoId] = useState('');
  const restored = !draft.videoId || syncedVideoId === draft.videoId;
  const seeded = useRef(''); const launching = useRef(false);
  const load = useCallback(async () => {
    try { setProperties(await api.json<Property[]>('/logements')); }
    catch (error) { setNotice(message(error)); } finally { setLoading(false); }
  }, [api]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    const seed = `${params.photos || ''}:${params.version || ''}`;
    if (!ready || !params.photos || seeded.current === seed) return;
    seeded.current = seed;
    const ids = [...new Set(params.photos.split(',').filter(Boolean))].slice(0, 6);
    setDraft(previous => ({ ...previous, ids, versions: params.version !== undefined && ids.length === 1 ? { ...previous.versions, [ids[0]]: params.version } : previous.versions }));
  }, [ready, params.photos, params.version, setDraft]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    if (!draft.videoId) return;
    void api.json<CreatedVideo>(`/videos/${encodeURIComponent(draft.videoId)}`).then(result => { if (active) setVideo(result); }).catch(error => { if (active) setNotice(message(error)); }).finally(() => { if (active) setSyncedVideoId(draft.videoId); });
    return () => { active = false; };
  }, [ready, draft.videoId, api]);
  const videoId = video?.id; const isPending = pending(video);
  useEffect(() => {
    if (!videoId || !isPending) return;
    let active = true; let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try { const result = await api.json<CreatedVideo>(`/videos/${encodeURIComponent(videoId)}`); if (active) { setVideo(result); setNotice(''); } }
      catch { if (active) setNotice('Le suivi est momentanément interrompu. Ce même projet sera vérifié sans relancer les plans terminés.'); }
      finally { if (active) timer = setTimeout(refresh, 5000); }
    };
    timer = setTimeout(refresh, 5000);
    return () => { active = false; clearTimeout(timer); };
  }, [videoId, isPending, api]);
  useFocusEffect(useCallback(() => { if (videoId) void api.json<CreatedVideo>(`/videos/${encodeURIComponent(videoId)}`).then(setVideo).catch(() => {}); }, [api, videoId]));
  const photos = properties.flatMap(property => [...property.photos].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map(photo => ({ ...photo, homeId: property.id, home: property.nom })));
  const selected = draft.ids.flatMap(id => { const photo = photos.find(p => p.id === id); return photo ? [photo] : []; });
  const sameHome = new Set(selected.map(photo => photo.homeId)).size <= 1;
  const locked = starting || isPending || !!draft.intent;
  function choose(id: string) {
    if (locked) return;
    if (!draft.ids.includes(id) && draft.ids.length >= 6) { setNotice('Choisissez au maximum six photos pour une vidéo de 30 secondes.'); return; }
    setDraft(previous => ({ ...previous, ids: previous.ids.includes(id) ? previous.ids.filter(p => p !== id) : [...previous.ids, id] }));
  }
  function move(index: number, direction: number) {
    if (locked || index + direction < 0 || index + direction >= draft.ids.length) return;
    setDraft(previous => { const ids = [...previous.ids]; [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]; return { ...previous, ids }; });
  }
  async function start() {
    if (launching.current || !ready || !restored || !selected.length || !sameHome || draft.idea.trim().length < 3 || draft.idea.trim().length > 3000 || isPending || !account?.gratuit_illimite || !health?.video_disponible) return;
    launching.current = true; setStarting(true); setNotice('');
    const body = draft.intent || JSON.stringify({ cle_demande: Crypto.randomUUID(), demande: draft.idea.trim(), photos: selected.map(photo => ({ mouvement: draft.movements[photo.id] || 'auto', photo_id: photo.id, version_id: draft.versions[photo.id] ?? photo.version_gardee ?? '' })) });
    setDraft(previous => ({ ...previous, intent: body }));
    try {
      let result: CreatedVideo;
      try { result = await api.json<CreatedVideo>('/videos/visites', { method: 'POST', body }); }
      catch (error) { if (!(error instanceof ApiError) || ![0, 502, 504].includes(error.status)) throw error; result = await api.json<CreatedVideo>('/videos/visites', { method: 'POST', body }); }
      setVideo(result); setDraft(previous => ({ ...previous, videoId: result.id }));
    } catch (error) {
      setNotice(message(error));
      if (error instanceof ApiError && error.status === 409) {
        try { const existing = await api.json<CreatedVideo | null>(`/videos/photos/${selected[0].id}/derniere`); if (existing && pending(existing)) { setVideo(existing); setDraft(previous => ({ ...previous, videoId: existing.id })); } } catch { /* Conserver l'intention pour la reprise. */ }
      }
    } finally { launching.current = false; setStarting(false); }
  }
  return <>
    {!!(notice || storageNotice) && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice || storageNotice}</Text>}
    <View style={s.card}><Text style={s.title}>1 · Vos photos, dans votre ordre</Text><Text style={s.body}>Un plan de 5 secondes par photo, jusqu’à 30 secondes. Choisissez les photos d’un même logement.</Text>
      <Button secondary title={picker ? 'Masquer mes photos' : 'Choisir dans mes créations'} onPress={() => setPicker(value => !value)}/>
      {picker && <><TextInput accessibilityLabel="Retrouver une photo ou un logement" value={search} onChangeText={setSearch} placeholder="Salon, chambre, logement…" style={s.input}/>{loading ? <ActivityIndicator/> : <View style={s.grid}>{photos.filter(photo => normalize(`${photo.home} ${photo.titre || ''}`).includes(normalize(search))).map(photo => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel={`${photo.home}, ${photo.titre || 'Photo'}`} accessibilityState={{ selected: draft.ids.includes(photo.id), disabled: locked }} disabled={locked} onPress={() => choose(photo.id)} style={[s.tile, draft.ids.includes(photo.id) && s.chosen]}><Image source={{ uri: photo.vignette }} style={s.thumb}/><Text style={s.small}>{draft.ids.includes(photo.id) ? `${draft.ids.indexOf(photo.id) + 1} · ` : ''}{photo.titre || 'Photo'} · {photo.home}</Text></Pressable>)}</View>}</>}
      {!locked && <Button secondary title="Ajouter des photos ou le lien de mon annonce" onPress={() => router.push({ pathname: '/nouvelle', params: { retour: 'visite' } })}/>}
      {selected.map((photo, index) => <View key={photo.id} style={s.plan}><Image source={{ uri: photo.vignette }} style={s.mini}/><View style={s.flex}><Text style={s.label}>{index + 1} · {photo.titre || 'Photo'} · 5 secondes</Text><Text style={s.small}>{photo.home}</Text><Text style={s.label}>Mouvement de caméra</Text><View style={s.row}>{CAMERA_MOVES.map(move => <Pressable key={move.id} accessibilityRole="button" accessibilityLabel={`${move.label}, plan ${index + 1}`} disabled={locked} accessibilityState={{ selected: (draft.movements[photo.id] || 'auto') === move.id, disabled: locked }} onPress={() => setDraft(previous => ({ ...previous, movements: { ...previous.movements, [photo.id]: move.id } }))} style={[s.chip, (draft.movements[photo.id] || 'auto') === move.id && s.chosen]}><Text style={s.small}>{move.label}</Text></Pressable>)}</View><Text style={s.small}>{cameraDescription(draft.movements[photo.id], index)}</Text><View style={s.row}>{[{ id: '', label: 'Original' }, ...(photo.versions || []).map(version => ({ id: version.id, label: `Version ${version.numero}` }))].map(version => <Pressable key={version.id} accessibilityRole="button" disabled={locked} accessibilityState={{ selected: (draft.versions[photo.id] ?? photo.version_gardee ?? '') === version.id }} onPress={() => setDraft(previous => ({ ...previous, versions: { ...previous.versions, [photo.id]: version.id } }))} style={[s.chip, (draft.versions[photo.id] ?? photo.version_gardee ?? '') === version.id && s.chosen]}><Text style={s.small}>{version.label}</Text></Pressable>)}</View>{!locked && <View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel={`Monter la photo ${index + 1}`} disabled={index === 0} onPress={() => move(index, -1)} style={s.chip}><Text>↑</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Descendre la photo ${index + 1}`} disabled={index === selected.length - 1} onPress={() => move(index, 1)} style={s.chip}><Text>↓</Text></Pressable><Pressable accessibilityRole="button" onPress={() => choose(photo.id)} style={s.chip}><Text style={s.small}>Retirer</Text></Pressable></View>}</View></View>)}
      {!sameHome && <Text style={s.notice}>Gardez les photos d’un seul logement pour cette vidéo.</Text>}
    </View>
    <View style={s.card}><Text style={s.title}>2 · Retoucher d’abord, si besoin</Text><Text style={s.body}>La vidéo utilise les versions choisies ci-dessus. Les photos ne sont pas retouchées automatiquement pendant sa création.</Text><Button secondary title="Retoucher mes photos d’abord" onPress={() => selected[0] ? router.push({ pathname: '/retouche', params: { id: selected[0].id, lot: selected.map(photo => photo.id).join(','), mode: 'compte' } }) : router.navigate('/nouvelle')}/></View>
    <View style={s.card}><Text style={s.title}>3 · Le mouvement que vous voulez</Text><Text style={s.label}>Votre demande vidéo</Text><TextInput accessibilityLabel="Votre demande vidéo" value={draft.idea} onChangeText={idea => setDraft(previous => ({ ...previous, idea }))} editable={!locked} multiline maxLength={3000} placeholder="Une visite façon drone : avance dans le salon, contourne la table, puis une coupe vers la chambre…" style={[s.input, s.multiline]}/>{!locked && <Button secondary title="Utiliser l’exemple « Visite dynamique »" onPress={() => setDraft(previous => ({ ...previous, idea: DYNAMIC_VIDEO_EXAMPLE }))}/>}<Text style={s.small}>La caméra se déplace ; les meubles restent en place. Précisez le trajet et le rythme souhaités pour chaque plan.</Text>{!locked && <MobileBriefAssistant kind="video" request={draft.idea} storageKey={`studio:${account?.id}:video-assistant`} context={`${selected.length} photos · ${selected.map(photo => photo.titre || 'Photo').join(', ')}. Un plan dans chaque pièce, sans inventer de passage.`} onUse={idea => setDraft(previous => ({ ...previous, idea }))}/>}</View>
    <View style={s.card}><Text style={s.title}>4 · Relire, puis confirmer</Text><Text style={s.body}>{selected.length} photo{selected.length > 1 ? 's' : ''} · {selected.length * 5} secondes · 720p. Les plans seront assemblés dans votre ordre, avec une coupe entre les pièces.</Text>{selected.map((photo, index) => <Text key={photo.id} style={s.small}>{index + 1}. {photo.titre || 'Photo'} : {cameraDescription(draft.movements[photo.id], index)}</Text>)}<Text style={s.small}>Les murs, portes, fenêtres et radiateurs restent fidèles aux photos. Vérifiez le résultat avant de publier votre annonce.</Text>
      {!account?.gratuit_illimite || !health?.video_disponible ? <Text style={s.notice}>Vous pouvez préparer votre vidéo. La génération est actuellement ouverte uniquement sur le compte propriétaire ; les achats seront activés plus tard.</Text> : <Text style={s.small}>Offert sur votre compte · cinq projets au maximum par logement sur 24 heures.</Text>}
      {!video && <Button title={starting ? 'Confirmation…' : draft.intent ? 'Reprendre cette confirmation' : `Confirmer et créer ma vidéo de ${selected.length * 5} secondes`} onPress={() => void start()} disabled={!ready || !restored || starting || !selected.length || !sameHome || selected.length !== draft.ids.length || draft.idea.trim().length < 3 || draft.idea.trim().length > 3000 || !account?.gratuit_illimite || !health?.video_disponible}/>}
      {isPending && <View accessibilityLiveRegion="polite" style={s.wait}><ActivityIndicator color="#4f6b41"/><Text style={s.title}>Votre vidéo prend forme.</Text><Text style={s.body}>{video?.plans_prets || 0} plan(s) prêts sur {video?.plans_total || selected.length}. Vous pouvez continuer vos retouches et revenir retrouver cette vidéo.</Text></View>}
      {video?.statut === 'prete' && !!video.url && <><Text style={s.title}>Votre vidéo est prête.</Text><Button title="Voir et télécharger ma vidéo" onPress={() => void Linking.openURL(video.url)}/></>}
      {video?.statut === 'echec' && <><Text style={s.notice}>{video.erreur}</Text>{video.clips?.map((clip, index) => <Button key={clip.photo_id} secondary title={`Voir le plan ${index + 1} conservé`} onPress={() => void Linking.openURL(clip.url)}/>)}</>}
      {(!!video && !isPending || !!draft.intent && !video && !starting) && <Button secondary title="Préparer une nouvelle demande" onPress={() => { setDraft(previous => ({ ...previous, videoId: '', intent: '' })); setVideo(null); setNotice(''); }}/>}<Button secondary title="Retour à mes créations" onPress={() => router.navigate('/')}/>
    </View>
  </>;
}

const s = StyleSheet.create({
  card: { padding: 18, gap: 14, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#dce2d1', borderRadius: 22 }, title: { fontSize: 20, fontWeight: '600', color: colors.ink }, body: { fontSize: 14, lineHeight: 22, color: colors.muted }, small: { fontSize: 12, lineHeight: 19, color: colors.muted }, label: { fontSize: 14, fontWeight: '600', color: colors.ink }, input: { borderWidth: 1, borderColor: '#d5ddca', padding: 13, borderRadius: 12, fontSize: 16, color: colors.ink, backgroundColor: '#f5f7f0' }, multiline: { minHeight: 120, textAlignVertical: 'top' }, notice: { fontSize: 13, lineHeight: 20, padding: 13, color: '#75553c', backgroundColor: '#f7eddd', borderRadius: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '47%', flexGrow: 1, padding: 8, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 14, gap: 6 }, thumb: { width: '100%', aspectRatio: 1.4, borderRadius: 8 }, chosen: { backgroundColor: '#edf3e5', borderColor: '#728d55' }, plan: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e6db' }, mini: { width: 64, height: 64, borderRadius: 10 }, flex: { flex: 1, gap: 6 }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 16, minHeight: 38 }, wait: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: '#eaf0df' },
});

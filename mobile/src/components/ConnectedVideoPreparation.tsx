import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAccount } from './AccountConnection';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { Button, colors } from './Studio';
import { ApiError, type CreatedVideo, type Property } from '../lib/account-api';
import { CAMERA_MOVES, cameraDescription, readCameraMoves, DYNAMIC_VIDEO_EXAMPLE, type CameraMove } from '../../../shared/video-direction';
import { finalVideoDuration, durationFromBrief, VIDEO_DURATIONS, VIDEO_REQUEST_MAX, videoDuration } from '../../../shared/video-duration';
import { useLocalDraft } from '../lib/use-local-draft';

type Draft = { draftId: string; duration: number | null; movements: Record<string, CameraMove>; ids: string[]; versions: Record<string, string>; idea: string; intent: string; videoId: string };
const empty: Draft = { draftId: '', duration: null, movements: {}, ids: [], versions: {}, idea: '', intent: '', videoId: '' };
function readDraft(value: unknown): Draft {
  const v = value as Partial<Draft>;
  if (!v || typeof v !== 'object') throw new Error('Brouillon illisible');
  return { draftId: typeof v.draftId === 'string' ? v.draftId : '', duration: videoDuration(v.duration), movements: readCameraMoves(v.movements), ids: Array.isArray(v.ids) ? v.ids.filter((id): id is string => typeof id === 'string').slice(0, 6) : [],
    versions: v.versions && typeof v.versions === 'object' ? Object.fromEntries(Object.entries(v.versions).filter(([, id]) => typeof id === 'string').map(([key, id]) => [key, id === 'original' ? '' : id])) : {},
    idea: typeof v.idea === 'string' ? v.idea.slice(0, 20000) : '', intent: typeof v.intent === 'string' ? v.intent.slice(0, 20000) : '', videoId: typeof v.videoId === 'string' ? v.videoId : '' };
}
const pending = (video: CreatedVideo | null) => !!video && ['preparation', 'en_attente', 'clips', 'montage'].includes(video.statut);
const message = (error: unknown) => error instanceof Error ? error.message : 'Cette action n’a pas abouti.';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function ConnectedVideoPreparation() {
  const { api, account, health, refresh } = useAccount();
  const params = useLocalSearchParams<{ photos?: string; version?: string; brouillon?: string }>();
  const { draft, setDraft, ready, notice: storageNotice } = useLocalDraft(`studio:${account?.id}:video.v2`, empty, readDraft);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true); const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState(''); const [notice, setNotice] = useState('');
  const [video, setVideo] = useState<CreatedVideo | null>(null); const [starting, setStarting] = useState(false); const [creditDialog, setCreditDialog] = useState(false);
  const [syncedVideoId, setSyncedVideoId] = useState('');
  const restored = !draft.videoId || syncedVideoId === draft.videoId;
  const draftLoaded=useRef(''); const saveQueue=useRef(Promise.resolve());
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
    void api.json<CreatedVideo>(`/videos/${encodeURIComponent(draft.videoId)}`).then(result => { if (active && pending(result)) setVideo(result); }).catch(error => { if (active) setNotice(message(error)); }).finally(() => { if (active) setSyncedVideoId(draft.videoId); });
    return () => { active = false; };
  }, [ready, draft.videoId, api]);
  useEffect(()=>{
    if(!ready||!params.brouillon||draftLoaded.current===params.brouillon)return;
    draftLoaded.current=params.brouillon;
    void api.json<{id:string;donnees:Record<string,unknown>}>(`/brouillons/${params.brouillon}`).then(item=>{const d=item.donnees;setVideo(null);setDraft(readDraft({draftId:item.id,duration:d.duration,movements:d.movements,ids:d.selectedIds,versions:d.selectedVersions,idea:d.brief||d.idea}));}).catch(e=>setNotice(message(e)));
  },[ready,params.brouillon,api,setDraft]);
  useEffect(()=>{
    if(!ready||draft.intent||draft.videoId||(!draft.ids.length&&!draft.idea))return;
    if(!draft.draftId){setDraft(previous=>({...previous,draftId:Crypto.randomUUID()}));return;}
    const timer=setTimeout(()=>{
      saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{await api.json(`/brouillons/${draft.draftId}`,{method:'PUT',body:JSON.stringify({nature:'video',donnees:{selectedIds:draft.ids,selectedVersions:draft.versions,movements:draft.movements,idea:draft.idea,duration:draft.duration}})});}).catch(()=>setNotice('Brouillon conservé sur cet appareil. La sauvegarde dans le compte est momentanément indisponible.'));
    },350);
    return()=>clearTimeout(timer);
  },[ready,draft,api,setDraft]);
  const videoId = video?.id; const isPending = pending(video);
  const videoStatus = video?.statut;
  useEffect(() => { if (videoStatus && ['prete', 'echec'].includes(videoStatus)) void refresh(); }, [video?.id, videoStatus, refresh]);
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
  const duration = finalVideoDuration(draft.duration, selected.length, draft.idea);
  const videoCost = duration / 5;
  const videoEnabled = !!health?.video_disponible && (!!account?.gratuit_illimite || (account?.solde_video || 0) >= videoCost);
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
  async function newVideo() {
    if(starting)return;
    try {
      await saveQueue.current;
      if(draft.draftId && !draft.intent && !draft.videoId) await api.json(`/brouillons/${draft.draftId}`,{method:'PUT',body:JSON.stringify({nature:'video',donnees:{selectedIds:draft.ids,selectedVersions:draft.versions,movements:draft.movements,idea:draft.idea,duration:draft.duration}})});
      setDraft({...empty});setVideo(null);setNotice('Nouvelle préparation. Les anciennes vidéos restent dans Mes créations.');
    } catch(e){setNotice(message(e));}
  }
  async function start() {
    if (launching.current || !ready || !restored || !selected.length || !sameHome || draft.idea.trim().length < 3 || draft.idea.trim().length > VIDEO_REQUEST_MAX || isPending || !videoEnabled) return;
    launching.current = true; setStarting(true); setNotice('');
    const body = draft.intent || JSON.stringify({ cle_demande: Crypto.randomUUID(), brouillon_id: draft.draftId || null, duree: duration, demande: draft.idea.trim(), photos: selected.map(photo => ({ mouvement: draft.movements[photo.id] || 'auto', photo_id: photo.id, version_id: draft.versions[photo.id] ?? photo.version_gardee ?? '' })) });
    setDraft(previous => ({ ...previous, intent: body }));
    try {
      await saveQueue.current;
      if (draft.draftId && !draft.intent) await api.json(`/brouillons/${draft.draftId}`, {method:'PUT',body:JSON.stringify({nature:'video',donnees:{selectedIds:draft.ids,selectedVersions:draft.versions,movements:draft.movements,idea:draft.idea,duration:draft.duration}})});
      let result: CreatedVideo;
      try { result = await api.json<CreatedVideo>('/videos/visites', { method: 'POST', body }); }
      catch (error) { if (!(error instanceof ApiError) || ![0, 502, 504].includes(error.status)) throw error; result = await api.json<CreatedVideo>('/videos/visites', { method: 'POST', body }); }
      setVideo(result); setDraft(previous => ({ ...previous, videoId: result.id })); void refresh();
    } catch (error) {
      setNotice(message(error));
      if (error instanceof ApiError && error.status === 409) {
        try { const existing = await api.json<CreatedVideo | null>(`/videos/photos/${selected[0].id}/derniere`); if (existing && pending(existing)) { setVideo(existing); setDraft(previous => ({ ...previous, videoId: existing.id })); void refresh(); } } catch { /* Conserver l'intention pour la reprise. */ }
      }
    } finally { launching.current = false; setStarting(false); }
  }
  return <><View style={s.card}><Text style={s.title}>Vos préparations</Text><Text style={s.body}>Un brouillon ne lance aucune génération. Retrouvez-le dans Mes créations → Brouillons.</Text><Button secondary title="Nouvelle vidéo" disabled={starting} onPress={()=>void newVideo()}/></View>
    {!!(notice || storageNotice) && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice || storageNotice}</Text>}
    <View style={s.card}><Text style={s.title}>1 · Vos photos, dans votre ordre</Text><Text style={s.body}>De 5 à 30 secondes au total, en conservant toutes les photos choisies. Choisissez les photos d’un même logement.</Text>
      <Button secondary title={picker ? 'Masquer mes photos' : 'Choisir dans mes créations'} onPress={() => setPicker(value => !value)}/>
      {picker && <><TextInput accessibilityLabel="Retrouver une photo ou un logement" value={search} onChangeText={setSearch} placeholder="Salon, chambre, logement…" style={s.input}/>{loading ? <ActivityIndicator/> : <View style={s.grid}>{photos.filter(photo => normalize(`${photo.home} ${photo.titre || ''}`).includes(normalize(search))).map(photo => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel={`${photo.home}, ${photo.titre || 'Photo'}`} accessibilityState={{ selected: draft.ids.includes(photo.id), disabled: locked }} disabled={locked} onPress={() => choose(photo.id)} style={[s.tile, draft.ids.includes(photo.id) && s.chosen]}><Image source={{ uri: photo.vignette }} style={s.thumb}/><Text style={s.small}>{draft.ids.includes(photo.id) ? `${draft.ids.indexOf(photo.id) + 1} · ` : ''}{photo.titre || 'Photo'} · {photo.home}</Text></Pressable>)}</View>}</>}
      {!locked && <Button secondary title="Ajouter des photos ou le lien de mon annonce" onPress={() => router.push({ pathname: '/nouvelle', params: { retour: 'visite' } })}/>}
      {selected.map((photo, index) => <View key={photo.id} style={s.plan}><Image source={{ uri: photo.vignette }} style={s.mini}/><View style={s.flex}><Text style={s.label}>{index + 1} · {photo.titre || 'Photo'}</Text><Text style={s.small}>{photo.home}</Text><Text style={s.label}>Mouvement de caméra</Text><View style={s.row}>{CAMERA_MOVES.map(move => <Pressable key={move.id} accessibilityRole="button" accessibilityLabel={`${move.label}, plan ${index + 1}`} disabled={locked} accessibilityState={{ selected: (draft.movements[photo.id] || 'auto') === move.id, disabled: locked }} onPress={() => setDraft(previous => ({ ...previous, movements: { ...previous.movements, [photo.id]: move.id } }))} style={[s.chip, (draft.movements[photo.id] || 'auto') === move.id && s.chosen]}><Text style={s.small}>{move.label}</Text></Pressable>)}</View><Text style={s.small}>{cameraDescription(draft.movements[photo.id], index)}</Text><View style={s.row}>{[{ id: '', label: 'Original' }, ...(photo.versions || []).map(version => ({ id: version.id, label: `Version ${version.numero}` }))].map(version => <Pressable key={version.id} accessibilityRole="button" disabled={locked} accessibilityState={{ selected: (draft.versions[photo.id] ?? photo.version_gardee ?? '') === version.id }} onPress={() => setDraft(previous => ({ ...previous, versions: { ...previous.versions, [photo.id]: version.id } }))} style={[s.chip, (draft.versions[photo.id] ?? photo.version_gardee ?? '') === version.id && s.chosen]}><Text style={s.small}>{version.label}</Text></Pressable>)}</View>{!locked && <View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel={`Monter la photo ${index + 1}`} disabled={index === 0} onPress={() => move(index, -1)} style={s.chip}><Text>↑</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Descendre la photo ${index + 1}`} disabled={index === selected.length - 1} onPress={() => move(index, 1)} style={s.chip}><Text>↓</Text></Pressable><Pressable accessibilityRole="button" onPress={() => choose(photo.id)} style={s.chip}><Text style={s.small}>Retirer</Text></Pressable></View>}</View></View>)}
      {!sameHome && <Text style={s.notice}>Gardez les photos d’un seul logement pour cette vidéo.</Text>}
    </View>
    <View style={s.card}><Text style={s.title}>2 · Retoucher d’abord, si besoin</Text><Text style={s.body}>La vidéo utilise les versions choisies ci-dessus. Les photos ne sont pas retouchées automatiquement pendant sa création.</Text><Button secondary title="Retoucher mes photos d’abord" onPress={() => selected[0] ? router.push({ pathname: '/retouche', params: { id: selected[0].id, lot: selected.map(photo => photo.id).join(','), mode: 'compte' } }) : router.navigate('/nouvelle')}/></View>
    <View style={s.card}><Text style={s.title}>Durée totale de la vidéo</Text><View style={s.row}>{VIDEO_DURATIONS.map(seconds => <Pressable key={seconds} accessibilityRole="button" accessibilityState={{ selected: duration === seconds, disabled: locked }} disabled={locked} onPress={() => setDraft(previous => ({ ...previous, duration: seconds }))} style={[s.chip, duration === seconds && s.chosen]}><Text>{seconds} secondes</Text></Pressable>)}</View><Text style={s.small}>Toutes vos photos apparaîtront dans cette durée, dans l’ordre choisi.</Text></View>
    <View style={s.card}><Text style={s.title}>3 · Le mouvement que vous voulez</Text><Text style={s.label}>Votre demande vidéo</Text><TextInput accessibilityLabel="Votre demande vidéo" value={draft.idea} onChangeText={idea => setDraft(previous => ({ ...previous, idea }))} editable={!locked} multiline maxLength={VIDEO_REQUEST_MAX} placeholder="Une visite façon drone : avance dans le salon, contourne la table, puis une coupe vers la chambre…" style={[s.input, s.multiline]}/>{!locked && <Button secondary title="Utiliser l’exemple « Visite dynamique »" onPress={() => setDraft(previous => ({ ...previous, idea: DYNAMIC_VIDEO_EXAMPLE }))}/>}<Text style={s.small}>La caméra se déplace ; les meubles restent en place. Précisez le trajet et le rythme souhaités pour chaque plan.</Text>{!locked && <MobileBriefAssistant kind="video" request={draft.idea} storageKey={`studio:${account?.id}:video-assistant`} context={`${selected.length} photos · ${selected.map(photo => photo.titre || 'Photo').join(', ')}. Un plan dans chaque pièce, sans inventer de passage.`} onUse={idea => setDraft(previous => ({ ...previous, idea, duration: durationFromBrief(idea) ?? previous.duration }))}/>}</View>
    <View style={s.card}><Text style={s.title}>4 · Relire, puis confirmer</Text><Text style={s.body}>{selected.length} photo{selected.length > 1 ? 's' : ''} · {duration} secondes · 720p. Les plans seront assemblés dans votre ordre, avec une coupe entre les pièces.</Text>{selected.map((photo, index) => <Text key={photo.id} style={s.small}>{index + 1}. {photo.titre || 'Photo'} : {cameraDescription(draft.movements[photo.id], index)}</Text>)}<Text style={s.small}>Les murs, portes, fenêtres et radiateurs restent fidèles aux photos. Vérifiez le résultat avant de publier votre annonce.</Text>
      {!health?.video_disponible ? <Text style={s.notice}>Vous pouvez préparer votre vidéo. La génération n’est pas encore ouverte sur ce compte ; aucun crédit n’est utilisé.</Text> : account?.gratuit_illimite ? <Text style={s.small}>Offert sur votre compte · cinq projets au maximum par logement sur 24 heures.</Text> : <Text style={s.small}>Cette vidéo de {duration} secondes utilise {videoCost} crédit{videoCost > 1 ? 's' : ''} vidéo. Solde : {account?.solde_video || 0} crédit{(account?.solde_video || 0) > 1 ? 's' : ''}, soit {(account?.solde_video || 0) * 5} secondes. Le reste demeure disponible pour d’autres vidéos.</Text>}
      {!!health?.video_disponible && !videoEnabled && <Text style={s.notice}>Votre solde ne suffit pas pour cette durée. Choisissez une vidéo plus courte ou rechargez vos crédits quand les achats seront ouverts.</Text>}
      {!video && <Button title={starting ? 'Confirmation…' : draft.intent ? 'Reprendre cette confirmation' : `Confirmer et créer ma vidéo de ${duration} secondes`} onPress={() => videoEnabled ? void start() : setCreditDialog(true)} disabled={!ready || !restored || starting || !selected.length || !sameHome || selected.length !== draft.ids.length || draft.idea.trim().length < 3 || draft.idea.trim().length > VIDEO_REQUEST_MAX || !health?.video_disponible}/>}
      {isPending && <View accessibilityLiveRegion="polite" style={s.wait}><ActivityIndicator color="#4f6b41"/><Text style={s.title}>Votre vidéo prend forme.</Text><Text style={s.body}>{video?.plans_prets || 0} plan(s) prêts sur {video?.plans_total || selected.length}. Vous pouvez quitter la page ou fermer l’application : la création continue. Retrouvez-la dans Mes créations.</Text></View>}
      {video?.statut === 'prete' && !!video.url && <><Text style={s.title}>Votre vidéo est prête.</Text><Button title="Voir et télécharger ma vidéo" onPress={() => void Linking.openURL(video.url)}/></>}
      {video?.statut === 'echec' && <><Text style={s.notice}>{video.erreur}</Text>{video.clips?.map((clip, index) => <Button key={clip.photo_id} secondary title={`Voir le plan ${index + 1} conservé`} onPress={() => void Linking.openURL(clip.url)}/>)}</>}
      {(!!video && !isPending || !!draft.intent && !video && !starting) && <Button secondary title="Préparer une nouvelle demande" onPress={() => void newVideo()}/>}<Button secondary title="Retour à mes créations" onPress={() => router.navigate('/')}/>
    </View>
    <Modal visible={creditDialog} transparent animationType="fade" onRequestClose={() => setCreditDialog(false)}><View style={s.scrim}><View style={s.dialog}><Text style={s.title}>Ajouter des crédits vidéo</Text><Text style={s.body}>Il vous faut {videoCost} crédit{videoCost > 1 ? 's' : ''} pour cette vidéo de {duration} secondes. Votre préparation reste enregistrée.</Text>{!account?.paiement_video_disponible && <Text style={s.small}>Les achats ne sont pas encore ouverts. Les tarifs sont consultables sans paiement.</Text>}<Button title="Voir les packs de crédits" onPress={() => { setCreditDialog(false); router.navigate('/compte'); }}/><Button secondary title="Plus tard" onPress={() => setCreditDialog(false)}/></View></View></Modal>
  </>;
}

const s = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(28, 36, 26, 0.55)' }, dialog: { padding: 24, gap: 16, borderRadius: 22, backgroundColor: '#fffefa' },
  card: { padding: 18, gap: 14, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#dce2d1', borderRadius: 22 }, title: { fontSize: 20, fontWeight: '600', color: colors.ink }, body: { fontSize: 14, lineHeight: 22, color: colors.muted }, small: { fontSize: 12, lineHeight: 19, color: colors.muted }, label: { fontSize: 14, fontWeight: '600', color: colors.ink }, input: { borderWidth: 1, borderColor: '#d5ddca', padding: 13, borderRadius: 12, fontSize: 16, color: colors.ink, backgroundColor: '#f5f7f0' }, multiline: { minHeight: 120, textAlignVertical: 'top' }, notice: { fontSize: 13, lineHeight: 20, padding: 13, color: '#75553c', backgroundColor: '#f7eddd', borderRadius: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '47%', flexGrow: 1, padding: 8, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 14, gap: 6 }, thumb: { width: '100%', aspectRatio: 1.4, borderRadius: 8 }, chosen: { backgroundColor: '#edf3e5', borderColor: '#728d55' }, plan: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e6db' }, mini: { width: 64, height: 64, borderRadius: 10 }, flex: { flex: 1, gap: 6 }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 16, minHeight: 38 }, wait: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: '#eaf0df' },
});

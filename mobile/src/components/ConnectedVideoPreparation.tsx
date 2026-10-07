import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAccount } from './AccountConnection';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { Button, colors } from './Studio';
import { ApiError, type CreatedVideo, type Property } from '../lib/account-api';
import { CAMERA_MOVES, cameraDescription, readCameraMoves, DYNAMIC_VIDEO_EXAMPLE, DEFAULT_VIDEO_REQUEST, type CameraMove } from '../../../shared/video-direction';
import { finalVideoDuration, durationFromBrief, VIDEO_DURATIONS, VIDEO_REQUEST_MAX, videoDuration } from '../../../shared/video-duration';
import { videoCreditsRequired, type VideoEditing, type VideoQuality } from '../../../shared/video-options';
import { useLocalDraft } from '../lib/use-local-draft';
import { choisirVuesVideo } from '../lib/video-reperage';

type Draft = { draftId: string; duration: number | null; quality: VideoQuality; editing: VideoEditing; movements: Record<string, CameraMove>; ids: string[]; versions: Record<string, string>; idea: string; agencement: string; liaisons: Record<string, string>; intent: string; videoId: string };
type Reperage = { pieces: string[]; passages: { depart: string; arrivee: string; porte: string; preuve: string }[]; avertissement: string; agencement: string };
const PORTES: Record<string, string> = { coupe: 'passage non confirmé : faire une coupe', meme: 'même pièce : rester dans cet espace', gauche: 'porte à gauche depuis la photo de départ', centre: 'ouverture en face depuis la photo de départ', droite: 'porte à droite depuis la photo de départ' };
const empty: Draft = { draftId: '', duration: null, quality: '720p', editing: 'montage', movements: {}, ids: [], versions: {}, idea: DEFAULT_VIDEO_REQUEST, agencement: '', liaisons: {}, intent: '', videoId: '' };
function readDraft(value: unknown): Draft {
  const v = value as Partial<Draft>;
  if (!v || typeof v !== 'object') throw new Error('Brouillon illisible');
  return { draftId: typeof v.draftId === 'string' ? v.draftId : '', duration: videoDuration(v.duration), quality: v.quality === '1080p' ? '1080p' : '720p', editing: v.editing === 'continue' ? 'continue' : 'montage', movements: readCameraMoves(v.movements), ids: Array.isArray(v.ids) ? v.ids.filter((id): id is string => typeof id === 'string').slice(0, 6) : [],
    versions: v.versions && typeof v.versions === 'object' ? Object.fromEntries(Object.entries(v.versions).filter(([, id]) => typeof id === 'string').map(([key, id]) => [key, id === 'original' ? '' : id])) : {},
    idea: typeof v.idea === 'string' ? v.idea.slice(0, 20000) : DEFAULT_VIDEO_REQUEST, agencement: typeof v.agencement === 'string' ? v.agencement.slice(0, 800) : '',
    liaisons: v.liaisons && typeof v.liaisons === 'object' ? Object.fromEntries(Object.entries(v.liaisons).filter(([, choix]) => typeof choix === 'string' && choix in PORTES)) : {},
    intent: typeof v.intent === 'string' ? v.intent.slice(0, 20000) : '', videoId: typeof v.videoId === 'string' ? v.videoId : '' };
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
  const [reperage, setReperage] = useState<Reperage | null>(null); const [reperageBusy, setReperageBusy] = useState(false); const [trajetOpen, setTrajetOpen] = useState(false);
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
    void api.json<{id:string;donnees:Record<string,unknown>}>(`/brouillons/${params.brouillon}`).then(item=>{const d=item.donnees;setVideo(null);setDraft(readDraft({draftId:item.id,duration:d.duration,quality:d.quality,editing:d.editing,movements:d.movements,ids:d.selectedIds,versions:d.selectedVersions,idea:d.brief||d.idea,agencement:d.agencement||d.route,liaisons:d.liaisons}));}).catch(e=>setNotice(message(e)));
  },[ready,params.brouillon,api,setDraft]);
  useEffect(()=>{
    if(!ready||draft.intent||draft.videoId||(!draft.ids.length&&(!draft.idea||draft.idea===DEFAULT_VIDEO_REQUEST)))return;
    if(!draft.draftId){setDraft(previous=>({...previous,draftId:Crypto.randomUUID()}));return;}
    const timer=setTimeout(()=>{
      saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{await api.json(`/brouillons/${draft.draftId}`,{method:'PUT',body:JSON.stringify({nature:'video',donnees:{selectedIds:draft.ids,selectedVersions:draft.versions,movements:draft.movements,idea:draft.idea,agencement:draft.agencement,liaisons:draft.liaisons,duration:draft.duration,quality:draft.quality,editing:draft.editing}})});}).catch(()=>setNotice('Brouillon conservé sur cet appareil. La sauvegarde dans le compte est momentanément indisponible.'));
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
  const videoCost = videoCreditsRequired(duration, draft.quality);
  const maxPhotos = Math.min(6, duration / 5 * 2);
  const videoEnabled = !!health?.video_disponible && (!!account?.gratuit_illimite || (account?.solde_video || 0) >= videoCost);
  const sameHome = new Set(selected.map(photo => photo.homeId)).size <= 1;
  const portesConfirmees = selected.slice(1).map((photo, index) => { const depart = selected[index]; const choix = draft.liaisons[`${depart.id}:${photo.id}`] || 'coupe'; return `${depart.titre || 'Photo ' + (index + 1)} → ${photo.titre || 'Photo ' + (index + 2)} : ${PORTES[choix] || PORTES.coupe}.`; }).join(' ');
  const agencementVideo = draft.agencement.slice(0, 1200);
  const passagesVideo = selected.slice(1).map((photo, index) => draft.liaisons[`${selected[index].id}:${photo.id}`] || 'coupe');
  const routeReady = draft.editing !== 'continue' || selected.length <= 1 || passagesVideo.every(value => value !== 'coupe');
  const locked = starting || isPending || !!draft.intent;
  function choose(id: string) {
    if (locked) return;
    setReperage(null);
    if (!draft.ids.includes(id) && draft.ids.length >= maxPhotos) { setNotice(`Pour ${duration} secondes, choisissez au maximum ${maxPhotos} photos. Allongez la vidéo ou retirez une photo.`); return; }
    setDraft(previous => ({ ...previous, ids: previous.ids.includes(id) ? previous.ids.filter(p => p !== id) : [...previous.ids, id] }));
  }
  function move(index: number, direction: number) {
    if (locked || index + direction < 0 || index + direction >= draft.ids.length) return;
    setReperage(null);
    setDraft(previous => { const ids = [...previous.ids]; [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]; return { ...previous, ids }; });
  }
  async function newVideo() {
    if(starting)return;
    try {
      await saveQueue.current;
      if(draft.draftId && !draft.intent && !draft.videoId) await api.json(`/brouillons/${draft.draftId}`,{method:'PUT',body:JSON.stringify({nature:'video',donnees:{selectedIds:draft.ids,selectedVersions:draft.versions,movements:draft.movements,idea:draft.idea,agencement:draft.agencement,liaisons:draft.liaisons,duration:draft.duration,quality:draft.quality,editing:draft.editing}})});
      setDraft({...empty});setVideo(null);setReperage(null);setNotice('Nouvelle préparation. Les anciennes vidéos restent dans Mes créations.');
    } catch(e){setNotice(message(e));}
  }
  async function start() {
    if (launching.current || !ready || !restored || !selected.length || selected.length > maxPhotos || !sameHome || !routeReady || draft.idea.trim().length > VIDEO_REQUEST_MAX || isPending || !videoEnabled) return;
    launching.current = true; setStarting(true); setNotice('');
    const body = draft.intent || JSON.stringify({ cle_demande: Crypto.randomUUID(), brouillon_id: draft.draftId || null, duree: duration, demande: draft.idea.trim() || DEFAULT_VIDEO_REQUEST, agencement: agencementVideo.trim(), liaisons: passagesVideo, montage: draft.editing, qualite: draft.quality, photos: selected.map(photo => ({ mouvement: draft.movements[photo.id] || 'auto', photo_id: photo.id, version_id: draft.versions[photo.id] ?? photo.version_gardee ?? '' })) });
    setDraft(previous => ({ ...previous, intent: body }));
    try {
      await saveQueue.current;
      if (draft.draftId && !draft.intent) await api.json(`/brouillons/${draft.draftId}`, {method:'PUT',body:JSON.stringify({nature:'video',donnees:{selectedIds:draft.ids,selectedVersions:draft.versions,movements:draft.movements,idea:draft.idea,agencement:draft.agencement,liaisons:draft.liaisons,duration:draft.duration,quality:draft.quality,editing:draft.editing}})});
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
  async function analyserVideo() {
    if (!health?.video_disponible || !selected.length || !sameHome || reperageBusy || locked) return;
    setReperageBusy(true); setReperage(null); setNotice('');
    try {
      const images = await choisirVuesVideo();
      if (!images) return;
      const result = await api.json<Reperage>('/videos/reperage', { method: 'POST', body: JSON.stringify({ photos: selected.map(photo => photo.id), images }) });
      setReperage(result);
    } catch (error) { setNotice(message(error)); }
    finally { setReperageBusy(false); }
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
    <View style={s.card}><Text style={s.title}>Durée totale de la vidéo</Text><View style={s.row}>{VIDEO_DURATIONS.map(seconds => <Pressable key={seconds} accessibilityRole="button" accessibilityState={{ selected: duration === seconds, disabled: locked }} disabled={locked} onPress={() => setDraft(previous => ({ ...previous, duration: seconds }))} style={[s.chip, duration === seconds && s.chosen]}><Text>{seconds} secondes</Text></Pressable>)}</View><Text style={s.small}>Maximum {maxPhotos} photos pour {duration} secondes. Le moteur prépare une seule visite dans l’ordre choisi.</Text>{selected.length > maxPhotos && <Text style={s.notice}>Retirez {selected.length - maxPhotos} photo(s) ou choisissez une durée plus longue.</Text>}
      <Text style={s.label}>Passage entre les pièces</Text><View style={s.row}>{([['montage','Plans avec raccords'],['continue','Visite fluide façon drone']] as const).map(([value,label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected:draft.editing===value,disabled:locked}} disabled={locked} onPress={() => {setDraft(previous=>({...previous,editing:value}));if(value==='continue')setTrajetOpen(true);}} style={[s.chip,draft.editing===value&&s.chosen]}><Text style={s.small}>{label}</Text></Pressable>)}</View><Text style={s.small}>{draft.editing === 'continue' ? 'Indiquez les vraies portes plus bas. Une prise sans coupure reste dépendante des images et du moteur.' : 'Des mouvements dans chaque pièce avec des coupes nettes entre les pièces.'}</Text>
      <Text style={s.label}>Qualité du fichier final</Text><View style={s.row}>{([['720p','HD · 1 crédit / 5 s'],['1080p','Full HD · 2 crédits / 5 s']] as const).map(([value,label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected:draft.quality===value,disabled:locked}} disabled={locked} onPress={()=>setDraft(previous=>({...previous,quality:value}))} style={[s.chip,draft.quality===value&&s.chosen]}><Text style={s.small}>{label}</Text></Pressable>)}</View>
    </View>
      <View style={s.card}>
        <Text style={s.title}>3 · Le mouvement que vous voulez</Text>
        <Text style={s.label}>Visite proposée · modifiable</Text><Text style={s.small}>La demande est prête. Modifiez-la ou effacez-la : sans texte, la visite type suit vos choix de caméra et les vrais passages indiqués.</Text>
        <TextInput accessibilityLabel="Votre demande vidéo" value={draft.idea} onChangeText={idea => setDraft(previous => ({ ...previous, idea }))} editable={!locked} multiline maxLength={VIDEO_REQUEST_MAX} placeholder="Une visite façon drone : avance dans le salon, contourne la table, puis révèle la chambre…" style={[s.input, s.multiline]}/>
        {!locked && <Button secondary title="Utiliser l’exemple « Visite dynamique »" onPress={() => setDraft(previous => ({ ...previous, idea: DYNAMIC_VIDEO_EXAMPLE }))}/>}{!locked && <Button secondary title="Effacer ma demande" onPress={() => setDraft(previous => ({ ...previous, idea: '' }))}/>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: trajetOpen }} onPress={() => setTrajetOpen(value => !value)} style={s.trajetToggle}><Text style={s.label}>Ajouter le trajet réel du logement · Facultatif</Text><Text style={s.small}>{trajetOpen ? 'Masquer les champs −' : 'Appuyer ici pour indiquer les portes ou joindre une vidéo de repérage →'}</Text></Pressable>
        <Text style={s.small}>{!routeReady ? 'Pour la visite fluide, indiquez les passages manquants ici avant de lancer.' : 'Sans passage confirmé, la vidéo fait une coupe entre les pièces au lieu d’inventer une porte.'}</Text>
        {trajetOpen && <>
          <Text style={s.small}>Filmez une courte visite en passant par les portes. Le fichier reste sur votre appareil ; seules quelques images sont analysées. La vidéo n’est jamais envoyée à Higgsfield.</Text>
          {!health?.video_disponible && <Text style={s.small}>Le repérage automatique est momentanément indisponible. Vous pouvez préciser les portes ci-dessous et conserver ce brouillon.</Text>}
          {!locked && <Button secondary title={reperageBusy ? 'Repérage en cours…' : 'Choisir une vidéo pour repérer les pièces'} disabled={reperageBusy || !health?.video_disponible || !selected.length || !sameHome} onPress={() => void analyserVideo()}/>}
          {reperage && <View style={s.wait}><Text style={s.label}>Trajet proposé, à vérifier</Text><Text style={s.body}>{reperage.agencement}</Text>{!!reperage.avertissement && <Text style={s.small}>{reperage.avertissement}</Text>}<Button secondary title="Ajouter à ma visite" onPress={() => setDraft(previous => ({ ...previous, agencement: reperage.agencement.slice(0, 800) }))}/></View>}
          {selected.slice(1).map((photo, index) => { const depart = selected[index]; const key = `${depart.id}:${photo.id}`; return <View key={key} style={s.wait}><Text style={s.label}>{depart.titre || `Photo ${index + 1}`} → {photo.titre || `Photo ${index + 2}`}</Text><Text style={s.small}>Quelle porte mène vraiment à la pièce suivante ?</Text><View style={s.row}>{[['coupe','Je ne sais pas · coupe'],['meme','Même pièce'],['gauche','Porte à gauche'],['centre','En face'],['droite','Porte à droite']].map(([id,label]) => <Pressable key={id} accessibilityRole="button" accessibilityState={{selected:(draft.liaisons[key] || 'coupe') === id,disabled:locked}} disabled={locked} onPress={() => setDraft(previous => ({ ...previous, liaisons: { ...previous.liaisons, [key]: id } }))} style={[s.chip, (draft.liaisons[key] || 'coupe') === id && s.chosen]}><Text style={s.small}>{label}</Text></Pressable>)}</View></View>; })}
          <Text style={s.label}>Autres précisions sur les pièces · Facultatif</Text>
          <TextInput accessibilityLabel="Disposition réelle des pièces" value={draft.agencement} onChangeText={agencement => setDraft(previous => ({ ...previous, agencement }))} editable={!locked} multiline maxLength={800} placeholder="Ex. : la porte à droite du salon mène à la cuisine ; celle de gauche mène à la chambre." style={[s.input, s.multiline]}/>
          <Text style={s.small}>En cas de doute, gardez « Je ne sais pas · coupe ». La caméra ne doit pas inventer un passage ni échanger deux portes.</Text>
        </>}
        {!locked && <MobileBriefAssistant kind="video" request={draft.idea} storageKey={`studio:${account?.id}:video-assistant`} context={`${selected.length} photos de cette visite, dans l’ordre choisi : ${selected.map(photo => photo.titre || 'Photo').join(', ')}. Passages : ${portesConfirmees}. Agencement : ${agencementVideo}. Une visite continue uniquement si les passages sont visibles.`} onUse={idea => setDraft(previous => ({ ...previous, idea, duration: durationFromBrief(idea) ?? previous.duration }))}/>}
      </View>
    <View style={s.card}><Text style={s.title}>4 · Relire, puis confirmer</Text><Text style={s.body}>{selected.length} photo{selected.length > 1 ? 's' : ''} · {duration} secondes · {draft.quality} · {draft.editing === 'continue' ? 'visite fluide demandée' : 'plans avec raccords'}. Le trajet sans coupure ne peut pas être garanti à partir de photos ; aucune porte absente ne doit être inventée.</Text>{selected.map((photo, index) => <Text key={photo.id} style={s.small}>{index + 1}. {photo.titre || 'Photo'} : {cameraDescription(draft.movements[photo.id], index)}</Text>)}<Text style={s.small}>Les murs, portes, fenêtres et radiateurs restent fidèles aux photos. Vérifiez le résultat avant de publier votre annonce.</Text>
      {!routeReady && <Text style={s.notice}>Indiquez le passage réel entre chaque paire de photos ou choisissez « Plans avec raccords ».</Text>}
      <View style={s.costCard} accessibilityLabel="Coût avant création">
        <Text style={s.label}>Coût de cette vidéo · {duration} s en {draft.quality}</Text>
        <Text style={s.costAmount}>{videoCost} crédit{videoCost > 1 ? 's' : ''} vidéo</Text>
        {account?.gratuit_illimite
          ? <Text style={s.small}>Tarif client indiqué pour information. Sur votre compte administrateur, 0 crédit est débité.</Text>
          : <Text style={s.small}>Solde actuel : {account?.solde_video || 0} crédit{(account?.solde_video || 0) > 1 ? 's' : ''}. {(account?.solde_video || 0) >= videoCost ? `Après confirmation : ${(account?.solde_video || 0) - videoCost} crédit${(account?.solde_video || 0) - videoCost > 1 ? 's' : ''} disponible${(account?.solde_video || 0) - videoCost > 1 ? 's' : ''}.` : `Il manque ${videoCost - (account?.solde_video || 0)} crédit${videoCost - (account?.solde_video || 0) > 1 ? 's' : ''}.`}</Text>}
        <Text style={s.small}>Les crédits sont débités à la confirmation, avant la génération, et non au téléchargement. Si la création échoue, ils sont restitués.</Text>
      </View>
      {!health?.video_disponible ? <Text style={s.notice}>La création vidéo est momentanément indisponible. Votre préparation reste enregistrée ; aucun crédit n’est utilisé.</Text> : account?.gratuit_illimite ? <Text style={s.small}>Offert sur votre compte administrateur, sans débit de crédits client.</Text> : null}
      {!!health?.video_disponible && !videoEnabled && <Text style={s.notice}>Votre solde ne suffit pas pour cette durée. Choisissez une vidéo plus courte ou consultez les packs de crédits.</Text>}
      {!video && <Button title={starting ? 'Confirmation…' : draft.intent ? 'Reprendre cette confirmation' : `Confirmer et créer ma vidéo de ${duration} secondes`} onPress={() => videoEnabled ? void start() : setCreditDialog(true)} disabled={!ready || !restored || starting || !routeReady || !selected.length || selected.length > maxPhotos || !sameHome || selected.length !== draft.ids.length || draft.idea.trim().length > VIDEO_REQUEST_MAX || !health?.video_disponible}/>}
      {isPending && <View accessibilityLiveRegion="polite" style={s.wait}><ActivityIndicator color="#4f6b41"/><Text style={s.title}>Votre vidéo prend forme.</Text><Text style={s.body}>{video?.plans_prets || 0} génération prête sur {video?.plans_total || 1}. Vous pouvez quitter la page ou fermer l’application : la création continue. Retrouvez-la dans Mes créations.</Text></View>}
      {video?.statut === 'prete' && !!video.url && <><Text style={s.title}>Votre vidéo est prête.</Text><Button title="Voir et télécharger ma vidéo" onPress={() => void Linking.openURL(video.url)}/></>}
      {video?.statut === 'echec' && <><Text style={s.notice}>{video.erreur}</Text>{video.clips?.map((clip, index) => <Button key={clip.photo_id} secondary title={`Voir le plan ${index + 1} conservé`} onPress={() => void Linking.openURL(clip.url)}/>)}</>}
      {(!!video && !isPending || !!draft.intent && !video && !starting) && <Button secondary title="Préparer une nouvelle demande" onPress={() => void newVideo()}/>}<Button secondary title="Retour à mes créations" onPress={() => router.navigate('/')}/>
    </View>
    <Modal visible={creditDialog} transparent animationType="fade" onRequestClose={() => setCreditDialog(false)}><View style={s.scrim}><View style={s.dialog}><Text style={s.title}>Ajouter des crédits vidéo</Text><Text style={s.body}>Il vous faut {videoCost} crédit{videoCost > 1 ? 's' : ''} pour cette vidéo de {duration} secondes. Votre préparation reste enregistrée.</Text>{!account?.paiement_video_disponible && <Text style={s.small}>Le paiement est momentanément indisponible. Les tarifs restent consultables.</Text>}<Button title="Voir les packs de crédits" onPress={() => { setCreditDialog(false); router.navigate('/credits'); }}/><Button secondary title="Plus tard" onPress={() => setCreditDialog(false)}/></View></View></Modal>
  </>;
}

const s = StyleSheet.create({
  costCard: { gap: 6, padding: 16, borderWidth: 1, borderColor: '#b7c99f', borderRadius: 14, backgroundColor: '#f3f7ed' }, costAmount: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.ink },
  scrim: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(28, 36, 26, 0.55)' }, dialog: { padding: 24, gap: 16, borderRadius: 22, backgroundColor: '#fffefa' },
  trajetToggle: { gap: 6, padding: 14, borderWidth: 1, borderColor: '#a9bd95', borderRadius: 12, backgroundColor: '#f0f5e9' },
  card: { padding: 18, gap: 14, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#dce2d1', borderRadius: 22 }, title: { fontSize: 20, fontWeight: '600', color: colors.ink }, body: { fontSize: 14, lineHeight: 22, color: colors.muted }, small: { fontSize: 12, lineHeight: 19, color: colors.muted }, label: { fontSize: 14, fontWeight: '600', color: colors.ink }, input: { borderWidth: 1, borderColor: '#d5ddca', padding: 13, borderRadius: 12, fontSize: 16, color: colors.ink, backgroundColor: '#f5f7f0' }, multiline: { minHeight: 120, textAlignVertical: 'top' }, notice: { fontSize: 13, lineHeight: 20, padding: 13, color: '#75553c', backgroundColor: '#f7eddd', borderRadius: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tile: { width: '47%', flexGrow: 1, padding: 8, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 14, gap: 6 }, thumb: { width: '100%', aspectRatio: 1.4, borderRadius: 8 }, chosen: { backgroundColor: '#edf3e5', borderColor: '#728d55' }, plan: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e6db' }, mini: { width: 64, height: 64, borderRadius: 10 }, flex: { flex: 1, gap: 6 }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#dce2d1', borderRadius: 16, minHeight: 38 }, wait: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: '#eaf0df' },
});

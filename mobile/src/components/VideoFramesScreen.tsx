import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button, Screen, colors, useStudio } from './Studio';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { logementOf } from '../lib/studio-model';
import { extractVideoFrame, getVideoDuration, releaseVideoFrame } from '../lib/video-frame-extractor';

type Frame = { id: string; uri: string; timeMs: number; selected: boolean };

function timeLabel(timeMs: number) {
  const seconds = Math.max(0, Math.round(timeMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function suggestedTimes(durationMs: number) {
  return [.08, .24, .4, .56, .72, .88].map(ratio => Math.min(Math.max(1, durationMs * ratio), Math.max(1, durationMs - 40)));
}

export function VideoFramesScreen() {
  const { projects, add } = useStudio();
  const logements = [...new Set(projects.filter(project => project.source !== 'example').map(logementOf))];
  const [choix, setChoix] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState('');
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [instant, setInstant] = useState('');
  const [request, setRequest] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const frameUris = useRef(new Set<string>());
  const activeChoice = choix === null ? logements[0] || '' : choix;
  const logement = activeChoice || nouveau.trim();
  const selected = frames.filter(frame => frame.selected);

  useEffect(() => () => {
    for (const uri of frameUris.current) releaseVideoFrame(uri);
  }, []);

  function releaseFrames(items = frames) {
    for (const frame of items) { releaseVideoFrame(frame.uri); frameUris.current.delete(frame.uri); }
  }

  async function pickVideo() {
    setBusy(true); setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 500 * 1024 * 1024) { setNotice('Choisissez une vidéo de moins de 500 Mo.'); return; }
      let duration = Platform.OS === 'web' ? 0 : asset.duration ?? 0;
      if (!duration) duration = await getVideoDuration(asset.uri);
      if (!duration || !Number.isFinite(duration)) { setNotice('La durée de cette vidéo est indisponible. Essayez une autre vidéo.'); return; }
      releaseFrames(); setFrames([]); setVideo(asset); setDurationMs(duration); setInstant('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'La vidéo ne peut pas être ouverte.'); }
    finally { setBusy(false); }
  }

  async function extract(times: number[], replace: boolean) {
    if (!video || busy) return;
    setBusy(true); setNotice('');
    const created: Frame[] = [];
    try {
      for (const timeMs of times) {
        if (!replace && frames.some(frame => Math.abs(frame.timeMs - timeMs) < 120)) continue;
        const uri = await extractVideoFrame(video.uri, timeMs);
        frameUris.current.add(uri);
        created.push({ id: `${Date.now()}-${timeMs}-${created.length}`, uri, timeMs, selected: true });
      }
      if (replace) { releaseFrames(); setFrames(created); }
      else setFrames(current => [...current, ...created].sort((a, b) => a.timeMs - b.timeMs));
      if (!created.length) setNotice('Cette image est déjà dans votre sélection.');
    } catch (error) {
      for (const frame of created) { releaseVideoFrame(frame.uri); frameUris.current.delete(frame.uri); }
      setNotice(error instanceof Error ? error.message : 'Les images ne peuvent pas être extraites de cette vidéo.');
    } finally { setBusy(false); }
  }

  async function save() {
    if (!video || !selected.length || !logement || busy) return;
    setBusy(true); setNotice('');
    try {
      const ids: string[] = [];
      for (const [index, frame] of selected.entries()) {
        ids.push(await add({ uri: frame.uri, fileName: `photo-video-${String(index + 1).padStart(2, '0')}-${timeLabel(frame.timeMs).replace(':', '-')}.jpg`, mimeType: 'image/jpeg' }, logement, request.trim() || `Image extraite de la vidéo « ${video.fileName || 'ma vidéo'} » à ${timeLabel(frame.timeMs)}.`));
      }
      if (ids.length === 1) router.replace({ pathname: '/retouche', params: { id: ids[0] } });
      else router.replace('/');
    } catch { setNotice('Ces photos n’ont pas pu être enregistrées sur l’appareil. Vérifiez l’espace disponible puis réessayez.'); setBusy(false); }
  }

  const customSeconds = Number(instant.replace(',', '.'));
  const customTime = customSeconds * 1000;
  const customValid = Number.isFinite(customTime) && customTime >= 0 && customTime < durationMs;

  return <Screen title="Photos depuis une vidéo" subtitle="Choisissez les meilleurs instants, puis rangez-les avec les photos du logement.">
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>← Mes photos</Text></Pressable>

    <View style={styles.panel}><Text style={styles.kicker}>1 · LE LOGEMENT</Text><View style={styles.chips}>{logements.map(name => <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: activeChoice === name }} onPress={() => setChoix(name)} style={[styles.chip, activeChoice === name && styles.chipActive]}><Text style={[styles.chipText, activeChoice === name && styles.chipTextActive]}>{name}</Text></Pressable>)}<Pressable accessibilityRole="radio" accessibilityState={{ checked: !activeChoice }} onPress={() => setChoix('')} style={[styles.chip, !activeChoice && styles.chipActive]}><Text style={[styles.chipText, !activeChoice && styles.chipTextActive]}>+ Nouveau logement</Text></Pressable></View>{!activeChoice && <TextInput accessibilityLabel="Nom du logement" value={nouveau} onChangeText={setNouveau} maxLength={100} placeholder="Ex. : Villa avec piscine" placeholderTextColor="#7e8775" style={styles.field}/>}</View>

    <View style={styles.panel}><Text style={styles.kicker}>2 · LA VIDÉO</Text>{video ? <><View style={styles.videoInfo}><View style={styles.videoIcon}><Text style={styles.videoIconText}>▶</Text></View><View style={{ flex: 1 }}><Text numberOfLines={2} style={styles.cardTitle}>{video.fileName || 'Ma vidéo'}</Text><Text style={styles.small}>{timeLabel(durationMs)} · traitée sur cet appareil</Text></View></View><Button title={busy ? 'Extraction en cours…' : frames.length ? 'Recréer 6 propositions' : 'Extraire 6 photos'} disabled={busy} onPress={() => void extract(suggestedTimes(durationMs), true)}/><Button title="Choisir une autre vidéo" secondary disabled={busy} onPress={() => void pickVideo()}/></> : <><Text style={styles.body}>Choisissez une vidéo du logement. Six images bien réparties seront proposées automatiquement.</Text><Button title={busy ? 'Ouverture…' : 'Choisir une vidéo'} disabled={busy} onPress={() => void pickVideo()}/><Text style={styles.small}>MP4, MOV ou vidéo de la photothèque · 500 Mo maximum</Text></>}</View>

    {!!video && <View style={styles.panel}><Text style={styles.kicker}>AJOUTER UN INSTANT PRÉCIS · FACULTATIF</Text><Text style={styles.small}>Entrez la seconde voulue, par exemple 12,5.</Text><View style={styles.customRow}><TextInput accessibilityLabel="Seconde de la vidéo" value={instant} onChangeText={setInstant} keyboardType="decimal-pad" placeholder="12,5" placeholderTextColor="#7e8775" style={[styles.field, { flex: 1 }]}/><Pressable accessibilityRole="button" accessibilityState={{ disabled: !customValid || busy }} disabled={!customValid || busy} onPress={() => void extract([customTime], false)} style={[styles.addButton, (!customValid || busy) && { opacity: .4 }]}><Text style={styles.addButtonText}>+ Ajouter</Text></Pressable></View></View>}

    {!!video && <><View style={styles.panel}><Text style={styles.kicker}>3 · LE RÉSULTAT SOUHAITÉ</Text><Text style={styles.body}>Dites ce que vous voulez obtenir. Cette demande sera liée à toutes les photos choisies.</Text><TextInput accessibilityLabel="Votre demande pour les photos" value={request} onChangeText={setRequest} maxLength={20000} multiline placeholder="Ex. : plus lumineux, enlève les objets qui traînent, rendu naturel pour Airbnb…" placeholderTextColor="#7e8775" style={styles.request}/></View><MobileBriefAssistant kind="photo" request={request} onUse={setRequest} storageKey="studio-annonce.mobile.assistant.video-frames.v1"/></>}

    {!!frames.length && <View style={styles.panel}><View style={styles.frameHeader}><View><Text style={styles.kicker}>4 · VOS PHOTOS</Text><Text style={styles.small}>Touchez une photo pour la garder ou l’enlever.</Text></View><Text style={styles.count}>{selected.length} / {frames.length}</Text></View><View style={styles.grid}>{frames.map(frame => <Pressable key={frame.id} accessibilityRole="button" accessibilityState={{ selected: frame.selected }} accessibilityLabel={`Image à ${timeLabel(frame.timeMs)}`} onPress={() => setFrames(current => current.map(item => item.id === frame.id ? { ...item, selected: !item.selected } : item))} style={[styles.frame, frame.selected && styles.frameSelected]}><Image source={{ uri: frame.uri }} style={styles.image}/><Text style={styles.time}>{timeLabel(frame.timeMs)}</Text><Text style={[styles.check, frame.selected && styles.checkSelected]}>{frame.selected ? '✓' : '+'}</Text></Pressable>)}</View><Button title={busy ? 'Enregistrement…' : `Ajouter ${selected.length} ${selected.length > 1 ? 'photos' : 'photo'} à « ${logement || '…'} »`} disabled={busy || !selected.length || !logement} onPress={() => void save()}/><Text style={styles.small}>La vidéo n’est pas envoyée à un serveur. Les photos extraites sont enregistrées dans votre espace local avec votre demande.</Text></View>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  back: { color: colors.muted, fontSize: 14, paddingVertical: 5 },
  panel: { backgroundColor: '#fffefa', padding: 19, borderRadius: 17, borderWidth: 1, borderColor: '#e0e4d7', gap: 13 },
  kicker: { fontSize: 10, fontWeight: '600', letterSpacing: 1.3, color: colors.muted, lineHeight: 17 },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted }, small: { fontSize: 12, lineHeight: 18, color: colors.muted }, cardTitle: { fontSize: 16, lineHeight: 22, color: colors.ink, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 40, paddingHorizontal: 14, borderWidth: 1, borderColor: '#d8decf', borderRadius: 22, justifyContent: 'center' }, chipActive: { backgroundColor: colors.ink, borderColor: colors.ink }, chipText: { fontSize: 13, color: colors.muted }, chipTextActive: { color: '#fffefa' },
  field: { minHeight: 48, borderWidth: 1, borderColor: '#cbd3be', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, color: colors.ink, backgroundColor: '#fffefa' },
  request: { minHeight: 112, borderWidth: 1, borderColor: '#cbd3be', borderRadius: 10, padding: 14, fontSize: 15, lineHeight: 22, textAlignVertical: 'top', color: colors.ink, backgroundColor: '#fffefa' },
  videoInfo: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, borderRadius: 13, backgroundColor: '#f2f3ec' }, videoIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#30372a' }, videoIconText: { color: '#fffefa', fontSize: 18 },
  customRow: { flexDirection: 'row', gap: 9 }, addButton: { minWidth: 106, minHeight: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#30372a' }, addButtonText: { color: '#fffefa', fontWeight: '600' },
  frameHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, count: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.sage, color: '#526641', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, frame: { position: 'relative', width: '48%', aspectRatio: 4 / 3, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#e7e9e0' }, frameSelected: { borderColor: '#687f50' }, image: { width: '100%', height: '100%', resizeMode: 'cover' }, time: { position: 'absolute', left: 7, bottom: 7, backgroundColor: '#fffefae8', color: colors.ink, borderRadius: 6, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, fontSize: 11 }, check: { position: 'absolute', right: 7, top: 7, width: 28, height: 28, borderRadius: 14, overflow: 'hidden', textAlign: 'center', lineHeight: 28, backgroundColor: '#fffefae8', color: colors.ink, fontWeight: '700' }, checkSelected: { backgroundColor: colors.ink, color: '#fffefa' },
  notice: { fontSize: 14, lineHeight: 22, color: '#775729', backgroundColor: '#f4ead5', padding: 15, borderRadius: 12 },
});

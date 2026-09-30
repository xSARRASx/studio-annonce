import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { downloadState, emptyStudio, logementOf, readStudio, renewEditWindow, simulateDownload, type Project, type StudioData } from '../lib/studio-model';
import { loadState, photoUri, saveState, storePhoto } from '../lib/studio-storage';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { OptionalPropertyPicker } from './OptionalPropertyPicker';

export const colors = { ink: '#30372a', cream: '#f8f7f2', sage: '#e9edde', muted: '#69725f' };
export const versions = [
  { label: 'Original', image: require('../../assets/photos/salon-avant.png') },
  { label: 'Lumière', image: require('../../assets/photos/salon-apres.png') },
  { label: 'Déco terracotta', image: require('../../assets/photos/salon-deco.png') },
  { label: 'Décoration complète', image: require('../../assets/photos/salon-deco-complete.png') },
];
type Receipt = { charged: boolean; deadline: number | null; renewed?: boolean; offered?: boolean; original?: boolean };
export type LocalPhotoAsset = Pick<ImagePicker.ImagePickerAsset, 'uri' | 'fileName' | 'mimeType' | 'fileSize'>;
type StudioState = {
  projects: Project[]; now: number; ready: boolean; storageNotice: string; uris: Record<string, string>;
  credits: number; creditsUsed: number; freeUsed: boolean; startExample: () => string; add: (asset: LocalPhotoAsset, property: string, request: string) => Promise<string>;
  update: (id: string, values: Partial<Pick<Project, 'selected' | 'saved' | 'request' | 'title' | 'property'>>) => Promise<boolean>;
  download: (id: string) => Receipt | null;
  renew: (id: string) => Receipt | null;
};
const Context = createContext<StudioState | null>(null);
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StudioData>(emptyStudio);
  const now = useNow();
  const current = useRef(data);
  const writeQueue = useRef(Promise.resolve());
  const writable = useRef(false);
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const [uris, setUris] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const restored = readStudio(await loadState());
        if (!active) return;
        current.current = restored; setData(restored); writable.current = true;
        const results = await Promise.all(restored.projects.filter(p => p.photoKey).map(async p => {
          try { return [p.id, await photoUri(p.photoKey!)] as const; }
          catch { return [p.id, ''] as const; }
        }));
        if (!active) return;
        setUris(Object.fromEntries(results));
        if (results.some(([, uri]) => !uri)) setStorageNotice('Une photo locale est indisponible. Son projet et son historique sont conservés.');
      } catch {
        if (active) setStorageNotice('Le stockage local ne peut pas être ouvert. Les données existantes sont préservées ; ces nouveaux essais resteront dans cette session.');
      } finally { if (active) setReady(true); }
    }
    void restore();
    return () => { active = false; };
  }, []);
  function commit(next: StudioData) {
    current.current = next; setData(next);
    if (!writable.current) return Promise.resolve(false);
    const saved = writeQueue.current.then(async () => { await saveState(next); return true; }).catch(() => {
      setStorageNotice('Enregistrement local impossible. Gardez cet écran ouvert pour conserver les dernières modifications de cette session.');
      return false;
    });
    writeQueue.current = saved.then(() => undefined);
    return saved;
  }
  function startExample() {
    const id = 'salon-demo';
    if (!current.current.projects.some(p => p.id === id)) commit({ ...current.current, projects: [createProject(id, 'Le salon', 'example', 'Appartement Lumière'), ...current.current.projects] });
    return id;
  }
  async function add(asset: LocalPhotoAsset, property: string, request: string) {
    if (asset.fileSize && asset.fileSize > 20 * 1024 * 1024) throw new Error('Choisissez une photo de moins de 20 Mo.');
    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const key = await storePhoto(id, asset.uri, asset.mimeType);
    const uri = await photoUri(key);
    setUris(existing => ({ ...existing, [id]: uri }));
    const title = asset.fileName?.replace(/\.[^.]+$/, '').slice(0, 60) || `Ma photo ${current.current.projects.filter(p => p.source === 'photo').length + 1}`;
    const project = { ...createProject(id, title, 'photo', property), photoKey: key, request };
    commit({ ...current.current, projects: [project, ...current.current.projects] });
    return id;
  }
  function update(id: string, values: Partial<Pick<Project, 'selected' | 'saved' | 'request' | 'title' | 'property'>>) {
    if (!current.current.projects.some(project => project.id === id)) return Promise.resolve(false);
    const patch = 'property' in values ? { ...values, property: values.property?.trim().slice(0, 100) || 'Sans logement' } : values;
    return commit({ ...current.current, projects: current.current.projects.map(p => p.id === id ? { ...p, ...patch } : p) });
  }
  function download(id: string) {
    const result = simulateDownload(current.current, id, Date.now());
    if (!result) return null;
    commit(result.data);
    return { charged: result.charged, offered: result.offered, original: result.original, deadline: result.deadline };
  }
  function renew(id: string) {
    const result = renewEditWindow(current.current, id, Date.now());
    if (!result) return null;
    commit(result.data);
    return { charged: true, deadline: result.deadline, renewed: true };
  }
  return <Context.Provider value={{ projects: [...data.projects].sort((a, b) => b.created - a.created), now, ready, storageNotice, uris, startExample, add, update, download, renew, freeUsed: data.freeUsed, creditsUsed: data.creditsUsed, credits: Math.max(0, data.creditsTotal - data.creditsUsed) }}>{children}</Context.Provider>;
}
function createProject(id: string, title: string, source: Project['source'], property: string): Project {
  return { id, title, source, property, created: Date.now(), selected: source === 'example' ? 3 : 0, saved: null, request: '', firstDownloadedAt: null, windowStartedAt: null, downloadCount: 0 };
}
export function useStudio() { const state = useContext(Context); if (!state) throw new Error('StudioProvider missing'); return state; }
function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 30000);
    const listener = AppState.addEventListener('change', tick);
    return () => { clearInterval(interval); listener.remove(); };
  }, []);
  return now;
}
function projectImages(project: Project, uris: Record<string, string>): { label: string; image: ImageSourcePropType | undefined }[] {
  return project.source === 'example' ? versions : [{ label: 'Original', image: uris[project.id] ? { uri: uris[project.id] } : undefined }];
}
function dateLabel(date: number) { return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); }
function deadlineLabel(date: number) { return new Date(date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
export function Logo() {
  return <View style={s.brand}><Svg width={31} height={35} viewBox="0 0 80 88"><Path d="M8 70V35a28 28 0 0 1 56 0v35L53 63V35a17 17 0 0 0-34 0v28Z" fill="#30372a"/><Path d="M20 27l17 10v24L20 69Z M37 63l8 19H31l-3-15Z" fill="#859067"/><Path d="M41 63l29 19H54L37 64Z" fill="#b6bd99"/></Svg><Text style={s.brandText}>studio<Text style={{ fontWeight: '400' }}> annonce</Text></Text></View>;
}
export function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, { opacity: disabled ? .4 : pressed ? .7 : 1 }]}><Text style={[s.buttonText, secondary && { color: colors.ink }]}>{title}</Text></Pressable>;
}
export function Screen({ title, subtitle, children, back }: { title: string; subtitle: string; children: React.ReactNode; back?: 'create' | 'library' }) {
  const { ready, storageNotice } = useStudio();
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}><View style={s.header}><Logo/><Text style={s.badge}>DÉMO</Text></View><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{back && <Pressable accessibilityRole="button" onPress={() => router.navigate(back === 'create' ? '/creer' : '/')} style={{ alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center' }}><Text style={s.backLink}>← {back === 'create' ? 'Tous les outils de création' : 'Mes créations'}</Text></Pressable>}<Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text>{!!storageNotice && <Text accessibilityLiveRegion="polite" style={s.warning}>{storageNotice}</Text>}{ready ? children : <View style={s.empty}><ActivityIndicator color={colors.ink}/><Text style={s.body}>Vos créations reprennent leur place…</Text></View>}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
function Photo({ source, label, small = false }: { source: ImageSourcePropType | undefined; label: string; small?: boolean }) {
  return source ? <Image source={source} accessibilityLabel={label} style={small ? s.thumbnail : s.photo}/> : <View style={[small ? s.thumbnail : s.photo, s.photoMissing]}><Text style={s.small}>{small ? 'Photo' : 'Photo locale indisponible'}</Text></View>;
}
export function PhotosScreen() {
  const { projects, startExample } = useStudio();
  const miennes = projects.filter(p => p.source !== 'example');
  const exemples = projects.filter(p => p.source === 'example');
  const logements = [...new Set(miennes.map(logementOf))];
  /* Les exemples ne sont pas un logement : ils ont leur petite partie à eux, tout en bas. */
  const partieExemples = <View style={s.examples}><Text style={s.section}>Exemples</Text><Pressable accessibilityRole="button" onPress={() => router.push('/exemples')}><Text style={s.backLink}>Explorer les 8 photos, leurs demandes et leurs propositions →</Text></Pressable><Text style={s.muted}>Un exemple tout prêt, pour voir ce que le studio sait faire. Il ne compte pas dans vos photos et ne coûte rien.</Text><Pressable accessibilityRole="button" accessibilityLabel="Ouvrir l’exemple du salon" onPress={() => { const id = startExample(); router.push({ pathname: '/retouche', params: { id } }); }} style={s.exampleCard}><View><Image source={versions[3].image} style={s.cover}/><View style={s.imageTag}><Text style={s.imageTagText}>PHOTO</Text></View></View><View style={s.cardBody}><Text style={s.cardTitle}>Le salon</Text><Text style={s.muted}>Une photo de salon retouchée 4 fois : plus de lumière, couleurs chaudes, nouvelle déco. Comparez les versions.</Text><Text style={s.rowTitle}>{exemples.length ? 'Rouvrir ›' : 'Ouvrir l’exemple ›'}</Text></View></Pressable></View>;
  if (!miennes.length) return <Screen title="Mes créations" subtitle="Votre studio est prêt.">
    <View style={s.importCard}><Text style={s.eyebrow}>VOTRE PREMIÈRE CRÉATION</Text><Text style={s.importTitle}>Une photo, une vidéo, une idée.</Text><Text style={s.body}>Choisissez ce que vous voulez créer. Vos photos enregistrées et leurs versions vous attendront ici.</Text><Button title="Commencer ma première création" onPress={() => router.navigate('/creer')}/></View>
    {partieExemples}
  </Screen>;
  const groupes = logements.map(l => ({ nom: l, photos: miennes.filter(p => logementOf(p) === l) }));
  return <Screen title="Mes créations" subtitle="Retrouvez vos projets par logement. Touchez-en un pour le reprendre.">
    <Button title="+ Créer" onPress={() => router.navigate('/creer')}/>
    {groupes.map(g => <View key={g.nom} style={{ gap: 10 }}><View style={s.sectionHeading}><Text style={s.section}>{g.nom}</Text><Text style={s.count}>{g.photos.length}</Text></View>{g.photos.map(p => <ProjectRow key={p.id} project={p}/>)}<Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/nouvelle', params: { logement: g.nom, retour: undefined } })}><Text style={s.backLink}>+ Ajouter une photo à ce logement</Text></Pressable></View>)}
    {partieExemples}
  </Screen>;
}
/* Nouvelle retouche : une photo, une idée, et un rangement facultatif. */
export function CreateScreen() {
  const params = useLocalSearchParams<{ logement?: string; retour?: string }>();
  const pathname = usePathname();
  const { projects, ready, add, freeUsed, startExample } = useStudio();
  const logements = [...new Set(projects.filter(p => p.source !== 'example').map(logementOf))];
  const [logement, setLogement] = useState(params.logement && params.logement !== 'Sans logement' ? params.logement : '');
  const [photo, setPhoto] = useState<LocalPhotoAsset | null>(null);
  const [demande, setDemande] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const appliedProperty = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!params.logement) { appliedProperty.current = undefined; return; }
    if (!ready || pathname !== '/nouvelle' || appliedProperty.current === params.logement) return;
    appliedProperty.current = params.logement;
    setLogement(params.logement === 'Sans logement' ? '' : params.logement);
    // Apply only an explicit property handoff. Merely switching tabs keeps the draft intact.
    router.setParams({ logement: undefined });
  }, [params.logement, ready, pathname]);

  async function pick(camera: boolean) {
    setBusy(true); setNotice('');
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setNotice('Autorisez l’appareil photo dans les réglages pour prendre une photo.'); return; }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: .9, allowsEditing: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0]);
    } catch (error) { setNotice(error instanceof Error && error.message.startsWith('Choisissez') ? error.message : 'La photo n’a pas pu être conservée sur cet appareil. Vérifiez l’espace disponible puis réessayez.'); }
    finally { setBusy(false); }
  }
  async function create() {
    if (!photo || busy) return;
    setBusy(true); setNotice('');
    try {
      const id = await add(photo, logement.trim() || 'Sans logement', demande.trim());
      const returnToVideo = params.retour === 'visite';
      setPhoto(null); setDemande(''); setLogement('');
      router.setParams({ logement: undefined, retour: undefined });
      if (returnToVideo) router.navigate({ pathname: '/visite', params: { importedPhoto: id } });
      else router.push({ pathname: '/retouche', params: { id } });
    } catch (error) { setNotice(error instanceof Error && error.message.startsWith('Choisissez') ? error.message : 'La photo n’a pas pu être conservée sur cet appareil. Vérifiez l’espace disponible puis réessayez.'); }
    finally { setBusy(false); }
  }
  return <Screen title="Retoucher une photo" subtitle={freeUsed ? 'Une photo, une idée, et c’est parti.' : 'Votre première photo retouchée est offerte.'} back="create">
    {params.retour === 'visite' && <Text style={s.notice}>Ajoutez la photo : elle sera sélectionnée dans votre vidéo et vous retrouverez votre demande.</Text>}
    <View style={s.panel}><Text style={s.eyebrow}>1 · VOTRE PHOTO</Text>{photo && <Photo source={{ uri: photo.uri }} label="La photo choisie"/>}<Button title={busy ? 'Ouverture…' : photo ? 'Reprendre une photo' : 'Prendre une photo'} disabled={busy} onPress={() => void pick(true)}/><Button title={photo ? 'Choisir une autre photo' : 'Choisir dans mes photos'} secondary disabled={busy} onPress={() => void pick(false)}/><Text style={s.small}>Une seule photo par retouche.</Text></View>
    <View style={s.panel}><Text style={s.eyebrow}>2 · CE QUE VOUS VOULEZ CHANGER · FACULTATIF</Text><TextInput accessibilityLabel="Votre demande de retouche" value={demande} onChangeText={setDemande} maxLength={20000} placeholder="Ex. : plus de lumière, enlève le bazar…" placeholderTextColor="#7e8775" multiline style={s.input}/><View style={s.suggestions}>{['Plus de lumière', 'Désencombrer', 'Changer toute la déco'].map(text => <Pressable key={text} accessibilityRole="button" onPress={() => setDemande(d => d ? `${d}, ${text.toLowerCase()}` : text)} style={s.suggestion}><Text style={s.small}>+ {text}</Text></Pressable>)}</View></View>
    <MobileBriefAssistant kind="photo" request={demande} onUse={setDemande} storageKey="studio-annonce.mobile.assistant.photo-new.v1"/>
    <OptionalPropertyPicker value={logement} properties={logements} onChange={setLogement}/>
    <Button title={busy ? 'Enregistrement…' : params.retour === 'visite' ? 'Ajouter à ma vidéo' : 'Ouvrir ma retouche'} disabled={busy || !photo} onPress={() => void create()}/>
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
    <Pressable accessibilityRole="button" onPress={() => { const id = startExample(); router.push({ pathname: '/retouche', params: { id } }); }}><Text style={s.backLink}>Pas de photo sous la main ? Voir le salon d’exemple ›</Text></Pressable>
  </Screen>;
}
function ProjectRow({ project, history = false }: { project: Project; history?: boolean }) {
  const { uris, now } = useStudio();
  const images = projectImages(project, uris);
  const window = downloadState(project, now);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${history ? 'Historique de' : 'Retoucher'} ${project.title}`} onPress={() => router.push({ pathname: history ? '/historique' : '/retouche', params: { id: project.id } })} style={s.listRow}><Photo source={images[project.selected].image} label={project.title} small/><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={2} style={s.rowTitle}>{project.title}</Text><Text style={s.muted}>{images.length} {images.length === 1 ? 'version' : 'versions'} · {dateLabel(project.created)}</Text><Text style={s.rowStatus}>{window.expired ? 'Délai de retouche terminé' : window.deadline ? `Retouches · ${window.remaining} j restants` : project.saved !== null ? 'Version gardée' : 'À découvrir'}</Text></View><Text style={s.arrow}>›</Text></Pressable>;
}
export const AtelierScreen = PhotosScreen;
export const VersionsScreen = PhotosScreen;
export function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PhotoEditor key={id} id={id}/>;
}
function PhotoEditor({ id }: { id: string }) {
  const { projects, uris, now, update, download, renew, credits, freeUsed } = useStudio();
  const project = projects.find(p => p.id === id);
  const [original, setOriginal] = useState(false);
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [propertyDraft, setPropertyDraft] = useState<string | null>(null);
  const [propertyBusy, setPropertyBusy] = useState(false);
  const [propertySaveFailed, setPropertySaveFailed] = useState(false);
  const [propertyNotice, setPropertyNotice] = useState('');
  if (!project) return <Screen title="Retrouvons votre photo." subtitle="Ouvrez une photo depuis Mes créations."><Button title="Retour à mes créations" onPress={() => router.replace('/')}/></Screen>;
  const images = projectImages(project, uris);
  const selected = project.selected;
  const shown = original ? 0 : selected;
  const window = downloadState(project, now);
  const currentProperty = logementOf(project);
  const propertyValue = propertyDraft ?? (currentProperty === 'Sans logement' ? '' : currentProperty);
  const nextProperty = propertyValue.trim() || 'Sans logement';
  function triggerDownload() {
    const result = download(project!.id);
    if (result) setReceipt(result);
    else setNotice('Vos crédits de démonstration sont utilisés. Aucun achat ni paiement n’est proposé dans cet aperçu.');
  }
  return <Screen title="Votre photo" subtitle={`${project.title} · ${logementOf(project)}`} back="library">
    <View style={s.card}><View style={s.resultHeading}><Text style={s.resultLabel}>{images[shown].label}</Text><Text style={s.muted}>{shown + 1} / {images.length}</Text></View><Photo source={images[shown].image} label={images[shown].label}/><View style={s.cardBody}><Button title={original ? 'Revoir ma version' : 'Comparer avec l’original'} secondary disabled={selected === 0} onPress={() => setOriginal(!original)}/>{project.source === 'example' && selected >= 2 && <Text style={s.small}>Aménagement virtuel · Exemple de décoration</Text>}</View></View>
    {project.source === 'photo' && <View style={{ gap: 10 }}>
      <OptionalPropertyPicker value={propertyValue} properties={projects.filter(item => item.source === 'photo').map(logementOf)} onChange={value => { setPropertyDraft(value); setPropertyNotice(''); setPropertySaveFailed(false); }}/>
      {(nextProperty !== currentProperty || propertyBusy || propertySaveFailed) && <Button title={propertyBusy ? 'Enregistrement…' : 'Enregistrer le rangement'} disabled={propertyBusy} onPress={() => {
        setPropertyBusy(true); setPropertyNotice(''); setPropertySaveFailed(false);
        void update(project.id, { property: nextProperty }).then(saved => {
          setPropertySaveFailed(!saved);
          setPropertyNotice(saved ? `Rangement enregistré : ${nextProperty}.` : 'Le rangement est modifié pour cette session. L’enregistrement sur cet appareil n’a pas abouti.');
        }).finally(() => setPropertyBusy(false));
      }}/>}
      {!!propertyNotice && <Text accessibilityLiveRegion="polite" style={s.notice}>{propertyNotice}</Text>}
    </View>}
    {images.length > 1 && <View style={s.panel}><Text style={s.section}>Toutes les versions · {images.length}</Text>{images.map((item, i) => <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: selected === i }} accessibilityLabel={`Afficher ${item.label}`} onPress={() => { setOriginal(false); update(project.id, { selected: i }); }} style={[s.versionRow, selected === i && s.selected]}><Photo source={item.image} label={item.label} small/><View style={{ flex: 1, gap: 4 }}><Text style={s.eyebrow}>{i === 0 ? 'LE POINT DE DÉPART' : `VERSION ${i}`}</Text><Text style={s.rowTitle}>{item.label}</Text><Text style={s.rowStatus}>{project.saved === i ? '♥ Version gardée' : selected === i ? 'Affichée' : 'Afficher'}</Text></View></Pressable>)}</View>}
    {window.deadline !== null && <View style={[s.deadline, window.expired && s.deadlineExpired]}><Text style={s.eyebrow}>{window.expired ? 'DÉLAI TERMINÉ' : 'VOS 7 JOURS DE RETOUCHE'}</Text><Text style={s.section}>{window.expired ? 'Votre photo reste disponible.' : `Jusqu’au ${deadlineLabel(window.deadline)}`}</Text><Text style={s.small}>{window.expired ? 'Relancer les modifications demande un nouveau crédit de démonstration.' : 'Les téléchargements suivants ne relancent pas ce délai.'}</Text>{window.expired && <Button title="Réactiver les retouches · 1 crédit démo" disabled={credits === 0} onPress={() => { const result = renew(project.id); if (result) setReceipt(result); }}/>}</View>}
    <View style={s.panel}><Text style={s.section}>{images.length === 1 ? 'Votre idée pour cette photo' : 'Un autre ajustement ?'}</Text><TextInput accessibilityLabel="Votre demande de retouche" value={project.request} onChangeText={request => update(project.id, { request })} maxLength={20000} editable={!window.expired} placeholder="Ex. : une décoration plus chaleureuse…" placeholderTextColor="#7e8775" multiline style={[s.input, window.expired && { opacity: .55 }]}/>{!window.expired && <View style={s.suggestions}>{['Plus de lumière', 'Changer la décoration', 'Désencombrer'].map(text => <Pressable key={text} accessibilityRole="button" onPress={() => update(project.id, { request: text })} style={s.suggestion}><Text style={s.small}>{text}</Text></Pressable>)}</View>}<>{!window.expired && <MobileBriefAssistant kind="photo" request={project.request} onUse={request => update(project.id, { request })} storageKey={`studio-annonce.mobile.assistant.photo.${project.id}.v1`}/>}</><Button title={window.expired ? 'Retouches à réactiver' : 'Préparer cette retouche'} disabled={!project.request.trim() || window.expired} onPress={() => setNotice('Votre demande est conservée avec cette photo. La génération IA sera connectée plus tard ; aucune nouvelle image n’a été créée.')}/><Text style={s.small}>Votre demande est gardée localement. Génération IA à venir.</Text></View>
    <View style={s.panel}><Text style={s.section}>Celle-ci vous plaît ?</Text><Button title={project.saved === selected ? 'Version gardée ✓' : 'Garder cette version'} secondary onPress={() => { update(project.id, { saved: selected }); setNotice('Votre version préférée est gardée avec cette photo. Aucun crédit utilisé.'); }}/><Button title={selected === 0 ? 'Simuler le téléchargement de l’original' : project.firstDownloadedAt === null ? freeUsed ? 'Simuler le téléchargement · 1 crédit démo' : 'Simuler mon premier téléchargement offert' : 'Simuler un nouveau téléchargement'} disabled={selected !== 0 && project.firstDownloadedAt === null && freeUsed && credits === 0} onPress={triggerDownload}/><Text style={s.small}>Simulation uniquement · Aucun fichier téléchargé, aucun paiement.</Text>{credits === 0 && <Text style={s.small}>Tous les crédits de démonstration ont été utilisés.</Text>}</View>
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
    <Modal visible={receipt !== null} transparent animationType="fade" onRequestClose={() => {}}><View style={s.modalBackdrop}><View accessibilityViewIsModal style={s.modalCard}><Pressable accessibilityRole="button" accessibilityLabel="Fermer l’information de téléchargement" onPress={() => setReceipt(null)} style={s.modalClose}><Text style={s.closeText}>×</Text></Pressable><ScrollView contentContainerStyle={s.modalContent} bounces={false}><Text style={s.eyebrow}>{receipt?.renewed ? 'RETOUCHES RÉACTIVÉES · DÉMO' : 'SIMULATION DE TÉLÉCHARGEMENT'}</Text><View style={s.receiptIcon}><Text style={s.receiptCheck}>✓</Text></View><Text accessibilityRole="header" style={s.modalTitle}>{receipt?.original ? 'Votre original reste gratuit.' : receipt?.offered ? 'Votre première photo est offerte.' : receipt?.charged ? 'Votre photo, vos 7 jours.' : 'Votre version est prête.'}</Text><Text style={s.modalBody}>{receipt?.original ? 'Aucun crédit ni offre de bienvenue utilisés. Cette image n’a pas encore été retouchée : télécharger l’original ne démarre aucun délai de sept jours.' : receipt?.offered ? '0 crédit utilisé. Votre première photo est offerte, avec 7 jours pour reprendre ses retouches. Votre solde reste intact.' : receipt?.charged ? '1 crédit de démonstration a été utilisé. Vous disposez de 7 jours pour reprendre les retouches de cette photo.' : 'Aucun crédit supplémentaire utilisé. La date limite de cette photo reste la même.'}</Text><>{receipt?.deadline != null && <><View style={s.receiptDate}><Text style={s.small}>RETOUCHES JUSQU’AU</Text><Text style={s.receiptDateText}>{deadlineLabel(receipt.deadline)}</Text></View><Text style={s.modalBody}>Après cette date, reprendre les modifications demandera un nouveau crédit.</Text></>}</><Text style={s.small}>Aucun débit réel. Ce parcours sert à découvrir le fonctionnement du studio.</Text><Button title="J’ai compris" onPress={() => setReceipt(null)}/></ScrollView></View></View></Modal>
  </Screen>;
}
export function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, uris, update } = useStudio();
  const project = projects.find(p => p.id === id);
  if (!project) return <Screen title="Retrouvons cet historique." subtitle="Choisissez une photo dans Mes créations."><Button title="Retour à mes créations" onPress={() => router.replace('/')}/></Screen>;
  const images = projectImages(project, uris);
  return <Screen title="Toutes les versions" subtitle={project.title} back="library"><View style={s.historyIntro}><Text style={s.eyebrow}>{images.length} {images.length === 1 ? 'IMAGE CONSERVÉE' : 'IMAGES CONSERVÉES'}</Text><Text style={s.body}>Touchez une version pour la voir en grand.</Text></View>{images.map((item, i) => <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: project.selected === i }} accessibilityLabel={`Afficher ${item.label}${project.saved === i ? ', version gardée' : ''}`} onPress={() => { update(project.id, { selected: i }); router.push({ pathname: '/retouche', params: { id: project.id } }); }} style={[s.versionRow, project.selected === i && s.selected]}><Photo source={item.image} label={item.label} small/><View style={{ flex: 1, gap: 5 }}><Text style={s.eyebrow}>{i === 0 ? 'VOTRE POINT DE DÉPART' : `VERSION ${i}`}</Text><Text style={s.rowTitle}>{item.label}</Text><Text style={s.rowStatus}>{project.saved === i ? '♥ Version gardée' : project.selected === i ? 'Version affichée' : 'Ouvrir cette version'}</Text></View><Text style={s.arrow}>›</Text></Pressable>)}<Text style={s.small}>L’original et toutes les propositions sont conservés. Chaque photo possède son propre historique.</Text></Screen>;
}
const PACKS = [
  ['10 crédits photo', '9,99 €', '1,00 € / photo'],
  ['30 crédits photo', '24,99 €', '0,83 € / photo'],
  ['50 crédits photo', '34,99 €', '0,70 € / photo'],
  ['100 crédits photo', '59,99 €', '0,60 € / photo'],
];
export function AccountScreen() {
  const { projects, credits, creditsUsed, freeUsed } = useStudio();
  const operations = projects.filter(p => p.firstDownloadedAt !== null && p.source === 'example').sort((a, b) => b.firstDownloadedAt! - a.firstDownloadedAt!);
  return <Screen title="Facturation" subtitle="Vos crédits et vos factures.">
    <View style={s.creditsCard}><Text style={s.eyebrow}>SOLDE DE DÉMONSTRATION</Text><View style={s.creditNumber}><Text style={s.creditValue}>{credits}</Text><Text style={s.body}>{credits > 1 ? 'crédits' : 'crédit'}</Text></View><Text style={s.rowStatus}>{freeUsed ? 'Photo offerte utilisée' : '+ 1 photo offerte'}</Text><Text style={s.small}>1 crédit = 1 photo gardée en HD. Garder une version ne coûte rien.</Text></View>
    <View style={s.panel}><Text style={s.section}>Recharger</Text>{PACKS.map(([nom, prix, detail]) => <View key={nom} style={s.statRow}><View><Text style={s.rowTitle}>{nom}</Text><Text style={s.small}>{detail}</Text></View><Text style={s.statValue}>{prix}</Text></View>)}<Text style={s.small}>Le paiement arrive au lancement.</Text></View>
    <View style={s.panel}><Text style={s.section}>Historique</Text>{operations.length ? operations.map(p => <View key={p.id} style={s.statRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{p.title}</Text><Text style={s.small}>{logementOf(p)} · {dateLabel(p.firstDownloadedAt!)}</Text></View><Text style={s.statValue}>{freeUsed && p.id === operations[operations.length - 1].id ? 'Offerte' : '1 crédit'}</Text></View>) : <Text style={s.body}>Aucun crédit utilisé pour l’instant.</Text>}<Text style={s.small}>{creditsUsed} {creditsUsed > 1 ? 'crédits utilisés' : 'crédit utilisé'} au total.</Text></View>
    <View style={s.panel}><Text style={s.section}>Mes factures</Text><Text style={s.body}>Vos factures apparaîtront ici après votre premier achat, prêtes à télécharger en PDF.</Text></View>
    <Text style={s.small}>Démonstration : aucun achat ni paiement réel.</Text>
  </Screen>;
}
const s = StyleSheet.create({
  creativeLinks: { gap: 10, marginTop: 4 }, creativeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, creativeCard: { flex: 1, minWidth: 130, padding: 16, gap: 8, borderRadius: 15, borderWidth: 1, borderColor: '#dce2f3', backgroundColor: '#eff2fc' }, creativeFrames: { backgroundColor: '#f6eee2', borderColor: '#eadcc6' }, creativeVideo: { backgroundColor: '#f0f3e8', borderColor: '#dfe5d3' }, creativeSymbol: { fontSize: 25, color: '#7986b3' }, creativeTitle: { fontSize: 15, fontWeight: '600', lineHeight: 22, color: '#4f5a76' }, creativeLink: { fontSize: 12, color: '#6f7eaa', fontWeight: '500', marginTop: 4 },
  field: { borderWidth: 1, borderColor: '#d9ddcf', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.ink, backgroundColor: '#fffefa' },
  safe: { flex: 1, backgroundColor: colors.cream }, header: { paddingHorizontal: 22, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#e5e7dd' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandText: { fontSize: 21, fontWeight: '600', color: colors.ink, letterSpacing: -1 }, badge: { fontSize: 10, letterSpacing: 1, color: colors.muted, backgroundColor: colors.sage, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10 }, content: { padding: 22, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center', paddingBottom: 36 }, title: { fontSize: 32, fontWeight: '500', color: colors.ink, letterSpacing: -1, lineHeight: 38 }, subtitle: { fontSize: 15, lineHeight: 23, color: colors.muted, marginBottom: 6 }, section: { fontSize: 20, fontWeight: '500', color: colors.ink, lineHeight: 27 }, body: { fontSize: 16, lineHeight: 25, color: colors.muted }, muted: { fontSize: 13, color: colors.muted, lineHeight: 20 }, small: { fontSize: 12, lineHeight: 19, color: colors.muted }, eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, color: colors.muted, lineHeight: 17 }, button: { backgroundColor: colors.ink, minHeight: 49, borderRadius: 10, justifyContent: 'center', alignItems: 'center', padding: 13 }, secondary: { backgroundColor: colors.sage }, buttonText: { fontSize: 15, fontWeight: '500', color: '#fffefa', textAlign: 'center', lineHeight: 21 }, card: { borderRadius: 17, overflow: 'hidden', backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e0e4d7' }, cardBody: { padding: 16, gap: 9 }, cardTitle: { fontSize: 18, fontWeight: '500', color: colors.ink }, photo: { width: '100%', height: 230, resizeMode: 'contain', backgroundColor: '#e9e7dc' }, cover: { width: '100%', height: 210, resizeMode: 'cover' }, thumbnail: { width: 76, height: 82, borderRadius: 9, resizeMode: 'cover' }, photoMissing: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9e7dc' }, panel: { backgroundColor: '#fffefa', padding: 20, borderRadius: 17, borderWidth: 1, borderColor: '#e0e4d7', gap: 14 }, importCard: { backgroundColor: '#edf0e3', padding: 22, borderRadius: 20, gap: 14 }, importTitle: { fontSize: 27, lineHeight: 34, letterSpacing: -.7, color: colors.ink, marginBottom: 6 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }, count: { color: colors.muted, backgroundColor: colors.sage, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12 }, imageTag: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, backgroundColor: '#f8f7f2ed' }, imageTagText: { fontSize: 9, color: colors.ink, fontWeight: '600', letterSpacing: 1 }, examples: { gap: 10, marginTop: 18, paddingTop: 20, borderTopWidth: 1, borderColor: '#d9dfcd' }, exampleCard: { borderRadius: 17, overflow: 'hidden', backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#cfd6c2', marginTop: 4 }, listRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: '#e0e4d7', backgroundColor: '#fffefa' }, rowTitle: { fontSize: 15, fontWeight: '500', lineHeight: 21, color: colors.ink }, rowStatus: { fontSize: 11, lineHeight: 17, color: '#627747' }, arrow: { fontSize: 26, color: colors.muted }, empty: { padding: 24, borderRadius: 18, backgroundColor: '#eef1e5', gap: 18 }, emptyIcon: { fontSize: 44, color: '#809466' }, emptyTitle: { fontSize: 27, lineHeight: 34, letterSpacing: -.6, color: colors.ink }, chip: { minHeight: 40, paddingHorizontal: 16, borderWidth: 1, borderColor: '#d8decf', borderRadius: 24, justifyContent: 'center' }, chipActive: { backgroundColor: colors.ink, borderColor: colors.ink }, chipText: { fontSize: 13, color: colors.muted }, chipTextActive: { color: '#fffefa' }, input: { borderWidth: 1, borderColor: '#cbd3be', borderRadius: 9, padding: 14, minHeight: 110, textAlignVertical: 'top', fontSize: 16, lineHeight: 23, color: colors.ink }, notice: { fontSize: 14, lineHeight: 22, color: '#526641', backgroundColor: colors.sage, padding: 16, borderRadius: 12 }, warning: { fontSize: 13, lineHeight: 20, color: '#775729', backgroundColor: '#f4ead5', padding: 15, borderRadius: 12 }, resultHeading: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, resultLabel: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '500' }, selected: { borderColor: '#7c925f', backgroundColor: '#f0f3e8' }, backLink: { color: colors.muted, fontSize: 14, paddingVertical: 8 }, suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, suggestion: { backgroundColor: '#f2f3ec', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20 }, deadline: { padding: 18, backgroundColor: '#e9efdf', borderRadius: 14, gap: 8 }, deadlineExpired: { backgroundColor: '#f1e7d6' }, modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22, backgroundColor: 'rgba(29,35,25,.65)' }, modalCard: { width: '100%', maxWidth: 430, maxHeight: '95%', backgroundColor: '#fffefa', borderRadius: 22, overflow: 'hidden' }, modalContent: { padding: 25, paddingTop: 48, gap: 15 }, modalClose: { position: 'absolute', right: 8, top: 5, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', zIndex: 1 }, closeText: { fontSize: 29, color: colors.muted }, modalTitle: { fontSize: 28, lineHeight: 34, letterSpacing: -.7, color: colors.ink }, modalBody: { fontSize: 15, lineHeight: 23, color: colors.muted }, receiptIcon: { backgroundColor: colors.sage, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }, receiptCheck: { fontSize: 26, color: '#6d8353' }, receiptDate: { padding: 16, backgroundColor: '#edf1e3', borderRadius: 12, gap: 6 }, receiptDateText: { color: colors.ink, fontWeight: '600', fontSize: 19, lineHeight: 26 }, historyIntro: { gap: 8, paddingBottom: 8 }, versionRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: '#e0e4d7', backgroundColor: '#fffefa', minHeight: 110 }, accountCard: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 8 }, avatar: { height: 54, width: 54, backgroundColor: '#e8dec8', borderRadius: 27, justifyContent: 'center', alignItems: 'center' }, avatarText: { fontSize: 23, color: '#7b6d51' }, creditsCard: { backgroundColor: '#e9edde', padding: 22, borderRadius: 17, gap: 14 }, creditNumber: { flexDirection: 'row', alignItems: 'center', gap: 16 }, creditValue: { fontSize: 62, letterSpacing: -3, color: colors.ink, lineHeight: 70 }, statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, statValue: { fontSize: 20, fontWeight: '500', color: colors.ink },
});

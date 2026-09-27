import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { Button, Screen, useStudio } from './Studio';
import { logementOf } from '../lib/studio-model';
import { useLocalDraft } from '../lib/use-local-draft';
import { suggestionState } from '../../../shared/idea-suggestions';

type PlannerKind = 'image' | 'video';
type PlannerDraft = { idea: string; brief: string; briefSource: string; selectedIds: string[] };
const emptyDraft: PlannerDraft = { idea: '', brief: '', briefSource: '', selectedIds: [] };
function readDraft(value: unknown): PlannerDraft {
  if (!value || typeof value !== 'object') throw new Error('Invalid creation draft');
  const draft = value as Partial<PlannerDraft>;
  return {
    idea: typeof draft.idea === 'string' ? draft.idea.slice(0, 4000) : '',
    brief: typeof draft.brief === 'string' ? draft.brief.slice(0, 20000) : '',
    briefSource: typeof draft.briefSource === 'string' ? draft.briefSource.slice(0, 20000) : '',
    selectedIds: Array.isArray(draft.selectedIds) ? [...new Set(draft.selectedIds.filter((id): id is string => typeof id === 'string'))].slice(0, 500) : [],
  };
}
const examples = {
  image: [
    ['Un intérieur à imaginer', 'Imagine un salon méditerranéen lumineux avec un canapé arrondi, du bois clair et une baie ouverte sur la mer.'],
    ['Une ambiance de chambre', 'Crée une chambre chaleureuse de style japonais, avec du bois foncé, des textiles écrus et une lumière douce en fin de journée.'],
    ['Un visuel créatif', 'Crée une illustration colorée d’une petite maison dans un jardin luxuriant, avec une composition simple et accueillante.'],
  ],
  video: [
    ['Une visite flottante', 'Une caméra flotte doucement depuis le salon vers la cuisine et s’attarde sur la lumière et les matières.'],
    ['Mettre en valeur les détails', 'Une vidéo élégante du logement, avec des plans rapprochés sur la décoration et un rythme calme.'],
    ['Imaginer une scène', 'Imagine une villa fictive au bord de la mer, filmée en vue drone avec une lumière de fin de journée.'],
  ],
} as const;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');

export function ImageCreationScreen() { return <CreationPlanner kind="image"/>; }
export function VideoPlanScreen() { return <CreationPlanner kind="video"/>; }

function CreationPlanner({ kind }: { kind: PlannerKind }) {
  const { projects, uris } = useStudio();
  const { draft, setDraft, ready, notice, saved } = useLocalDraft(`studio-annonce.mobile.${kind}-plan.v1`, emptyDraft, readDraft);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(12);
  const [showBrief, setShowBrief] = useState(false);
  const photos = projects.filter(project => project.source === 'photo');
  const selected = draft.selectedIds.map(id => photos.find(project => project.id === id)).filter((project): project is (typeof photos)[number] => !!project);
  const matching = photos.filter(project => normalize(`${project.title} ${logementOf(project)}`).includes(normalize(search.trim())));
  const context = kind === 'video' && selected.length ? `Photos sources, dans l’ordre choisi : ${selected.map((project, index) => `${index + 1}. ${project.title} (${logementOf(project)})`).join(' ; ')}.` : '';
  const source = `${draft.idea}\n${context}`;
  const staleBrief = !!draft.brief && source !== draft.briefSource;

  function togglePhoto(id: string) {
    setDraft(previous => ({ ...previous, selectedIds: previous.selectedIds.includes(id) ? previous.selectedIds.filter(value => value !== id) : [...previous.selectedIds, id] }));
  }
  function applyBrief(brief: string) {
    setDraft(previous => ({ ...previous, brief, briefSource: source }));
    setShowBrief(true);
  }
  function toggleIdea(suggestion: string) {
    setDraft(previous => {
      const next = suggestionState(previous.idea, suggestion);
      return next.added || !next.full ? { ...previous, idea: next.text } : previous;
    });
  }

  return <Screen title={kind === 'image' ? 'Créer une image' : 'Préparer une vidéo'} subtitle={kind === 'image' ? 'Un lieu, une ambiance ou un visuel à imaginer. Aucun fichier nécessaire.' : 'Une idée, un point de vue, un rythme. Vos photos peuvent guider la visite.'}>
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/')}><Text style={styles.back}>← Mes photos</Text></Pressable>
    {!ready ? <ActivityIndicator accessibilityLabel="Chargement du brouillon" color="#6478a8"/> : <>
      <View style={styles.panel}>
        <View style={styles.sectionHeading}><Text style={styles.number}>1</Text><Text style={styles.section}>Votre idée</Text></View>
        <Text style={styles.label}>Qu’aimeriez-vous {kind === 'image' ? 'créer' : 'montrer'} ?</Text>
        <TextInput accessibilityLabel={kind === 'image' ? 'Votre idée d’image' : 'Votre idée de vidéo'} value={draft.idea} onChangeText={idea => setDraft(previous => ({ ...previous, idea }))} maxLength={4000} multiline placeholder={kind === 'image' ? 'Ex. : un salon lumineux avec une décoration chaleureuse et une vue sur les montagnes…' : 'Ex. : une vue drone qui traverse le salon, puis ralentit près de la table…'} placeholderTextColor="#89917d" style={styles.input}/>
        <Text style={styles.small}>Quelques mots suffisent. L’aide vous permet de choisir des cartes et d’ajouter vos précisions.</Text>
        <Text style={styles.small}>Cliquez pour ajouter une idée, recliquez pour la retirer.</Text>
        <View style={styles.examples}>{examples[kind].map(([label, idea], index) => {
          const state = suggestionState(draft.idea, idea);
          const disabled = !state.added && state.full;
          return <Pressable key={label} accessibilityRole="button" accessibilityLabel={`${state.added ? 'Retirer' : 'Ajouter'} ${label}${disabled ? ' : limite de 4 000 caractères atteinte' : ''}`} aria-pressed={state.added} aria-disabled={disabled} accessibilityState={{ selected: state.added, disabled }} disabled={disabled} onPress={() => toggleIdea(idea)} style={[styles.example, index === 1 && styles.exampleSage, index === 2 && styles.exampleSand]}><Text style={styles.exampleLabel}>{label}</Text><Text style={[styles.exampleArrow, { fontSize: 12, fontWeight: '500' }]}>{state.added ? '✓ Ajouté · Retirer' : state.full ? 'Limite atteinte' : '+ Ajouter'}</Text></Pressable>;
        })}</View>
        {examples[kind].some(([, idea]) => { const state = suggestionState(draft.idea, idea); return !state.added && state.full; }) && <Text accessibilityLiveRegion="polite" style={styles.small}>Raccourcissez votre texte pour ajouter une idée complète sans dépasser 4 000 caractères.</Text>}
      </View>

      {kind === 'video' && <View style={styles.panel}>
        <View style={styles.sectionHeading}><Text style={styles.number}>2</Text><Text style={styles.section}>Vos photos, si vous en avez</Text></View>
        <Text style={styles.small}>Facultatif pour imaginer une scène. Pour un logement réel, choisissez ses photos pour guider le futur résultat.</Text>
        {photos.length ? <>
          <TextInput accessibilityLabel="Rechercher une photo ou un logement" value={search} onChangeText={value => { setSearch(value); setLimit(12); }} placeholder="Rechercher une photo, un logement…" placeholderTextColor="#8b937f" returnKeyType="search" style={styles.search}/>
          <Text accessibilityLiveRegion="polite" style={styles.count}>{selected.length} photo{selected.length > 1 ? 's' : ''} choisie{selected.length > 1 ? 's' : ''} · {matching.length} résultat{matching.length > 1 ? 's' : ''}</Text>
          {matching.slice(0, limit).map(project => {
            const index = draft.selectedIds.indexOf(project.id);
            return <Pressable key={project.id} accessibilityRole="checkbox" accessibilityLabel={`${project.title}, ${logementOf(project)}`} aria-checked={index >= 0} accessibilityState={{ checked: index >= 0 }} onPress={() => togglePhoto(project.id)} style={[styles.photoRow, index >= 0 && styles.selected]}>{uris[project.id] ? <Image source={{ uri: uris[project.id] }} style={styles.photo}/> : <View style={[styles.photo, styles.photoMissing]}><Text style={styles.small}>Photo</Text></View>}<View style={{ flex: 1, gap: 4 }}><Text numberOfLines={2} style={styles.photoTitle}>{project.title}</Text><Text numberOfLines={1} style={styles.small}>{logementOf(project)}</Text></View><Text style={styles.selectionMark}>{index >= 0 ? `${index + 1} ✓` : '+'}</Text></Pressable>;
          })}
          {!matching.length && <Text style={styles.small}>Aucune photo ne correspond à cette recherche.</Text>}
          {matching.length > limit && <Button title={`Voir plus de photos · ${matching.length - limit} restantes`} secondary onPress={() => setLimit(value => value + 12)}/>}
          <Text style={styles.small}>Les numéros suivent votre sélection. Pour déplacer une photo à la fin, retirez-la puis sélectionnez-la à nouveau.</Text>
        </> : <View style={styles.emptyPhotos}><Text style={styles.small}>Vous pouvez préparer votre idée tout de suite, puis ajouter les photos de votre logement.</Text><Button title="Ajouter une photo" secondary onPress={() => router.navigate('/nouvelle')}/></View>}
      </View>}

      <MobileBriefAssistant kind={kind} request={draft.idea} context={context} onUse={applyBrief} storageKey={`studio-annonce.mobile.assistant.${kind}-plan.v1`}/>

      {!!draft.brief && <View style={styles.panel}>
        <Text style={styles.readyLabel}>✓ VOTRE DESCRIPTION EST PRÊTE</Text>
        <Text style={styles.section}>{kind === 'image' ? 'Votre image prend forme.' : 'Votre visite a une direction.'}</Text>
        {staleBrief && <Text style={styles.warning}>Votre idée ou les photos ont changé depuis ce texte. Reprenez l’aide pour l’actualiser, ou ajustez la description.</Text>}
        <Pressable accessibilityRole="button" aria-expanded={showBrief} accessibilityState={{ expanded: showBrief }} onPress={() => setShowBrief(value => !value)} style={styles.disclosure}><Text style={styles.disclosureText}>{showBrief ? 'Masquer la description −' : 'Relire et modifier la description +'}</Text></Pressable>
        {showBrief && <TextInput accessibilityLabel={kind === 'image' ? 'Description de l’image modifiable' : 'Description de la vidéo modifiable'} value={draft.brief} onChangeText={brief => setDraft(previous => ({ ...previous, brief }))} maxLength={20000} multiline style={[styles.input, { minHeight: 240 }]}/>}
      </View>}

      <View style={styles.next}><Text style={styles.nextTitle}>✦ {kind === 'image' ? 'Imaginez librement.' : 'Votre brief reste modifiable.'}</Text><Text style={styles.nextText}>{kind === 'image' ? 'Une image créée de toutes pièces est une scène fictive. Pour améliorer une photo réelle, utilisez Nouvelle retouche.' : 'Le moteur vidéo et l’estimation du coût seront connectés ici. Une visite longue peut nécessiter plusieurs plans et un montage.'}</Text><Text style={styles.nextText}>Pour le moment, cet aperçu prépare une description. Aucune image ni vidéo n’est générée.</Text></View>
      <Text accessibilityLiveRegion="polite" style={notice ? styles.warning : styles.storage}>{notice || (saved ? 'Brouillon enregistré sur cet appareil.' : 'Enregistrement du brouillon…')}</Text>
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  back: { fontSize: 13, color: '#748164', paddingVertical: 6 }, panel: { backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e0e5d8', borderRadius: 17, padding: 18, gap: 13 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, number: { width: 27, height: 27, lineHeight: 27, borderRadius: 14, textAlign: 'center', backgroundColor: '#343d2f', color: '#fffefa', fontSize: 12, overflow: 'hidden' }, section: { flex: 1, fontSize: 18, lineHeight: 25, fontWeight: '500', color: '#394331', letterSpacing: -.3 }, label: { fontSize: 13, color: '#728163', lineHeight: 20 }, input: { minHeight: 145, padding: 14, borderWidth: 1, borderColor: '#d1d9c6', borderRadius: 11, color: '#3e4935', fontSize: 16, lineHeight: 23, textAlignVertical: 'top', backgroundColor: '#fffefa' }, small: { fontSize: 12, color: '#828b77', lineHeight: 19 }, examples: { gap: 8, marginTop: 3 }, example: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e0e4f4', backgroundColor: '#f0f2fc' }, exampleSage: { backgroundColor: '#f0f4e8', borderColor: '#e2e8d7' }, exampleSand: { backgroundColor: '#f6f1e5', borderColor: '#ebe3d4' }, exampleLabel: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500', color: '#6b7590' }, exampleArrow: { fontSize: 18, color: '#929daf' }, search: { minHeight: 48, fontSize: 15, color: '#49543f', paddingHorizontal: 13, borderWidth: 1, borderColor: '#d4deca', borderRadius: 10 }, count: { fontSize: 11, color: '#809265', lineHeight: 18 }, photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: '#e4e8dc', backgroundColor: '#fffefa' }, selected: { backgroundColor: '#eff5e7', borderColor: '#a4b789' }, photo: { width: 54, height: 57, borderRadius: 7, resizeMode: 'cover' }, photoMissing: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8ebdf' }, photoTitle: { fontSize: 13, lineHeight: 19, fontWeight: '500', color: '#526047' }, selectionMark: { fontSize: 14, color: '#809468' }, emptyPhotos: { gap: 13, backgroundColor: '#f3f5ed', padding: 14, borderRadius: 11 }, readyLabel: { fontSize: 10, fontWeight: '600', color: '#7a9563', letterSpacing: 1.1 }, warning: { fontSize: 12, lineHeight: 20, color: '#86724e', backgroundColor: '#f6eedf', padding: 13, borderRadius: 10 }, disclosure: { paddingVertical: 9 }, disclosureText: { fontSize: 13, lineHeight: 21, color: '#6f8260', fontWeight: '500' }, next: { padding: 20, backgroundColor: '#edf1fa', borderWidth: 1, borderColor: '#dfe5f4', borderRadius: 16, gap: 10 }, nextTitle: { color: '#64749a', fontSize: 16, fontWeight: '500', lineHeight: 23 }, nextText: { color: '#8590a8', fontSize: 12, lineHeight: 21 }, storage: { color: '#8c967f', fontSize: 11, lineHeight: 18, textAlign: 'center' },
});

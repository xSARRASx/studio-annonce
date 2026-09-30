import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PHOTO_EXAMPLES, exampleStages, type ExampleStage, type PhotoExample } from '../../../shared/photo-examples';
import { exampleImages } from '../lib/example-images';
import { AccountScreenFrame } from './ConnectedStudio';
import { BeforeAfterPhoto } from './BeforeAfterPhoto';
function Example({ example }: { example: PhotoExample }) {
  const [stage, setStage] = useState<ExampleStage['key']>('apres');
  const [angle, setAngle] = useState(false);
  const stages = exampleStages(example);
  const source = exampleImages[`${example.file}-${angle ? 'angle' : stage}`];
  return <View style={s.example}>
    <Text style={s.kicker}>{example.category.toLocaleUpperCase('fr')}</Text><Text style={s.title}>{example.title}</Text><Text style={s.body}>{example.detail}</Text>
    {angle ? <View style={[s.photo, { aspectRatio: 1.5 }]}><Image source={source} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel={example.altAfter}/><Text style={s.photoLabel}>Autre point de vue</Text></View> : <BeforeAfterPhoto before={exampleImages[`${example.file}-avant`]} after={source} aspectRatio={example.ratio} label={`Comparer avant et après : ${example.title}`}/>}
    <Text style={s.small}>Faites glisser la séparation pour voir l’avant et l’après.</Text>
    {example.correction && <View style={s.versions}>{stages.filter(item => item.key !== 'avant').map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: !angle && stage === item.key }} onPress={() => { setStage(item.key); setAngle(false); }} style={[s.version, !angle && stage === item.key && s.active]}><Text style={[s.versionText, !angle && stage === item.key && s.activeText]}>{item.label}</Text></Pressable>)}</View>}
    {example.angle && <Pressable accessibilityRole="button" accessibilityState={{ selected: angle }} onPress={() => setAngle(value => !value)} style={s.angle}><Text style={s.link}>{angle ? 'Revenir au cadrage initial' : 'Voir le même aménagement sous un autre angle →'}</Text></Pressable>}
    <Text style={s.preserved}>✓ Repères conservés : {example.preserved.toLocaleLowerCase('fr')}.</Text>
    <View style={s.request}><Text style={s.kicker}>LA PREMIÈRE DEMANDE</Text><Text style={s.requestText}>{example.prompt}</Text><Text style={s.small}>Le coup de pouce réunit les réponses ici. Rien à recopier dans un autre formulaire.</Text></View>
    {example.correction && stage !== 'avant' && <View style={[s.request, s.correction]}><Text style={s.kicker}>UNE CORRECTION, ENSUITE</Text><Text style={s.requestText}>{example.correction}</Text><Text style={s.small}>Une demande précise pour ajuster la proposition.</Text></View>}

    <Text style={s.small}>{example.virtual ? 'Projection de décoration ou de rénovation. ' : ''}Photo réelle : {example.sourceTitle}, {example.location}. Proposition préparée pour cet exemple. Aucune génération ni utilisation de crédit.</Text>
  </View>;
}
export function ExamplesScreen() {
  const [selected, setSelected] = useState(PHOTO_EXAMPLES[0]);
  const [linkError, setLinkError] = useState(false);
  return <AccountScreenFrame title="8 photos, plein d’idées." subtitle="Quatre logements, des avant/après et les demandes qui les accompagnent.">
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choices} accessibilityLabel="Choisir un exemple">{PHOTO_EXAMPLES.map((example, index) => <Pressable key={example.id} accessibilityRole="button" accessibilityLabel={example.title} accessibilityState={{ selected: selected.id === example.id }} onPress={() => setSelected(example)} style={[s.choice, selected.id === example.id && s.active]}><Text style={[s.choiceText, selected.id === example.id && s.activeText]}>{index + 1}. {example.room}</Text></Pressable>)}</ScrollView>
    <Example key={selected.id} example={selected}/>
    <Pressable accessibilityRole="link" onPress={() => { setLinkError(false); void Linking.openURL('https://studioannonce.fr/blog/').catch(() => setLinkError(true)); }} style={s.request}><Text style={s.kicker}>LE BLOG DU STUDIO</Text><Text style={s.requestText}>Des conseils pour vos photos et vos annonces →</Text></Pressable>
    {linkError && <Text style={s.small}>Le navigateur ne s’est pas ouvert. Retrouvez le blog sur studioannonce.fr/blog/.</Text>}
  </AccountScreenFrame>;
}
const s = StyleSheet.create({
  choices: { gap: 8, paddingBottom: 8 }, choice: { backgroundColor: '#f0f2e9', borderRadius: 22, paddingVertical: 12, paddingHorizontal: 15 }, choiceText: { color: '#566449', fontSize: 13 }, active: { backgroundColor: '#3d4d32' }, activeText: { color: '#fffefa' },
  example: { gap: 15 }, kicker: { color: '#7a856b', fontSize: 10, fontWeight: '600', letterSpacing: 1 }, title: { color: '#30372a', fontSize: 29, fontWeight: '600', lineHeight: 34, letterSpacing: -.8 }, body: { color: '#737d68', fontSize: 14, lineHeight: 22 },
  photo: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#eceee5' }, photoLabel: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#fffef5ed', color: '#48543c', paddingVertical: 6, paddingHorizontal: 11, fontSize: 11, borderRadius: 5, overflow: 'hidden' },
  versions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, version: { flexGrow: 1, borderRadius: 12, backgroundColor: '#ecf0e4', paddingVertical: 13, paddingHorizontal: 12, alignItems: 'center' }, versionText: { fontSize: 12, color: '#5f6d4e' },
  request: { backgroundColor: '#f0f4e8', padding: 20, gap: 12, borderRadius: 15, borderWidth: 1, borderColor: '#dce4d1' }, requestText: { color: '#475b35', fontSize: 15, lineHeight: 24 }, small: { color: '#7b8471', fontSize: 11, lineHeight: 18 }, correction: { backgroundColor: '#f9f0e6', borderColor: '#ebddcb' },
  preserved: { color: '#768565', fontSize: 12, lineHeight: 19 }, angle: { paddingVertical: 8 }, link: { color: '#596e43', fontSize: 12, lineHeight: 19 },
});

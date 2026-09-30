import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AccountScreenFrame } from './ConnectedStudio';

type CreationKind = 'retouch' | 'image' | 'video' | 'frames';

const choices = [
  { kind: 'retouch', title: 'Retoucher une photo', from: 'Photo', to: 'Photo', description: 'Lumière, rangement, décoration… améliorez votre photo.', route: '/nouvelle', background: '#eef3e7', border: '#d9e3cd', ink: '#536742' },
  { kind: 'image', title: 'Créer une image', from: 'Idée', to: 'Image', description: 'Imaginez une scène de toutes pièces, sans fichier.', route: '/creer-image', background: '#f1edfa', border: '#e0d8f0', ink: '#7a6099' },
  { kind: 'video', title: 'Photos → vidéo', from: 'Photos ou idée', to: 'Vidéo', description: 'Préparez une visite avec le mouvement et le rythme de votre choix.', route: '/visite', background: '#fbf0e4', border: '#efdac1', ink: '#9a6d3f' },
  { kind: 'frames', title: 'Vidéo → photos', from: 'Vidéo', to: 'Photos', description: 'Retrouvez les meilleurs instants de votre vidéo en photos.', route: '/video-photos', background: '#eaf0fa', border: '#d5e0f0', ink: '#55759d' },
] as const;

function CreationIcon({ kind, color }: { kind: CreationKind; color: string }) {
  return <Svg width={30} height={30} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'retouch' ? <><Path d="M6 25 23 8l3 3L9 28Z M18 13l3 3 M9 4v6 M6 7h6 M25 20v7 M21.5 23.5h7"/></> : kind === 'image' ? <><Rect x={4} y={5} width={24} height={22} rx={4}/><Circle cx={11} cy={12} r={2}/><Path d="m5 23 7-7 5 4 4-5 6 7"/></> : kind === 'video' ? <><Rect x={3} y={7} width={19} height={19} rx={4}/><Path d="m22 13 7-4v15l-7-4 M10 12l6 4.5-6 4.5Z"/></> : <><Rect x={10} y={10} width={18} height={17} rx={3}/><Path d="M22 6H7a3 3 0 0 0-3 3v13 M12 23l5-5 4 3 3-3 3 4"/><Circle cx={16} cy={15} r={1}/></>}
  </Svg>;
}

export function CreationHubScreen() {
  return <AccountScreenFrame title="Que voulez-vous créer ?" subtitle="Choisissez votre point de départ. On vous guide pour la suite.">
    <View style={styles.choices}>
      {choices.map(choice => <Pressable key={choice.kind} accessibilityRole="button" accessibilityLabel={choice.title} accessibilityHint={choice.description} onPress={() => router.navigate({ pathname: choice.route, params: choice.kind === 'retouch' ? { logement: undefined, retour: undefined } : undefined })} style={({ pressed }) => [styles.card, { backgroundColor: choice.background, borderColor: choice.border, opacity: pressed ? .74 : 1 }]}>
        <View style={styles.cardTop}><View style={styles.icon}><CreationIcon kind={choice.kind} color={choice.ink}/></View><Text style={styles.title}>{choice.title}</Text><Text style={[styles.open, { color: choice.ink }]}>↗</Text></View>
        <Text style={styles.description}>{choice.description}</Text>
        <View style={styles.flow}><Text style={[styles.pill, { color: choice.ink }]}>{choice.from}</Text><Text style={[styles.flowArrow, { color: choice.ink }]}>→</Text><Text style={[styles.pill, styles.resultPill, { color: choice.ink, borderColor: choice.border }]}>{choice.to}</Text></View>
      </Pressable>)}
    </View>
    <View style={styles.note}><Text style={styles.noteTitle}>Vous gardez la main.</Text><Text style={styles.noteBody}>La retouche photo utilise votre compte et les mêmes crédits que le site. Une génération et une correction sont incluses ; chaque correction supplémentaire coûte un crédit.</Text><Text style={styles.preview}>La création d’images et de vidéos permet pour le moment de préparer un brouillon local. La génération vidéo n’est pas encore ouverte. L’extraction vidéo → photos fonctionne sur cet appareil.</Text></View>
  </AccountScreenFrame>;
}

const styles = StyleSheet.create({
  choices: { gap: 13 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 9 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 3 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#ffffffaa', justifyContent: 'center', alignItems: 'center' },
  open: { fontSize: 26 },
  title: { flex: 1, color: '#30372a', fontSize: 20, fontWeight: '600', lineHeight: 26, letterSpacing: -.4 },
  description: { color: '#606759', fontSize: 14, lineHeight: 21 },
  flow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 5 },
  pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 9, overflow: 'hidden', backgroundColor: '#ffffff99', fontSize: 11, fontWeight: '500', lineHeight: 17 },
  resultPill: { backgroundColor: '#ffffff', borderWidth: 1 },
  flowArrow: { fontSize: 16 },
  note: { paddingHorizontal: 4, paddingTop: 5, gap: 7 },
  noteTitle: { color: '#48543d', fontWeight: '600', fontSize: 14 },
  noteBody: { color: '#69725f', fontSize: 13, lineHeight: 20 },
  preview: { color: '#737b6b', fontSize: 11, lineHeight: 18, marginTop: 4 },
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function OptionalPropertyPicker({ value, properties, onChange }: { value: string; properties: string[]; onChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const assigned = value.trim() && value.trim() !== 'Sans logement' ? value : '';
  const options = [...new Set(properties)].filter(property => property !== 'Sans logement');
  return <View style={styles.panel}>
    <Pressable accessibilityRole="button" accessibilityLabel="Ranger dans un logement · facultatif" accessibilityState={{ expanded }} onPress={() => setExpanded(current => !current)} style={styles.toggle}>
      <View style={{ flex: 1, gap: 4 }}><Text style={styles.title}>Ranger dans un logement</Text><Text style={styles.summary}>{assigned ? `${assigned} · Modifier` : 'Facultatif · Sans logement pour le moment'}</Text></View><Text style={styles.arrow}>{expanded ? '−' : '+'}</Text>
    </Pressable>
    {expanded && <View style={styles.fields}>
      <View style={styles.choices}><Pressable accessibilityRole="radio" accessibilityState={{ checked: !assigned }} onPress={() => onChange('')} style={[styles.chip, !assigned && styles.active]}><Text style={[styles.chipText, !assigned && styles.activeText]}>Sans logement</Text></Pressable>{options.map(property => <Pressable key={property} accessibilityRole="radio" accessibilityState={{ checked: assigned === property }} onPress={() => onChange(property)} style={[styles.chip, assigned === property && styles.active]}><Text style={[styles.chipText, assigned === property && styles.activeText]}>{property}</Text></Pressable>)}</View>
      <TextInput accessibilityLabel="Nom du logement · facultatif" value={assigned} onChangeText={onChange} placeholder="Ou nommez un logement…" placeholderTextColor="#7e8775" maxLength={100} style={styles.field}/>
      <Text style={styles.hint}>Vous pouvez laisser ce champ vide et continuer.</Text>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderColor: '#e0e4d7', borderRadius: 15, backgroundColor: '#fffefa' },
  toggle: { minHeight: 72, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 14, fontWeight: '500', color: '#48513e', lineHeight: 20 },
  summary: { fontSize: 12, lineHeight: 18, color: '#7b8372' },
  arrow: { fontSize: 24, color: '#69725f' },
  fields: { paddingHorizontal: 17, paddingBottom: 17, gap: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, minHeight: 40, borderWidth: 1, borderColor: '#d8decf', borderRadius: 21, justifyContent: 'center' },
  active: { backgroundColor: '#30372a', borderColor: '#30372a' },
  chipText: { fontSize: 12, color: '#69725f' },
  activeText: { color: '#fffefa' },
  field: { minHeight: 48, borderWidth: 1, borderColor: '#cbd3be', borderRadius: 10, padding: 13, color: '#30372a', fontSize: 15 },
  hint: { fontSize: 11, lineHeight: 17, color: '#7b8372' },
});

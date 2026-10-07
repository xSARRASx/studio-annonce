import { useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';

export function TrackingExports() {
  const { api } = useAccount();
  const [month, setMonth] = useState(() => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 1); return date.toISOString().slice(0, 7); });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  async function download(kind: 'ventes_avec_gclid' | 'remboursements') {
    if (lock.current || !/^\d{4}-\d{2}$/.test(month)) { setMessage('Choisissez un mois au format AAAA-MM.'); return; }
    lock.current = true; setBusy(true); setMessage('');
    try {
      const result = await api.json<{ nom: string; contenu: string }>(`/admin/exports/${kind === 'ventes_avec_gclid' ? 'ventes' : kind}?mois=${encodeURIComponent(month)}`);
      const filename = `${kind}-${month}.csv`;
      if (result.nom !== filename || typeof result.contenu !== 'string' || !result.contenu.trim()) throw new Error('Le fichier n’a pas été reçu complètement. Réessayez.');
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([result.contenu], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = filename;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        if (!await Sharing.isAvailableAsync()) throw new Error('Le partage est indisponible. Retrouvez cet export sur le site.');
        const file = new File(Paths.cache, filename); file.write(result.contenu);
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Exporter le suivi publicitaire' });
      }
      setMessage('Export prêt à transmettre à votre agence.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'L’export est indisponible.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View style={{ gap: 12 }}><Text style={{ color: colors.ink, fontWeight: '600', fontSize: 17 }}>Exports publicitaires</Text><Text style={{ color: colors.muted, lineHeight: 20 }}>Ventes payées avec un clic consenti et remboursements Stripe. Montants en chiffre d’affaires TTC.</Text><TextInput accessibilityLabel="Mois à exporter, AAAA-MM" value={month} onChangeText={setMonth} placeholder="AAAA-MM" maxLength={7} style={{ padding: 12, borderWidth: 1, borderColor: '#bfc9b2', borderRadius: 10, color: colors.ink }}/><Button secondary title="Télécharger les ventes CSV" disabled={busy} onPress={() => void download('ventes_avec_gclid')}/><Button secondary title="Télécharger les remboursements CSV" disabled={busy} onPress={() => void download('remboursements')}/>{!!message && <Text accessibilityRole="alert" style={{ color: colors.ink }}>{message}</Text>}</View>;
}

import React, { useRef, useState } from 'react';
import { Linking, Text } from 'react-native';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';

export function PurchaseDocument({ id, status }: { id: string; status: string }) {
  const { api } = useAccount();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  if (!['paye', 'rembourse', 'conteste'].includes(status)) return null;
  async function open() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setNotice('');
    try {
      const result = await api.json<{ documents: { url: string }[]; message: string }>(`/compte/achats/${id}/documents`);
      const document = result.documents[0];
      if (document) await Linking.openURL(document.url);
      else setNotice(result.message);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Le justificatif ne peut pas être ouvert. Réessayez.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <><Button secondary title={busy ? 'Ouverture du justificatif…' : 'Reçu / facture'} onPress={() => void open()} disabled={busy}/>{!!notice && <Text accessibilityRole="alert" style={{ color: colors.muted }}>{notice}</Text>}</>;
}

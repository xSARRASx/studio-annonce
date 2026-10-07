"use client";
import { useRef, useState } from 'react';
import { exportPublicitaire } from '@/lib/api';

export default function AdminTrackingExports() {
  const [month, setMonth] = useState(() => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 1); return date.toISOString().slice(0, 7); });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  async function download(kind: 'ventes_avec_gclid' | 'remboursements') {
    if (lock.current) return;
    lock.current = true; setBusy(kind); setMessage('');
    try {
      const file = await exportPublicitaire(kind, month); const url = URL.createObjectURL(file);
      const link = document.createElement('a'); link.href = url; link.download = `${kind}-${month}.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMessage('Export prêt. Retrouvez le fichier dans vos téléchargements.');
    } catch (e) { setMessage((e as Error).message); }
    finally { lock.current = false; setBusy(''); }
  }
  return <details className="admin-costs"><summary>Exports pour le suivi publicitaire</summary><p className="admin-commerce-note">Ventes réellement payées et liées à un clic accepté, puis ajustements des remboursements Stripe. Les montants représentent le chiffre d’affaires TTC, sans frais estimés.</p><label>Mois à exporter <input type="month" value={month} max={new Date().toISOString().slice(0, 7)} onChange={e => setMonth(e.target.value)}/></label><div className="admin-modal-actions"><button type="button" className="button outlined" disabled={!!busy || !month} onClick={() => void download('ventes_avec_gclid')}>{busy === 'ventes_avec_gclid' ? 'Préparation…' : 'Télécharger les ventes CSV'}</button><button type="button" className="button outlined" disabled={!!busy || !month} onClick={() => void download('remboursements')}>{busy === 'remboursements' ? 'Rapprochement Stripe…' : 'Télécharger les remboursements CSV'}</button></div>{message && <p role="status" className="admin-commerce-note">{message}</p>}</details>;
}

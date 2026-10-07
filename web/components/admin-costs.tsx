"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Frais } from "@/lib/admin";

const euros = (v: number) => (v / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
export default function AdminCosts({ frais, comptes, onChange }: { frais: Frais; comptes: { id: string; nom: string; email: string }[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("Higgsfield");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState("video");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    const cents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0) { setMessage("Indiquez un montant en euros supérieur à zéro."); return; }
    lock.current = true; setBusy(true); setMessage("");
    try {
      await api("/admin/frais", { method: "POST", body: JSON.stringify({ fournisseur: provider, reference: reference.trim(), nature: kind, montant_centimes: cents, date, compte_id: account || null }) });
      setReference(""); setAmount(""); setOpen(false); setMessage("Frais enregistrés. Le tableau est actualisé."); onChange();
    } catch (e) { setMessage((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function cancel(id: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try { await api(`/admin/frais/${encodeURIComponent(id)}/annuler`, { method: "POST" }); setConfirmation(""); setMessage("Saisie annulée et conservée dans l’historique."); onChange(); }
    catch (e) { setMessage((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="admin-costs" aria-label="Frais réels et marge provisoire">
    <div className="admin-commerce-metrics"><div><span>Frais réels saisis · EUR</span><strong>{frais?.montant_centimes != null ? euros(frais.montant_centimes) : "À renseigner"}</strong></div><div><span>Marge provisoire après frais saisis</span><strong>{frais?.marge_provisoire_centimes != null ? euros(frais.marge_provisoire_centimes) : "À rapprocher"}</strong></div></div>
    <p className="admin-commerce-note">Relevez le montant réellement facturé en euros sur un justificatif fournisseur ou bancaire. Associez-le à un compte lorsque vous connaissez son coût. La marge reste partielle tant que tous les frais ne sont pas saisis.</p>
    <button type="button" className="button outlined" disabled={busy} aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? "Fermer la saisie" : "Ajouter des frais réels"}</button>
    {!!message && <p role="status" className="admin-commerce-note">{message}</p>}
    {open && <form onSubmit={e => { e.preventDefault(); void save(); }}><div className="admin-form-grid">
      <label>Fournisseur<select value={provider} onChange={e => setProvider(e.target.value)}>{["OpenAI", "Higgsfield", "Stripe", "Stockage", "Autre"].map(p => <option key={p}>{p}</option>)}</select></label>
      <label>Montant réellement payé (€)<input required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex. : 1,96"/></label>
      <label>Référence du justificatif<input required maxLength={160} value={reference} onChange={e => setReference(e.target.value)} placeholder="Facture ou référence de l’opération"/></label>
      <label>Date du frais<input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)}/></label>
      <label>Produit<select value={kind} onChange={e => setKind(e.target.value)}><option value="video">Vidéo</option><option value="photo">Photo</option><option value="autre">Autres frais</option></select></label>
      <label>Compte concerné<select value={account} onChange={e => setAccount(e.target.value)}><option value="">Frais du studio, sans compte précis</option>{comptes.map(c => <option key={c.id} value={c.id}>{c.nom || c.email}</option>)}</select></label>
    </div><div className="admin-modal-actions"><button type="submit" className="button dark" disabled={busy || !reference.trim() || !amount}>{busy ? "Enregistrement…" : "Enregistrer ces frais"}</button></div></form>}
    {!!frais?.lignes.length && <details><summary>Justificatifs rapprochés · {frais.nombre} frais actifs</summary><div className="admin-commerce-table"><table><thead><tr><th>Date</th><th>Fournisseur</th><th>Référence</th><th>Compte</th><th>Montant</th><th>Saisie</th></tr></thead><tbody>{frais.lignes.map(f => <tr key={f.id}><td>{f.date}</td><td>{f.fournisseur}</td><td>{f.reference}</td><td>{f.compte}</td><td>{euros(f.montant_centimes)}</td><td>{f.annule ? "Annulée" : confirmation === f.id ? <div className="admin-cost-confirm"><span>Retirer du calcul ?</span><button disabled={busy} onClick={() => void cancel(f.id)}>Confirmer</button><button disabled={busy} onClick={() => setConfirmation("")}>Garder</button></div> : <button disabled={busy} className="button outlined" onClick={() => setConfirmation(f.id)}>Annuler la saisie</button>}</td></tr>)}</tbody></table></div></details>}
  </section>;
}

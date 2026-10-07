"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Wallet, X } from "lucide-react";

export function CreditDialog({ open, onClose, paiementDisponible, nature = "photo" }: {
  open: boolean; onClose: () => void; paiementDisponible: boolean; nature?: "photo" | "video";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
    return () => { if (element?.open) element.close(); };
  }, [open]);
  return <dialog ref={ref} onCancel={event => { event.preventDefault(); onClose(); }}
    aria-labelledby="credit-dialog-title" className="credit-dialog">
    <button type="button" className="credit-dialog-close" onClick={onClose} aria-label="Fermer"><X size={18}/></button>
    <span className="credit-dialog-icon"><Wallet size={23}/></span>
    <h2 id="credit-dialog-title">Ajouter des crédits {nature}</h2>
    <p>Votre solde {nature} est à zéro. Consultez les packs pour poursuivre vos créations. Votre demande en cours reste enregistrée.</p>
    {!paiementDisponible && <p className="credit-dialog-note">Le paiement est momentanément indisponible. Vous pouvez consulter les packs ; votre préparation reste enregistrée.</p>}
    <div className="credit-dialog-actions"><button type="button" onClick={onClose}>Plus tard</button>
      <Link href="/app/credits/" onClick={onClose}>Voir les packs de crédits <ArrowRight size={16}/></Link></div>
  </dialog>;
}

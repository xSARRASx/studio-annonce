"use client";
import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { api, type Achat } from "@/lib/api";

export default function PurchaseDocument({ achat }: { achat: Achat }) {
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");
  const verrou = useRef(false);
  if (!["paye", "rembourse", "conteste"].includes(achat.statut)) return null;
  async function ouvrir() {
    if (verrou.current) return;
    verrou.current = true; setChargement(true); setMessage("");
    try {
      const resultat = await api<{ documents: { url: string }[]; message: string }>(`/compte/achats/${achat.id}/documents`);
      const document = resultat.documents[0];
      if (document) window.location.assign(document.url);
      else setMessage(resultat.message);
    } catch (e) { setMessage((e as Error).message); }
    finally { verrou.current = false; setChargement(false); }
  }
  return <div className="st-purchase-document"><button type="button" className="text-action" onClick={() => void ouvrir()} disabled={chargement}>
    <FileText size={16}/>{chargement ? "Ouverture du justificatif…" : "Reçu / facture"}
  </button>{message && <small role="status">{message}</small>}</div>;
}

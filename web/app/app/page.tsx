"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Home, ChevronRight } from "lucide-react";
import { api, type Logement } from "@/lib/api";
import { Bouton, Carte, Champ, Message, Pastille } from "@/components/ui";

export default function MesLogements() {
  const [logements, setLogements] = useState<Logement[] | null>(null);
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [type, setType] = useState("location");
  const [erreur, setErreur] = useState("");
  const [creation, setCreation] = useState(false);

  useEffect(() => { api<Logement[]>("/logements").then(setLogements).catch((e) => setErreur(e.message)); }, []);

  async function creer() {
    setCreation(true); setErreur("");
    try {
      const l = await api<Logement>("/logements", { method: "POST", body: JSON.stringify({ nom: nom || "Mon logement", ville, type_annonce: type }) });
      setLogements([...(logements || []), l]); setNom(""); setVille("");
    } catch (e) { setErreur((e as Error).message); } finally { setCreation(false); }
  }

  return (
    <div className="apparait space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Mes logements</h1>
        <p className="text-fg-muted mt-1">Un logement, ses photos, ses retouches. Commencez par en créer un.</p>
      </div>
      <Carte className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
        <label className="text-sm text-fg-muted">Nom<Champ className="mt-1" placeholder="Appartement rue des Lilas" value={nom} onChange={(e) => setNom(e.target.value)} /></label>
        <label className="text-sm text-fg-muted">Ville<Champ className="mt-1" placeholder="Lyon" value={ville} onChange={(e) => setVille(e.target.value)} /></label>
        <label className="text-sm text-fg-muted">Annonce
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 h-12 rounded-2xl bg-surface-2 border border-line px-4 text-fg outline-none focus:border-accent block">
            <option value="location">Location</option><option value="vacances">Vacances</option><option value="vente">Vente</option>
          </select>
        </label>
        <Bouton onClick={creer} chargement={creation}><Plus className="size-4" /> Créer</Bouton>
        <div className="sm:col-span-4"><Message texte={erreur} /></div>
      </Carte>
      {logements === null ? <p className="text-fg-muted">Chargement…</p> : logements.length === 0 ? (
        <p className="text-fg-muted text-center py-12">Aucun logement pour l&apos;instant.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logements.map((l) => (
            <li key={l.id}>
              <Link href={`/app/logement/${l.id}`} className="block rounded-3xl bg-surface border border-line hover:border-line-strong transition overflow-hidden group">
                <div className="aspect-[4/3] bg-surface-2 grid grid-cols-3 gap-0.5 overflow-hidden">
                  {l.photos.slice(0, 3).map((p) => <img key={p.id} src={p.vignette} alt="" className="w-full h-full object-cover" />)}
                  {l.photos.length === 0 && <div className="col-span-3 grid place-items-center text-fg-muted"><Home className="size-8" /></div>}
                </div>
                <div className="p-4 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.nom}</p>
                    <p className="text-sm text-fg-muted truncate">{l.ville || "Ville non précisée"} · {l.photos.length} photo{l.photos.length > 1 ? "s" : ""}</p>
                  </div>
                  <Pastille ton="neutre">{l.type_annonce}</Pastille>
                  <ChevronRight className="size-4 ml-auto text-fg-muted group-hover:text-fg" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

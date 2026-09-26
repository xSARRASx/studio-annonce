"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { changeLibrary, initialLibrary, readLibrary, storageError, type DemoLibrary, type DemoProject, type DemoVersion } from "./library";

type Preview = { file: Blob; url: string };

export function useLibrary() {
  const [library, setLibrary] = useState<DemoLibrary>(initialLibrary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const urls = useRef(new Map<string, Preview>());
  const revision = useRef(-1);
  const lifecycle = useRef(0);
  const reads = useRef(0);
  const active = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const adopt = useCallback((next: DemoLibrary) => {
    // Un rafraîchissement lancé avant une écriture peut se terminer après elle.
    if ((next.revision || 0) < revision.current) return;
    const nextUrls = new Map<string, Preview>();
    let previewError = false;
    for (const project of next.projects) {
      if (!project.file) continue;
      const current = urls.current.get(project.id);
      if (current?.file === project.file) nextUrls.set(project.id, current);
      else {
        try { nextUrls.set(project.id, { file: project.file, url: URL.createObjectURL(project.file) }); }
        catch { previewError = true; if (current) nextUrls.set(project.id, current); }
      }
    }
    for (const [id, preview] of urls.current) {
      if (nextUrls.get(id)?.url !== preview.url) URL.revokeObjectURL(preview.url);
    }
    urls.current = nextUrls;
    revision.current = next.revision || 0;
    setLibrary(next); setLoading(false);
    setError(previewError ? "Vos projets sont enregistrés, mais leurs aperçus n’ont pas pu être ouverts. Réessayez." : "");
  }, []);
  const refresh = useCallback(async () => {
    const life = lifecycle.current;
    const read = ++reads.current;
    try {
      const next = await readLibrary();
      if (active.current && life === lifecycle.current && read === reads.current) adopt(next);
    } catch (cause) {
      if (active.current && life === lifecycle.current && read === reads.current) { setLoading(false); setError(storageError(cause)); }
    }
  }, [adopt]);
  useEffect(() => {
    active.current = true;
    lifecycle.current += 1;
    void refresh();
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel.current = new BroadcastChannel("studio-annonce-library");
        channel.current.onmessage = () => { void refresh(); };
      }
    } catch { /* Les données restent accessibles si les notifications sont indisponibles. */ }
    const onFocus = () => { void refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active.current = false;
      lifecycle.current += 1;
      channel.current?.close(); channel.current = null;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      for (const preview of urls.current.values()) URL.revokeObjectURL(preview.url);
      urls.current.clear();
    };
  }, [refresh]);
  const update = useCallback(async (change: (state: DemoLibrary) => void) => {
    const life = lifecycle.current;
    reads.current += 1;
    const next = await changeLibrary(change);
    if (active.current && life === lifecycle.current) {
      reads.current += 1;
      adopt(next);
      // La notification arrive après le commit. Son échec n'annule pas une sauvegarde réussie.
      try { channel.current?.postMessage("updated"); } catch { /* Relecture au prochain focus. */ }
    }
    return next;
  }, [adopt]);
  const source = (project: DemoProject, version?: DemoVersion) =>
    (version || project.versions.find(item => item.id === project.selected) || project.versions[0])?.src || urls.current.get(project.id)?.url || "";
  return { library, loading, error, update, source, refresh };
}

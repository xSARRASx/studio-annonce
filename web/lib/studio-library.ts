import { api, type Logement, type Photo } from "./api";
import type { DemoProject, DemoVersion } from "@/app/demo/library";

/** Adaptation des données réelles aux écrans déjà utilisés sur le site. */
export function photoProject(photo: Photo, logement: Logement): DemoProject {
  const versions: DemoVersion[] = [{ id: "original", label: "Photo originale", src: photo.original || photo.vignette, note: "Votre photo originale." },
    ...photo.versions.map(v => ({ id: v.id, label: `Version ${v.numero}`, src: v.apercu, note: v.consigne }))];
  const last = photo.versions.at(-1);
  const created = Date.parse(photo.cree_le || logement.cree_le);
  return {
    id: photo.id, title: photo.analyse?.piece || `Photo ${photo.ordre + 1}`, property: logement.nom,
    kind: "photo", sample: false, createdAt: created, usageInitial: photo.usage_initial || "photo",
    updatedAt: last ? Date.parse(last.cree_le) : created,
    versions, selected: photo.version_gardee || last?.id || "original",
    ...(photo.version_gardee ? { saved: photo.version_gardee } : {}),
    ...(photo.reprise_jusqu_au ? { editUntil: Date.parse(photo.reprise_jusqu_au) } : {}), draft: "",
  };
}

export const projectSource = (project: DemoProject, version?: DemoVersion) =>
  (version || project.versions.find(v => v.id === project.selected) || project.versions[0]).src || "";

/** La liste s'affiche dès la réponse des logements ; les détails arrivent ensuite. */
export function summaryProjects(logements: Logement[]): DemoProject[] {
  return logements.flatMap(logement => logement.photos.map((photo, index) => {
    const created = Date.parse(photo.cree_le || logement.cree_le);
    const versions: DemoVersion[] = [{ id: "original", label: "Photo originale", src: photo.original || photo.vignette, note: "Original" },
      ...(photo.versions || []).map(version => ({ id: version.id, label: `Version ${version.numero}`, src: version.apercu, note: version.consigne }))];
    const last = photo.versions?.at(-1);
    return { id: photo.id, title: photo.titre || `Photo ${index + 1}`, property: logement.nom, kind: "photo" as const, sample: false, usageInitial: photo.usage_initial || "photo",
      createdAt: created, updatedAt: last ? Date.parse(last.cree_le) : created, versions,
      selected: photo.version_gardee || last?.id || "original", draft: "" };
  }));
}

export async function loadProjects(logements: Logement[]): Promise<DemoProject[]> {
  const entries = logements.flatMap(logement => logement.photos.map(photo => ({ logement, id: photo.id })));
  const projects: DemoProject[] = [];
  for (let i = 0; i < entries.length; i += 6) {
    projects.push(...await Promise.all(entries.slice(i, i + 6).map(async ({ logement, id }) => photoProject(await api<Photo>(`/photos/${id}`), logement))));
  }
  return projects;
}

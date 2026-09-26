// Keep the original key so existing local collections are migrated in place.
export const STORAGE_KEY = 'studio-annonce.mobile.v1';
export const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const DEMO_CREDITS = 5;
const LEGACY_DEMO_CREDITS = 3;

export type Project = {
  id: string;
  title: string;
  created: number;
  source: 'example' | 'photo';
  photoKey?: string;
  selected: number;
  saved: number | null;
  request: string;
  firstDownloadedAt: number | null;
  windowStartedAt: number | null;
  downloadCount: number;
};
export type StudioData = { schema: 2; projects: Project[]; creditsUsed: number; creditsTotal: number; freeUsed: boolean };
export const emptyStudio = (): StudioData => ({ schema: 2, projects: [], creditsUsed: 0, creditsTotal: DEMO_CREDITS, freeUsed: false });

export function readStudio(value: unknown): StudioData {
  if (value === null) return emptyStudio();
  if (!value || typeof value !== 'object') throw new Error('Invalid local studio');
  const data = value as Partial<Omit<StudioData, 'schema'>> & { schema?: number };
  if (![1, 2].includes(data.schema!) || !Array.isArray(data.projects) || !Number.isInteger(data.creditsUsed) || data.creditsUsed! < 0) throw new Error('Invalid local studio');
  for (const p of data.projects) {
    const count = p.source === 'example' ? 4 : 1;
    if (typeof p.id !== 'string' || typeof p.title !== 'string' || !Number.isFinite(p.created) || !['example', 'photo'].includes(p.source) || (p.source === 'photo' && typeof p.photoKey !== 'string') || !Number.isInteger(p.selected) || p.selected < 0 || p.selected >= count || (p.saved !== null && (!Number.isInteger(p.saved) || p.saved < 0 || p.saved >= count)) || typeof p.request !== 'string' || ![p.firstDownloadedAt, p.windowStartedAt].every(t => t === null || (typeof t === 'number' && Number.isFinite(t))) || !Number.isInteger(p.downloadCount) || p.downloadCount < 0) throw new Error('Invalid project');
  }
  if (new Set(data.projects.map(p => p.id)).size !== data.projects.length) throw new Error('Duplicate project');
  if (data.schema === 1) {
    // Preserve the old balance exactly; never grant/reset credits on migration.
    // A collection with an existing first download has already used its first-photo opportunity.
    return { schema: 2, projects: data.projects, creditsUsed: data.creditsUsed!, creditsTotal: LEGACY_DEMO_CREDITS, freeUsed: data.projects.some(p => p.firstDownloadedAt !== null) };
  }
  if (!Number.isInteger(data.creditsTotal) || data.creditsTotal! < 0 || typeof data.freeUsed !== 'boolean') throw new Error('Invalid local credits');
  return data as StudioData;
}

export function downloadState(project: Project, now: number) {
  const deadline = project.windowStartedAt === null ? null : project.windowStartedAt + EDIT_WINDOW_MS;
  return { deadline, expired: deadline !== null && now >= deadline, remaining: deadline === null ? 7 : Math.min(7, Math.max(0, Math.ceil((deadline - now) / 86400000))) };
}

export function simulateDownload(data: StudioData, id: string, now: number): { data: StudioData; charged: boolean; offered: boolean; deadline: number | null; original: boolean } | null {
  const p = data.projects.find(project => project.id === id);
  if (!p) return null;
  // An unedited original is already the user's image: no offer, credit or edit window.
  if (p.selected === 0 || p.source === 'photo') {
    return { charged: false, offered: false, original: true, deadline: null, data: { ...data, projects: data.projects.map(project => project.id === id ? { ...project, downloadCount: project.downloadCount + 1 } : project) } };
  }
  const firstDownload = p.windowStartedAt === null;
  const offered = firstDownload && !data.freeUsed;
  const charged = firstDownload && !offered;
  if (charged && data.creditsUsed >= data.creditsTotal) return null;
  const windowStartedAt = firstDownload ? now : p.windowStartedAt!;
  return {
    charged,
    offered,
    original: false,
    deadline: windowStartedAt + EDIT_WINDOW_MS,
    data: { ...data, freeUsed: data.freeUsed || offered, creditsUsed: data.creditsUsed + (charged ? 1 : 0), projects: data.projects.map(project => project.id === id ? { ...project, firstDownloadedAt: project.firstDownloadedAt ?? now, windowStartedAt, downloadCount: project.downloadCount + 1 } : project) },
  };
}

export function renewEditWindow(data: StudioData, id: string, now: number): { data: StudioData; deadline: number } | null {
  const project = data.projects.find(p => p.id === id);
  if (!project || project.source === 'photo' || !downloadState(project, now).expired || data.creditsUsed >= data.creditsTotal) return null;
  return {
    deadline: now + EDIT_WINDOW_MS,
    data: { ...data, creditsUsed: data.creditsUsed + 1, projects: data.projects.map(p => p.id === id ? { ...p, windowStartedAt: now } : p) },
  };
}

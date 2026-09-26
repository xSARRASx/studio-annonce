import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_CREDITS, EDIT_WINDOW_MS, downloadState, emptyStudio, readStudio, renewEditWindow, simulateDownload } from './studio-model.ts';

const start = 1_800_000_000_000;
const project = (id) => ({ id, title: id, created: start, source: 'example', selected: 2, saved: null, request: 'Plus de lumière', firstDownloadedAt: null, windowStartedAt: null, downloadCount: 0 });
const collection = () => ({ ...emptyStudio(), projects: [project('salon'), project('chambre')] });

test('a new collection offers its first photo, preserving all five demo credits and opening seven days', () => {
  const before = collection();
  const first = simulateDownload(before, 'salon', start);
  assert.equal(before.creditsTotal, 5);
  assert.equal(first.offered, true);
  assert.equal(first.charged, false);
  assert.equal(first.data.creditsUsed, 0);
  assert.equal(first.data.freeUsed, true);
  assert.equal(first.deadline, start + EDIT_WINDOW_MS);
  assert.equal(first.data.projects[0].saved, null);
  assert.deepEqual(first.data.projects[1], before.projects[1]);
  assert.equal(before.freeUsed, false);
});

test('the offer is used once, even after storage reload; later photos consume one credit each', () => {
  const offered = simulateDownload(collection(), 'salon', start);
  const restored = readStudio(JSON.parse(JSON.stringify(offered.data)));
  const second = simulateDownload(restored, 'chambre', start + 100);
  const repeat = simulateDownload(second.data, 'chambre', start + 1000);
  assert.equal(second.offered, false);
  assert.equal(second.charged, true);
  assert.equal(second.data.creditsUsed, 1);
  assert.equal(repeat.data.creditsUsed, 1);
  assert.equal(repeat.deadline, second.deadline);
  assert.equal(repeat.data.projects[1].downloadCount, 2);
  assert.equal(simulateDownload(repeat.data, 'salon', start + 2000).offered, false);
});

test('downloading an expired offered photo remains free; only explicit renewal reopens edits', () => {
  const first = simulateDownload(collection(), 'salon', start);
  const later = start + EDIT_WINDOW_MS + 1;
  const oldDownload = simulateDownload(first.data, 'salon', later);
  assert.equal(oldDownload.charged, false);
  assert.equal(oldDownload.deadline, first.deadline);
  assert.equal(renewEditWindow(first.data, 'salon', start + 1), null);
  const renewed = renewEditWindow(oldDownload.data, 'salon', later);
  assert.equal(renewed.data.creditsUsed, 1);
  assert.equal(renewed.deadline, later + EDIT_WINDOW_MS);
  assert.equal(renewed.data.projects[0].firstDownloadedAt, start);
  assert.equal(renewed.data.projects[0].downloadCount, 2);
  assert.equal(renewed.data.freeUsed, true);
});

test('exhausted credits block paid downloads and renewals, never a repeat or an unused free offer', () => {
  const emptyBalance = { ...collection(), creditsUsed: DEMO_CREDITS };
  const first = simulateDownload(emptyBalance, 'salon', start);
  assert.equal(first.offered, true);
  assert.equal(first.data.creditsUsed, DEMO_CREDITS);
  assert.equal(simulateDownload(first.data, 'chambre', start), null);
  assert.equal(renewEditWindow(first.data, 'salon', start + EDIT_WINDOW_MS + 1), null);
  assert.equal(simulateDownload(first.data, 'salon', start + EDIT_WINDOW_MS + 1).charged, false);
});

test('legacy data keeps its exact credit balance, projects and first-download history without reset', () => {
  const existing = { ...project('salon'), firstDownloadedAt: start, windowStartedAt: start, downloadCount: 2, saved: 2 };
  const migrated = readStudio({ schema: 1, projects: [existing, project('chambre')], creditsUsed: 2 });
  assert.equal(migrated.schema, 2);
  assert.equal(migrated.creditsTotal, 3);
  assert.equal(migrated.creditsTotal - migrated.creditsUsed, 1);
  assert.equal(migrated.freeUsed, true);
  assert.deepEqual(migrated.projects[0], existing);
  assert.equal(simulateDownload(migrated, 'chambre', start + 1).data.creditsUsed, 3);
  assert.deepEqual(readStudio(JSON.parse(JSON.stringify(migrated))), migrated);
});

test('an untouched legacy collection keeps three credits and receives its unused first-photo offer', () => {
  const migrated = readStudio({ schema: 1, projects: [project('salon')], creditsUsed: 0 });
  assert.equal(migrated.creditsTotal, 3);
  assert.equal(migrated.freeUsed, false);
  const first = simulateDownload(migrated, 'salon', start);
  assert.equal(first.offered, true);
  assert.equal(first.data.creditsUsed, 0);
});

test('local data round-trips and unknown/corrupt schemas are rejected instead of overwritten', () => {
  const first = simulateDownload(collection(), 'salon', start);
  assert.deepEqual(readStudio(JSON.parse(JSON.stringify(first.data))), first.data);
  assert.throws(() => readStudio({ ...first.data, schema: 99 }));
  assert.throws(() => readStudio({ ...first.data, freeUsed: 'no' }));
  assert.throws(() => readStudio({ ...first.data, creditsTotal: -1 }));
  assert.throws(() => readStudio({ ...first.data, projects: [{ ...project('salon'), selected: 999 }] }));
  assert.throws(() => readStudio({ ...first.data, projects: [project('salon'), project('salon')] }));
});


test('the remaining-day label never exceeds seven when the screen clock is slightly stale', () => {
  const first = simulateDownload(collection(), 'salon', start);
  assert.equal(downloadState(first.data.projects[0], start - 30000).remaining, 7);
  assert.equal(downloadState(first.data.projects[0], start + EDIT_WINDOW_MS).remaining, 0);
});


test('downloading a different version never replaces an existing favourite', () => {
  const original = { ...collection(), projects: [{ ...project('salon'), selected: 2, saved: 3 }] };
  const first = simulateDownload(original, 'salon', start);
  assert.equal(first.data.projects[0].saved, 3);
  const repeat = simulateDownload(first.data, 'salon', start + 1000);
  assert.equal(repeat.data.projects[0].saved, 3);
});

test('the example original consumes no credits or offer and does not start an edit window', () => {
  const original = { ...collection(), projects: [{ ...project('salon'), selected: 0, saved: 3 }] };
  const result = simulateDownload(original, 'salon', start);
  assert.equal(result.original, true);
  assert.equal(result.charged, false);
  assert.equal(result.offered, false);
  assert.equal(result.deadline, null);
  assert.equal(result.data.creditsUsed, 0);
  assert.equal(result.data.freeUsed, false);
  assert.equal(result.data.projects[0].firstDownloadedAt, null);
  assert.equal(result.data.projects[0].windowStartedAt, null);
  assert.equal(result.data.projects[0].saved, 3);
  const edited = { ...result.data, projects: [{ ...result.data.projects[0], selected: 1 }] };
  assert.equal(simulateDownload(edited, 'salon', start + 1000).offered, true);
});

test('an imported original stays free even with exhausted credits and an already-used offer', () => {
  const original = { ...collection(), freeUsed: true, creditsUsed: DEMO_CREDITS, projects: [{ ...project('import'), source: 'photo', photoKey: 'import-key', selected: 0 }] };
  const result = simulateDownload(original, 'import', start);
  assert.equal(result.original, true);
  assert.equal(result.charged, false);
  assert.equal(result.deadline, null);
  assert.equal(result.data.creditsUsed, DEMO_CREDITS);
  assert.equal(result.data.freeUsed, true);
  assert.equal(result.data.projects[0].firstDownloadedAt, null);
  assert.equal(result.data.projects[0].windowStartedAt, null);
  assert.equal(renewEditWindow(result.data, 'import', start + EDIT_WINDOW_MS), null);
});

test('returning to the original preserves the existing edited-photo deadline and favourite', () => {
  const first = simulateDownload(collection(), 'salon', start);
  const original = { ...first.data, projects: first.data.projects.map(p => p.id === 'salon' ? { ...p, selected: 0, saved: 2 } : p) };
  const result = simulateDownload(original, 'salon', start + EDIT_WINDOW_MS + 1);
  assert.equal(result.deadline, null);
  assert.equal(result.original, true);
  assert.equal(result.data.creditsUsed, first.data.creditsUsed);
  assert.equal(result.data.freeUsed, first.data.freeUsed);
  assert.equal(result.data.projects[0].windowStartedAt, start);
  assert.equal(result.data.projects[0].firstDownloadedAt, start);
  assert.equal(result.data.projects[0].saved, 2);
});

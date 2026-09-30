import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, canRequestGeneration, createAccountApi, downloadLabel, generationLabel, needsDownloadCredit, previewIsProtected } from './account-api.ts';

test('account API uses current bearer token and server JSON, without a demo balance', async () => {
  let token = 'test-session';
  const seen = [];
  const api = createAccountApi('https://studio.test/api/', () => token, () => {}, async (url, options) => {
    seen.push({ url, auth: options.headers.get('Authorization') });
    return Response.json({ solde: 7 });
  });
  assert.deepEqual(await api.json('/compte'), { solde: 7 });
  token = null;
  await api.json('/sante');
  assert.deepEqual(seen, [{ url: 'https://studio.test/api/compte', auth: 'Bearer test-session' }, { url: 'https://studio.test/api/sante', auth: null }]);
});
test('bearer token cannot be forwarded to an arbitrary URL', async () => {
  const api = createAccountApi('https://studio.test/api', () => 'test-session', () => {}, () => assert.fail('unexpected network request'));
  for (const url of ['https://example.test/image.jpg', '//example.test/image.jpg', 'compte']) await assert.rejects(api.json(url), ApiError);
});
test('401 invalidates its session, business limits do not disconnect the account', async () => {
  const invalidated = [];
  let status = 429;
  const api = createAccountApi('https://studio.test/api', () => 'test-session', token => invalidated.push(token), async () => Response.json({ detail: 'Limite d’essais atteinte.' }, { status }));
  await assert.rejects(api.json('/photos/one/essai'), error => error.status === 429 && error.message === 'Limite d’essais atteinte.');
  assert.deepEqual(invalidated, []);
  status = 401;
  await assert.rejects(api.json('/compte'), error => error.status === 401);
  assert.deepEqual(invalidated, ['test-session']);
});
test('multipart upload preserves generated boundary and JSON requests identify their content', async () => {
  const contentTypes = [];
  const api = createAccountApi('https://studio.test/api', () => null, () => {}, async (_url, options) => { contentTypes.push(options.headers.get('Content-Type')); return Response.json({}); });
  const form = new FormData(); form.append('fichier', new Blob(['photo'], { type: 'image/jpeg' }), 'photo.jpg');
  await api.json('/photos/property', { method: 'POST', body: form });
  await api.json('/auth/code', { method: 'POST', body: JSON.stringify({ email: 'test@example.test' }) });
  assert.deepEqual(contentTypes, [null, 'application/json']);
});
test('download response stays binary and network failure never triggers an automatic retry', async () => {
  let calls = 0;
  const api = createAccountApi('https://studio.test/api', () => null, () => {}, async () => { calls++; throw new Error('offline'); });
  await assert.rejects(api.response('/photos/one/versions/two/telecharger', { method: 'POST' }), error => error.status === 0);
  assert.equal(calls, 1);
  const binary = createAccountApi('https://studio.test/api', () => null, () => {}, async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } }));
  assert.deepEqual(new Uint8Array(await (await binary.response('/photos/one/versions/two/telecharger')).arrayBuffer()), new Uint8Array([1, 2, 3]));
});
const base = { offerte: false, credite_le: null, essais: 0, reprise_necessaire: false, cycle_id: 'initial' };
test('offered and purchased photos download without a new credit even when generations are blocked', () => {
  const offered = { ...base, offerte: true, limites: { photo: { bloque: true } } };
  assert.equal(needsDownloadCredit(offered), false);
  assert.match(downloadLabel(offered), /offerte/);
  const bought = { ...base, credite_le: 'today', limites: { photo: { bloque: true } } };
  assert.equal(needsDownloadCredit(bought), false);
  assert.match(downloadLabel(bought), /sans filigrane/);
  assert.equal(needsDownloadCredit(base), true);
});
test('only unpaid generated previews get an overlay; original and free photo remain clean', () => {
  assert.equal(previewIsProtected(base, true), true);
  assert.equal(previewIsProtected(base, false), false);
  assert.equal(previewIsProtected({ ...base, offerte: true }, true), false);
  assert.equal(previewIsProtected({ ...base, credite_le: 'today' }, true), false);
  assert.equal(previewIsProtected({ ...base, filigrane: false }, true), false);
});
test('generation CTA distinguishes first result, included correction, and paid extra correction', () => {
  assert.equal(generationLabel(base), 'Créer mon aperçu');
  assert.match(generationLabel({ ...base, essais: 1 }), /incluse/);
  assert.equal(generationLabel({ ...base, essais: 2, reprise_necessaire: true }), 'Corriger · 1 crédit');
  assert.equal(generationLabel({ ...base, essais: 2, cycle_id: 'paid-cycle' }), 'Appliquer ma correction');
});
test('reaching the account cap permits an explicit paid correction, never an unpaid retry', () => {
  assert.equal(canRequestGeneration(base, true, 20), false);
  assert.equal(canRequestGeneration({ ...base, reprise_necessaire: true }, true, 1), true);
  assert.equal(canRequestGeneration({ ...base, reprise_necessaire: true }, true, 0), false);
  assert.equal(canRequestGeneration(base, false, 0), true);
});

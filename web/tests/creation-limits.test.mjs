import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
    if (url.endsWith('.tsx')) return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { CreationLimits } = await import('../components/creation-limits.tsx');
const { PreviewWatermark } = await import('../components/preview-watermark.tsx');
const limites = {
  photo: { utilisees: 30, limite: 30, restantes: 0, bloque: true },
  video: { utilisees: 2, limite: 10, restantes: 8, bloque: false },
  support_url: 'https://wa.me/33634972693', support_telephone: '06 34 97 26 93',
};
const render = props => renderToStaticMarkup(createElement(CreationLimits, props));

test('Un compteur absent reste inconnu au lieu de promettre 30 essais', () => {
  assert.equal(render({}), '');
});
test('Le blocage préserve explicitement les fichiers achetés et propose les contacts confirmés', () => {
  const html = render({ limites });
  assert.match(html, /Limite d’essais atteinte/);
  assert.match(html, /fichiers déjà achetés restent accessibles/);
  assert.match(html, /href="https:\/\/wa.me\/33634972693"/);
  assert.match(html, /href="tel:0634972693"/);
  assert.doesNotMatch(html, /mailto:|fraude|désactivé/);
});
test('Un email de support est proposé seulement lorsque le serveur le fournit', () => {
  const html = render({ limites: { ...limites, support_email: 'contact@studioannonce.fr' } });
  assert.match(html, /href="mailto:contact@studioannonce.fr"/);
});
test('Les liens de contact non sûrs sont ignorés sans bloquer l’accès à l’aide', () => {
  const html = render({ limites: { ...limites, support_url: 'javascript:alert(1)', support_telephone: 'javascript:alert(1)', support_email: 'bad\nvalue' } });
  assert.doesNotMatch(html, /javascript:|mailto:|tel:/);
  assert.match(html, /href="\/demo\/aide\/"/);
});
test('Le compteur vidéo utilise sa propre limite sans annoncer un blocage photo', () => {
  const html = render({ limites, kind: 'video' });
  assert.match(html, /8 créations vidéo restantes/);
  assert.match(html, /2 sur 10/);
  assert.doesNotMatch(html, /Limite d’essais atteinte|WhatsApp/);
});
test('Une création restante se lit au singulier', () => {
  const html = render({ limites: { ...limites, photo: { utilisees: 29, limite: 30, restantes: 1, bloque: false } } });
  assert.match(html, /1 création photo restante/);
  assert.doesNotMatch(html, /1 créations/);
});
test('Le filigrane de comparaison reste une couche visuelle limitée à la zone retouchée', () => {
  const html = renderToStaticMarkup(createElement(PreviewWatermark, { from: 44 }));
  assert.match(html, /clip-path:inset\(0 0 0 44%\)/);
  assert.match(html, /aria-hidden="true"/);
  assert.equal((html.match(/STUDIO ANNONCE/g) || []).length, 12); // Intensité intermédiaire approuvée.
  assert.doesNotMatch(html, /<img|<canvas|src=/);
});

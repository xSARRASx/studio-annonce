import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? load(path.resolve(path.dirname(file), `${name}.ts`))
    : createRequire(file)(name);
  new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
  return module.exports;
}
const { BLOG_ARTICLES, BLOG_TOPICS, publishedArticles } = load(path.join(web, 'app/blog/articles.ts'));
const { PHOTO_EXAMPLES } = load(path.join(web, '../shared/photo-examples.ts'));
const articles = new Map(BLOG_ARTICLES.map(article => [article.slug, article]));
const examples = new Set(PHOTO_EXAMPLES.map(example => example.id));

test('article addresses and metadata are unique, with valid content references', () => {
  assert.equal(articles.size, BLOG_ARTICLES.length, 'duplicate slug');
  assert.equal(new Set(BLOG_ARTICLES.map(a => a.title)).size, BLOG_ARTICLES.length, 'duplicate heading');
  assert.equal(new Set(BLOG_ARTICLES.map(a => a.description)).size, BLOG_ARTICLES.length, 'duplicate description');
  for (const article of BLOG_ARTICLES) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(['draft', 'published'].includes(article.status));
    assert.ok(BLOG_TOPICS.includes(article.topic || 'Retouche & décoration'));
    if (article.coverExample) assert.ok(examples.has(article.coverExample), article.slug);
    assert.ok(article.intro.trim() && article.description.trim());
    assert.ok(article.sections.length > 0);
    assert.equal(new Set(article.sections.map(section => section.title)).size, article.sections.length);
    for (const section of article.sections) {
      assert.ok(section.title.trim() && section.paragraphs.length > 0, article.slug);
      assert.ok(section.paragraphs.every(p => p.trim()), article.slug);
      for (const id of section.examples || []) assert.ok(examples.has(id), `${article.slug}: ${id}`);
      for (const link of section.links || []) assert.match(link.href, /^\/(?!\/)/);
    }
    for (const slug of article.related || []) {
      assert.notEqual(slug, article.slug);
      assert.equal(articles.get(slug)?.status, 'published', `${article.slug} links to unavailable ${slug}`);
    }
    for (const source of article.sources || []) assert.equal(new URL(source.href).protocol, 'https:');
  }
});

test('guides do not reuse identical body paragraphs or leak drafts through the public list', () => {
  const paragraphs = new Map();
  for (const article of BLOG_ARTICLES) {
    for (const section of article.sections) {
      for (const paragraph of section.paragraphs) {
        const normalized = paragraph.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');
        assert.ok(!paragraphs.has(normalized), `paragraph repeated in ${article.slug} and ${paragraphs.get(normalized)}`);
        paragraphs.set(normalized, article.slug);
      }
    }
  }
  assert.deepEqual(new Set(publishedArticles.map(a => a.slug)), new Set(BLOG_ARTICLES.filter(a => a.status === 'published').map(a => a.slug)));
});

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);

test('PWA shell files exist', () => {
  for (const path of ['index.html', 'app.mjs', 'styles.css', 'manifest.json', 'sw.js']) {
    assert.equal(existsSync(new URL(path, root)), true, `${path} must exist`);
  }
});

test('HTML shell has mobile metadata, product landmarks, and module entry', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(html, /width=device-width/);
  assert.match(html, /沖繩親子自駕/);
  assert.match(html, /<main id="app"/);
  assert.match(html, /<nav class="bottom-nav"/);
  assert.match(html, /src="\.\/app\.mjs" type="module"/);
});

test('manifest uses the GitHub Pages subpath-safe start URL', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.start_url, './#/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'zh-TW');
});

test('service worker rotates the cache after privacy-sensitive content changes', () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  assert.match(worker, /okinawa-road-book-v3/);
  assert.match(worker, /key !== CACHE/);
});

test('date navigation only captures date buttons, not clicks inside the day view', () => {
  const app = readFileSync(new URL('app.mjs', root), 'utf8');
  assert.match(app, /closest\('button\[data-date\]'\)/);
  assert.doesNotMatch(app, /closest\('\[data-date\]'\)/);
});

test('public shell does not contain private booking credentials', () => {
  const paths = ['index.html', 'app.mjs', 'styles.css', 'manifest.json', 'sw.js'];
  const all = paths.map((path) => readFileSync(new URL(path, root), 'utf8')).join('\n');
  assert.doesNotMatch(all, /(?:password|credential|checkinUrl|accessCode|doorCode|accessPin)\s*[:=]/i);
});

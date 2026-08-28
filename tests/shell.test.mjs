import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);

test('PWA shell files exist', () => {
  for (const path of ['index.html', 'app.mjs', 'styles.css', 'manifest.json', 'sw.js', 'icons/dog-paw-stamp.svg']) {
    assert.equal(existsSync(new URL(path, root)), true, `${path} must exist`);
  }
});

test('HTML shell has mobile metadata, product landmarks, and module entry', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(html, /width=device-width/);
  assert.match(html, /沖繩親子自駕/);
  assert.match(html, /<main id="app"/);
  assert.match(html, /<nav class="bottom-nav"/);
  assert.match(html, /src="\.\/app\.mjs\?v=([^"]+)" type="module"/);
});

test('browser shell resources and dog-paw asset share release v7', () => {
  const files = ['index.html', 'app.mjs', 'src/render.mjs', 'manifest.json', 'sw.js'];
  const text = files.map((path) => readFileSync(new URL(path, root), 'utf8')).join('\n');
  const revisions = [...text.matchAll(/(?:index\.html|styles\.css|app\.mjs|manifest\.json|icon\.svg|dog-paw-stamp\.svg|trip\.json|trip-domain\.mjs|render\.mjs|storage\.mjs|pwa-update\.mjs|okinawa-family-trip-(?:A-balanced|B-active|C-relaxed)\.pdf)\?v=([\w.-]+)/g)]
    .map((match) => match[1]);
  assert.ok(revisions.length >= 14, 'all browser shell resources must be revisioned');
  assert.deepEqual([...new Set(revisions)], ['7']);
});

test('downloadable PDFs use the current release revision in the app and offline cache', () => {
  const shell = ['app.mjs', 'sw.js']
    .map((path) => readFileSync(new URL(path, root), 'utf8'))
    .join('\n');
  const urls = [...shell.matchAll(/okinawa-family-trip-(?:A-balanced|B-active|C-relaxed)\.pdf(?:\?v=[\w.-]+)?/g)]
    .map((match) => match[0]);

  assert.equal(urls.length, 6);
  assert.ok(urls.every((url) => url.endsWith('?v=7')));
});

test('manifest uses the GitHub Pages subpath-safe start URL', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.start_url, './#/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'zh-TW');
});

test('service worker rotates the cache after privacy-sensitive content changes', () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  assert.match(worker, /okinawa-road-book-v7/);
  assert.match(worker, /key !== CACHE/);
});

test('service worker only removes old caches owned by this app', async () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  const deleted = [];
  const handlers = {};
  const context = {
    caches: {
      keys: async () => ['okinawa-road-book-v6', 'another-pages-app-v1', 'okinawa-road-book-v7'],
      delete: async (key) => { deleted.push(key); },
    },
    self: {
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: { claim: async () => {}, matchAll: async () => [] },
    },
  };
  vm.runInNewContext(worker, context);
  let activation;
  handlers.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ['okinawa-road-book-v6']);
});

test('service worker prefers the network for online navigations', async () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  const handlers = {};
  const cached = { marker: 'cached' };
  const fresh = { marker: 'fresh', ok: true, clone: () => fresh };
  let fetches = 0;
  const context = {
    URL,
    fetch: async () => { fetches += 1; return fresh; },
    caches: {
      match: async () => cached,
      open: async () => ({ put: async () => {} }),
    },
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
    },
  };
  vm.runInNewContext(worker, context);
  let response;
  handlers.fetch({
    request: { method: 'GET', mode: 'navigate', url: 'https://example.test/' },
    respondWith: (promise) => { response = promise; },
  });
  assert.equal((await response).marker, 'fresh');
  assert.equal(fetches, 1);
});

test('offline navigation falls back to the revisioned HTML shell', async () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  const handlers = {};
  const matched = [];
  const cached = { marker: 'revisioned-shell' };
  const context = {
    URL,
    fetch: async () => { throw new Error('offline'); },
    caches: {
      match: async (request) => { matched.push(request); return cached; },
      open: async () => ({ put: async () => {} }),
    },
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
    },
  };
  vm.runInNewContext(worker, context);
  let response;
  handlers.fetch({
    request: { method: 'GET', mode: 'navigate', url: 'https://example.test/' },
    respondWith: (promise) => { response = promise; },
  });
  assert.equal((await response).marker, 'revisioned-shell');
  assert.deepEqual(matched, ['./index.html?v=7']);
});

test('activating a new worker claims clients without forcing navigation', async () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  const handlers = {};
  const navigated = [];
  const context = {
    caches: { keys: async () => [], delete: async () => {} },
    self: {
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: {
        claim: async () => {},
        matchAll: async () => [{ url: 'https://example.test/trip/#/', navigate: async (url) => { navigated.push(url); } }],
      },
    },
  };
  vm.runInNewContext(worker, context);
  let activation;
  handlers.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(navigated, []);
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

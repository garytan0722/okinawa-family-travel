import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverApp } from '../src/recovery.mjs';

test('recovery removes only Okinawa app caches and unregisters matching workers', async () => {
  const deleted = [];
  const unregistered = [];
  const cacheStorage = {
    async keys() {
      return ['okinawa-road-book-v12', 'unrelated-app-v2', 'okinawa-road-book-v15'];
    },
    async delete(name) {
      deleted.push(name);
      return true;
    },
  };
  const serviceWorker = {
    async getRegistrations() {
      return [
        { scope: 'https://example.test/okinawa-family-travel/', unregister: async () => unregistered.push('trip') },
        { scope: 'https://example.test/other/', unregister: async () => unregistered.push('other') },
      ];
    },
  };

  const result = await recoverApp({
    cacheStorage,
    serviceWorker,
    appScopeUrl: 'https://example.test/okinawa-family-travel/',
  });

  assert.deepEqual(deleted, ['okinawa-road-book-v12', 'okinawa-road-book-v15']);
  assert.deepEqual(unregistered, ['trip']);
  assert.deepEqual(result, { deletedCaches: 2, unregisteredWorkers: 1 });
});

test('recovery still succeeds when cache and service worker APIs are unavailable', async () => {
  const result = await recoverApp({
    cacheStorage: undefined,
    serviceWorker: undefined,
    appScopeUrl: 'https://example.test/okinawa-family-travel/',
  });

  assert.deepEqual(result, { deletedCaches: 0, unregisteredWorkers: 0 });
});

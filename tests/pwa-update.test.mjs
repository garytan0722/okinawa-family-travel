import assert from 'node:assert/strict';
import test from 'node:test';

async function updaterModule() {
  try {
    return await import('../src/pwa-update.mjs');
  } catch {
    return {};
  }
}

test('an existing controlled page reloads once when the new worker takes control', async () => {
  const { installPwaUpdate } = await updaterModule();
  assert.equal(typeof installPwaUpdate, 'function');
  let controllerChange;
  let reloads = 0;
  let updates = 0;
  let registrationArgs;
  const serviceWorker = {
    controller: { scriptURL: 'https://example.test/sw.js?v=5' },
    addEventListener: (name, handler) => { if (name === 'controllerchange') controllerChange = handler; },
    register: async (...args) => { registrationArgs = args; return { update: async () => { updates += 1; } }; },
  };
  await installPwaUpdate(serviceWorker, () => { reloads += 1; });
  controllerChange();
  controllerChange();
  assert.deepEqual(registrationArgs, ['./sw.js?v=20', { updateViaCache: 'none' }]);
  assert.equal(updates, 1);
  assert.equal(reloads, 1);
});

test('a first-time install does not reload a page that already has current assets', async () => {
  const { installPwaUpdate } = await updaterModule();
  assert.equal(typeof installPwaUpdate, 'function');
  let listeners = 0;
  const serviceWorker = {
    controller: null,
    addEventListener: () => { listeners += 1; },
    register: async () => ({ update: async () => {} }),
  };
  await installPwaUpdate(serviceWorker, () => {});
  assert.equal(listeners, 0);
});

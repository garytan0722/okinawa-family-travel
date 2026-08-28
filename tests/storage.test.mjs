import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createEmptyState,
  exportBackup,
  importBackup,
  loadState,
  saveState,
} from '../src/storage.mjs';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('state persists selected variant, completion, note, and energy', () => {
  const storage = new MemoryStorage();
  const state = createEmptyState();
  state.selectedVariant = 'B';
  state.variants.B.completed['B-0925-1'] = true;
  state.variants.B.notes['2026-09-25'] = '孩子在車上睡著';
  state.variants.B.energy['2026-09-25'] = 'tired';

  saveState(storage, state);

  assert.deepEqual(loadState(storage), state);
});

test('variant records stay isolated', () => {
  const state = createEmptyState();
  state.variants.A.notes['2026-09-25'] = 'A note';
  assert.equal(state.variants.B.notes['2026-09-25'], undefined);
  assert.equal(state.variants.C.notes['2026-09-25'], undefined);
});

test('backup round-trip restores user records', () => {
  const state = createEmptyState();
  state.variants.C.completed['C-0926-1'] = true;

  assert.deepEqual(importBackup(exportBackup(state)), state);
});

test('malformed backup is rejected without changing current state', () => {
  const current = createEmptyState();
  current.variants.A.notes['2026-09-24'] = 'keep me';

  assert.throws(() => importBackup('{broken'), /備份檔案格式不正確/);
  assert.equal(current.variants.A.notes['2026-09-24'], 'keep me');
});


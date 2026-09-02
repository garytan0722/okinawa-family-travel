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

test('state persists daily rain mode and per-event rain selections', () => {
  const storage = new MemoryStorage();
  const state = createEmptyState();
  state.variants.B.rainMode['2026-10-03'] = true;
  state.variants.B.rainSelections['B-1003-1'] = 'okimu';

  saveState(storage, state);

  assert.deepEqual(loadState(storage), state);
});

test('legacy records migrate to rain-ready state without losing notes', () => {
  const storage = new MemoryStorage();
  storage.setItem('okinawa-family-travel:v1', JSON.stringify({
    schemaVersion: 1,
    selectedVariant: 'C',
    selectedDate: '2026-09-28',
    variants: {
      A: { completed: {}, notes: {}, energy: {} },
      B: { completed: {}, notes: {}, energy: {} },
      C: { completed: {}, notes: { '2026-09-28': '保留這段筆記' }, energy: {} },
    },
  }));

  const migrated = loadState(storage);

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.variants.C.notes['2026-09-28'], '保留這段筆記');
  assert.deepEqual(migrated.variants.C.rainMode, {});
  assert.deepEqual(migrated.variants.C.rainSelections, {});
});

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

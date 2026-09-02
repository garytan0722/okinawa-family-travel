import assert from 'node:assert/strict';
import test from 'node:test';

const rainState = await import('../src/rain-state.mjs').catch(() => ({}));

test('rain controls toggle a day and replace or restore one event independently', () => {
  assert.equal(typeof rainState.toggleRainMode, 'function');
  assert.equal(typeof rainState.selectRainBackup, 'function');
  assert.equal(typeof rainState.clearRainBackup, 'function');
  if (typeof rainState.toggleRainMode !== 'function') return;

  const variantState = { rainMode: {}, rainSelections: {} };

  assert.equal(rainState.toggleRainMode(variantState, '2026-10-03'), true);
  assert.equal(variantState.rainMode['2026-10-03'], true);
  rainState.selectRainBackup(variantState, 'B-1003-1', 'okimu');
  assert.equal(variantState.rainSelections['B-1003-1'], 'okimu');
  rainState.clearRainBackup(variantState, 'B-1003-1');
  assert.equal(variantState.rainSelections['B-1003-1'], undefined);
  assert.equal(variantState.rainMode['2026-10-03'], true);
  assert.equal(rainState.toggleRainMode(variantState, '2026-10-03'), false);
  assert.equal(variantState.rainMode['2026-10-03'], undefined);
});

const STORAGE_KEY = 'okinawa-family-travel:v1';
const VARIANTS = ['A', 'B', 'C'];

function emptyVariantState() {
  return { completed: {}, notes: {}, energy: {} };
}

export function createEmptyState() {
  return {
    schemaVersion: 1,
    selectedVariant: 'A',
    selectedDate: '2026-09-24',
    variants: {
      A: emptyVariantState(),
      B: emptyVariantState(),
      C: emptyVariantState(),
    },
  };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validatedState(value) {
  if (!isRecord(value) || value.schemaVersion !== 1 || !VARIANTS.includes(value.selectedVariant)) {
    throw new Error('備份檔案格式不正確');
  }
  if (typeof value.selectedDate !== 'string' || !isRecord(value.variants)) {
    throw new Error('備份檔案格式不正確');
  }

  for (const id of VARIANTS) {
    const variant = value.variants[id];
    if (!isRecord(variant) || !isRecord(variant.completed) || !isRecord(variant.notes) || !isRecord(variant.energy)) {
      throw new Error('備份檔案格式不正確');
    }
  }

  return JSON.parse(JSON.stringify(value));
}

export function exportBackup(state) {
  return JSON.stringify(validatedState(state), null, 2);
}

export function importBackup(text) {
  try {
    return validatedState(JSON.parse(text));
  } catch {
    throw new Error('備份檔案格式不正確');
  }
}

export function loadState(storage) {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    return stored ? validatedState(JSON.parse(stored)) : createEmptyState();
  } catch {
    return createEmptyState();
  }
}

export function saveState(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(validatedState(state)));
}

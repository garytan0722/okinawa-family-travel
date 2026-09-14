const STORAGE_KEY = 'okinawa-family-travel:v1';
const VARIANTS = ['A', 'B', 'C'];

function emptyVariantState() {
  return { completed: {}, notes: {}, energy: {}, rainMode: {}, rainSelections: {} };
}

function emptyPrivateBookings() {
  return {
    rental0924: { confirmationCode: '', detailUrl: '', contactUrl: '' },
    rental0930: { confirmationCode: '', detailUrl: '', contactUrl: '' },
    stay0930: { confirmationCode: '', note: '' },
  };
}

export function createEmptyState() {
  return {
    schemaVersion: 4,
    selectedVariant: 'A',
    selectedDate: '2026-09-24',
    privateStayLocation: '',
    privateBookings: emptyPrivateBookings(),
    checklist: {},
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
  if (!isRecord(value) || ![1, 2, 3, 4].includes(value.schemaVersion) || !VARIANTS.includes(value.selectedVariant)) {
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
    if (variant.rainMode !== undefined && !isRecord(variant.rainMode)) throw new Error('備份檔案格式不正確');
    if (variant.rainSelections !== undefined && !isRecord(variant.rainSelections)) throw new Error('備份檔案格式不正確');
  }

  const migrated = JSON.parse(JSON.stringify(value));
  migrated.schemaVersion = 4;
  migrated.privateStayLocation = typeof migrated.privateStayLocation === 'string' ? migrated.privateStayLocation : '';
  const defaults = emptyPrivateBookings();
  const storedBookings = isRecord(migrated.privateBookings) ? migrated.privateBookings : {};
  migrated.privateBookings = Object.fromEntries(Object.entries(defaults).map(([id, fields]) => {
    const stored = isRecord(storedBookings[id]) ? storedBookings[id] : {};
    return [id, Object.fromEntries(Object.keys(fields).map((field) => [
      field,
      typeof stored[field] === 'string' ? stored[field] : '',
    ]))];
  }));
  migrated.checklist = isRecord(migrated.checklist) ? migrated.checklist : {};
  for (const id of VARIANTS) {
    migrated.variants[id].rainMode ??= {};
    migrated.variants[id].rainSelections ??= {};
  }
  return migrated;
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

function ensureRainState(variantState) {
  variantState.rainMode ??= {};
  variantState.rainSelections ??= {};
}

export function toggleRainMode(variantState, date) {
  ensureRainState(variantState);
  const enabled = variantState.rainMode[date] !== true;
  if (enabled) variantState.rainMode[date] = true;
  else delete variantState.rainMode[date];
  return enabled;
}

export function selectRainBackup(variantState, eventId, optionId) {
  ensureRainState(variantState);
  variantState.rainSelections[eventId] = optionId;
}

export function clearRainBackup(variantState, eventId) {
  ensureRainState(variantState);
  delete variantState.rainSelections[eventId];
}

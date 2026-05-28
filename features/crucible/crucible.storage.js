export const CRUOR_COMPOSER_SAVES_KEY = 'cruorComposerSaves';
export const CRUOR_COMPOSER_NAVIGATOR_WIDTH_KEY = 'cruorComposerNavigatorWidth';

export function loadCrucibleSavedBuilds() {
  try { return JSON.parse(localStorage.getItem(CRUOR_COMPOSER_SAVES_KEY) || '[]'); }
  catch (error) { return []; }
}

export function saveCrucibleSavedBuilds(saves) {
  localStorage.setItem(CRUOR_COMPOSER_SAVES_KEY, JSON.stringify(saves));
}

export function loadCrucibleNavigatorWidth() {
  try { return Number(localStorage.getItem(CRUOR_COMPOSER_NAVIGATOR_WIDTH_KEY)); }
  catch (error) { return 0; }
}

export function saveCrucibleNavigatorWidth(width) {
  localStorage.setItem(CRUOR_COMPOSER_NAVIGATOR_WIDTH_KEY, String(width));
}

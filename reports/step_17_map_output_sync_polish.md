# Step 17 — Darken Composer Map/Output Synchronization Polish

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`
- `features/darken-location/composer/model/location-composer-output.js`
- `features/darken-location/composer/model/location-composer-draft.js`

## What Changed
- Added map sync status model.
- Added Map Sync status card to the map stage.
- Clarified fallback preview copy.
- Region nodes now distinguish Synced Room / Region Only.
- Region Focus now shows a region-only fallback card when generated geometry is unavailable.
- Room output now includes a sync label.
- JSON export includes mapSyncStatus and per-room syncLabel.
- No map pipeline, router, backend, or Monster changes.

## Validation
- output exports map sync status: True
- output map notes include sync: True
- room sections include sync label: True
- json export includes map sync status: True
- page imports map sync status: True
- map sync status component added: True
- map sync status rendered: True
- stage mode class added: True
- fallback copy improved: True
- region nodes show synced room: True
- compile preview sync description added: True
- compile room sync label rendered: True
- region focus fallback card added: True
- sync CSS added: True
- pipeline still imported only by page: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no border-color shorthand misuse: True

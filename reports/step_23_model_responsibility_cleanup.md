# Step 23 — Darken Composer Model Responsibility Cleanup

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/model/location-composer-preview.js`

## What Changed
- Added `location-composer-preview.js`.
- Moved `mapRequest`, `previewConfig`, `previewResult`, and preview reset key derivation out of the page.
- Removed direct page imports for map request helper, map input config, map generation, manual override creation, and unused `LocationCompilePreview`.
- Kept UI and CSS unchanged.
- No router, Monster, backend, or Supabase changes.

## Line Counts
- Page before Step 23: 207 lines
- Page after Step 23: 194 lines
- New preview model: 34 lines

## Validation
- page imports preview model: True
- page uses createLocationPreviewModel: True
- page uses getLocationPreviewResetKey: True
- page no longer imports map request helper directly: True
- page no longer imports map input helpers directly: True
- page no longer imports generateMap directly: True
- page no longer imports createEmptyManualOverrides directly: True
- page no longer imports unused LocationCompilePreview: True
- map stage still imports LocationCompilePreview: True
- preview model owns map request helper: True
- preview model owns map config helper: True
- preview model owns generateMap: True
- preview model exports reset key helper: True
- page still has default export: True
- page renders extracted shell components: True
- root remains location composer: True
- no Supabase/backend calls: True
- no monster-shell: True
- JS braces roughly balanced: True
- page import preamble clean: True
- main page under 220 lines: True
- no border-color shorthand misuse: True

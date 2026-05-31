# Step 12 — Darken Composer Component Cleanup

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/model/location-composer-map-preview.js`
- `features/darken-location/composer/model/location-composer-draft.js`
- `features/darken-location/composer/model/location-composer-output.js`

## What Changed
- Extracted map preview helper functions to `location-composer-map-preview.js`.
- Extracted local draft persistence helpers to `location-composer-draft.js`.
- Extracted compile/copy/export helpers to `location-composer-output.js`.
- Kept UI components in `DarkenLocationComposerPage.jsx`.
- No CSS changes.
- No intended functional changes.

## Validation
- page imports map preview helpers: True
- page imports draft helpers: True
- page imports output helpers: True
- preview helper module exports room helpers: True
- draft helper module imports toArray: True
- draft helper module exports storage helpers: True
- output helper module imports selectors: True
- output helper module exports compile helpers: True
- page no longer defines extracted helpers: True
- LocationCompilePreview remains in page: True
- LocationDraftControls remains in page: True
- root remains location composer: True
- no monster-shell: True
- balanced braces in modules: True
- no duplicate helper functions in page: True

## Size
- Before: 50234 bytes
- After: 39846 bytes

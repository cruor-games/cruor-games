# Step 15 — Darken Composer Output Quality Pass

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`
- `features/darken-location/composer/model/location-composer-output.js`

## What Changed
- Added richer `Session Insert` output.
- Added `Copy Session Insert`.
- Reworked output model around Premise / Rooms / Components / Map Notes.
- Improved Region Summary and Table-Ready Text.
- JSON snapshot now includes richer output data.
- No intended pipeline, backend, router, or Monster changes.

## Validation
- output module has session insert text: True
- output module has premise section: True
- output module has map notes: True
- output module has room sections: True
- output module keeps export async syntax: True
- copy session insert button added: True
- session insert UI added: True
- rooms output UI added: True
- components output UI added: True
- map notes UI added: True
- output quality CSS added: True
- no backend calls added: True
- root remains location composer: True
- no monster-shell: True
- CSS braces balanced: True
- no border-color shorthand misuse: True

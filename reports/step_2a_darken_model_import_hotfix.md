# Step 2a — Darken Model Import Hotfix

## Cause
`features/darken-location/composer/model/*` is one level deeper than `DarkenLocationComposerPage.jsx`.
Imports to `features/crucible/*` must use `../../../crucible/*`, not `../../crucible/*`.

## Changed Files
- `features/darken-location/composer/model/location-composer-state.js`
- `features/darken-location/composer/model/location-composer-selectors.js`

## Validation
- state import uses ../../../crucible: True
- selectors imports use ../../../crucible: True
- no wrong ../../crucible import remains: True
- relative model import unchanged: True

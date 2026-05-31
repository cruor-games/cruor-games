# Step 2 — Darken React Shell

## Changed Files
- `app/router.jsx`
- `features/darken-location/composer/index.js`
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`
- `features/darken-location/composer/model/location-composer-state.js`
- `features/darken-location/composer/model/location-composer-selectors.js`

## Untouched Uploaded Files
- `features/crucible/index.js`
- `features/darken-location/darken-location.map-request.js`
- `features/crucible/crucible.components-data.js`
- `features/crucible/crucible.sources-data.js`
- `features/crucible/crucible.location-regions.js`
- `features/crucible/crucible.workflows.js`
- `features/crucible/crucible.state.js`

## What Changed
- Replaced the Darken route render with `DarkenLocationComposerPage`.
- Created `cruor-composer-shell location-composer` root.
- Added left rail, center map-stage prototype, and right slot inspector.
- Wired existing data into a minimal React state/snapshot flow.
- Kept `onSnapshotProviderReady` compatibility for the existing map request path.
- Did not modify Monster.
- Did not delete legacy Crucible files.

## Validation
- router imports DarkenLocationComposerPage: True
- router no longer imports legacy Crucible: True
- router renders DarkenLocationComposerPage in darken panel: True
- new Darken root uses cruor composer location classes: True
- new Darken files do not use monster-shell: True
- snapshot provider compatibility is present: True
- map request compatibility is present: True
- new files use shared composer primitives: True
- new CSS has no Monster selectors: True
- no features/crucible/styles.css generated: True
- css braces balanced: True
- new files use expected relative imports: True
- no border-color shorthand misuse in new CSS: True

# Step 4 — Region System + Map Stage Preparation

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`
- `features/darken-location/composer/model/location-composer-state.js`
- `features/darken-location/composer/model/location-composer-selectors.js`
- `features/darken-location/darken-location.map-request.js`

## Untouched Uploaded Files
- `features/darken-location/map-generator/index.js`
- `features/darken-location/map-generator/map-generator.page.jsx`
- `features/darken-location/map-generator/map-generator.styles.css`
- `features/crucible/crucible.location-regions.js`

## What Changed
- Added a Region Focus panel in the right rail.
- Region details now expose feature, interaction, danger, secret, reward, and read-aloud data.
- Assigned components can be reassigned to regions through quick numbered region buttons.
- Region nodes now expose attachment state more clearly.
- The center stage keeps a build digest plus region attachment strip.
- Map request metadata is now region-aware: slot assignments, active slot, active region, region component links, and region-level assigned components are serialized.
- `MapViewport` is not mounted in this step; this prepares the data contract for Step 5.

## Validation
- page imports moveAssignmentToRegion: True
- page renders RegionFocusPanel: True
- assigned stack can reassign region: True
- stage uses region summary: True
- selectors expose getRegionById: True
- selectors expose getRegionDetailRows: True
- selectors expose getRegionAttachmentSummary: True
- map request normalizes slot assignments: True
- map request writes region assigned components: True
- map request writes region links metadata: True
- root remains location composer: True
- no monster-shell in updated files: True
- imports to crucible from model stay correct: True
- css braces balanced: True
- map request braces plausibly balanced: True
- no border-color shorthand misuse in updated CSS: True

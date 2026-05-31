# Step 3 — Darken Functional Slot Assignments

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`
- `features/darken-location/composer/model/location-composer-state.js`
- `features/darken-location/composer/model/location-composer-selectors.js`

## Input Note
- `DarkenLocationComposerPage.jsx` was not uploaded with this batch.
- I used the Step 2 generated file as the baseline.

## What Changed
- Added real `slotAssignments` state.
- Slot assignment now respects slot `max`.
- Adding to a full slot replaces the existing choice instead of overfilling.
- Components are linked to the active slot and active region.
- The center stage now shows build digest and region-linked component markers.
- The right rail now shows assigned components for the active slot.
- Snapshot now serializes `slotAssignments` and `selectedComponentIds`.

## Validation
- state has slotAssignments: True
- state derives selected ids from assignments: True
- snapshot serializes slotAssignments: True
- selectors can read assigned components by slot: True
- selectors can read assigned components by region: True
- selectors expose slot capacity label: True
- page uses assignComponentToSlot: True
- page uses removeComponentFromSlot: True
- page renders assigned stack: True
- page renders stage digest: True
- page shows region attachment strip: True
- page root remains location composer: True
- new files do not use monster-shell: True
- imports to crucible from model stay correct: True
- page imports from correct composer/model path: True
- css braces balanced: True
- no border-color shorthand misuse in updated CSS: True

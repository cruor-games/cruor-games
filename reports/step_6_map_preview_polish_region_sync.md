# Step 6 — Map Preview Polish + Region Sync

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Region nodes now sync to generated room positions when live map preview exists.
- MapViewport internal room labels are disabled to reduce duplicate labels.
- Region Focus now shows generated room number, role, shape, level, and surface/profile.
- Active stage footer now displays active generated room metadata.
- No map generator internals were modified.

## Validation
- helpers added: True
- MapViewport names disabled: True
- LocationStage uses generated room positions: True
- RegionFocusPanel receives generatedMapPreview: True
- LocationSlotRail passes generatedMapPreview: True
- root remains location composer: True
- no monster-shell: True
- css braces balanced: True
- css hides map labels: True
- generated room card CSS: True

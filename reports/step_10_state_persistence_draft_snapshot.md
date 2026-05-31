# Step 10 — State Persistence / Draft Snapshot

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Added Local Draft strip.
- Added `Save Draft`.
- Added `Load Draft`.
- Added safe `Reset`.
- Added localStorage serialization/restore for source anchors, horrors, slot assignments, selected IDs, and regions.
- Added unsaved-change protection through `beforeunload`.
- Reset keeps the saved local draft available.

## Validation
- useRef imported: True
- draft storage key added: True
- draft serialization added: True
- draft restore added: True
- save draft action added: True
- load draft action added: True
- reset composer action added: True
- beforeunload protection added: True
- draft controls rendered: True
- localStorage only persistence: True
- root remains location composer: True
- no monster-shell: True
- CSS draft strip added: True
- CSS braces balanced: True
- no border-color shorthand misuse: True

# Step 8 — Compile Preview / Output Strip

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Added `LocationCompilePreview` below the live map stage.
- Added slot output preview based on real slot assignments.
- Added region output preview with read-aloud, feature, danger, secret, reward, and attached components.
- Added table-ready text block for the next copy/export step.
- Did not use the old legacy compiled view.
- Did not implement copy/export yet.

## Validation
- LocationCompilePreview component added: True
- compile preview helper added: True
- table ready text exists: True
- LocationStage renders compile preview: True
- compile preview uses slot assignments: True
- compile preview uses region assignments: True
- compile preview includes read aloud: True
- root remains location composer: True
- no monster-shell: True
- CSS includes compile preview styles: True
- CSS braces balanced: True
- no border-color shorthand misuse: True

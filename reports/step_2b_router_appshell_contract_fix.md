# Step 2b — Router/AppShell Contract Fix

## Cause
- `AppShell.jsx` renders only `homeContent`, `crucibleContent`, and `inspirationsContent`.
- `router.jsx` was passing `darkenContent` and `monsterComposerContent`, which AppShell ignores.
- `activeSection` started as `darken`, but AppShell navigation only supports `home`, `crucible`, and `inspirations`.

## Changed Files
- `app/router.jsx`

## What Changed
- `activeSection` now defaults to `crucible`.
- Added `homeContent`.
- Added `crucibleContent`.
- Passed the correct props to `AppShell`.
- Kept Darken and Monster accessible inside Crucible.
- Kept the Darken Map lazy route.
- Did not modify `AppShell.jsx` or `app-shell.css`.

## Validation
- activeSection defaults to valid AppShell section: True
- router passes homeContent to AppShell: True
- router passes crucibleContent to AppShell: True
- router no longer passes unused darkenContent prop: True
- router no longer passes unused monsterComposerContent prop: True
- home content is defined: True
- crucible content is defined: True
- darken shell remains mounted through DarkenLocationComposerPage: True
- monster composer remains accessible: True
- AppShell UI mode wiring exists: True
- map generator lazy path unchanged: True
- no legacy Crucible import: True

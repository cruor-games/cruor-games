# Step 27c — Restore Darken React Composer

## Diagnosis
- The current router had regressed Darken to the legacy `Crucible` DOM app.
- The legacy mount writes `getCrucibleTemplate()` into the root and starts `crucible.events.js`.
- The uploaded `DarkenLocationComposerPage.jsx` is the React location composer and exposes the snapshot provider needed by the map flow.

## Fix
- `app/router.jsx` now imports `DarkenLocationComposerPage` from `features/darken-location/composer/index.js`.
- `#darkenComposerPanel` now renders `DarkenLocationComposerPage` again.
- Removed the hidden `#workflowButtons` bridge because the legacy DOM runtime should not mount for Darken.
- No CSS, AppShell, topbar, Monster, Inspirations, Map Generator internals, or backend code changed.

## Changed Files
- `app/router.jsx`

## Included For Baseline Integrity
- `app/AppShell.jsx`
- `app/app-shell.css`
- `features/crucible/components/CrucibleTopbar.jsx`

## Diagnostics
- router currently imports legacy Crucible: True
- router currently renders legacy Crucible in Darken panel: True
- router currently does not import Darken React page: True
- mount overwrites root with legacy template: True
- template is legacy workbench: True
- legacy runtime expects workflowButtons: True
- Darken React page root is location composer: True
- Darken React page exposes snapshot provider: True

## Validation
- router imports DarkenLocationComposerPage: True
- router renders DarkenLocationComposerPage: True
- router no longer imports legacy Crucible: True
- router no longer renders legacy Crucible in Darken panel: True
- router no longer injects workflowButtons bridge: True
- router keeps map generator lazy import: True
- router keeps map request helper: True
- router keeps snapshot provider bridge: True
- router keeps openMapGenerator bridge: True
- router still renders MonsterComposerPage: True
- router still renders InspirationsPage: True
- AppShell keeps Patreon placeholder: True
- CSS unchanged keeps Step 27 override: True
- CSS unchanged keeps homogeneous panel styles: True
- CrucibleTopbar remains available: True
- Darken React page is expected location composer: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no Supabase/backend calls added: True

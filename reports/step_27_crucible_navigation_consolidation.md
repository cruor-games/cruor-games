# Step 27 — Crucible Navigation Consolidation

## Changed Files
- `app/router.jsx`
- `app/app-shell.css`
- `features/crucible/components/CrucibleTopbar.jsx`

## Included For Baseline Integrity
- `app/AppShell.jsx`

## Baseline Note
The uploaded `router.jsx` still used `activeSection="darken"`, but the uploaded `AppShell.jsx` renders only `home`, `crucible`, and `inspirations`. Step 27 restores that contract.

## What Changed
- Restored `homeContent`, `crucibleContent`, and `inspirationsContent` routing contract.
- Kept the current legacy `Crucible` renderer inside Darken.
- Replaced hardcoded Crucible topbar JSX with `CrucibleTopbar`.
- Consolidated tool switching into one compact select: `I need to [Darken a Location / Build a Monster]`.
- Kept view switching as compact icon tabs.
- Removed visible generator button group and Generator/View status row from the Crucible topbar.
- Kept Patreon placeholder.

## Baseline Checks
- AppShell uses home/crucible/inspirations contract: True
- AppShell keeps Patreon placeholder: True
- AppShell uses compact mode select: True
- uploaded router imports legacy Crucible: True
- uploaded router imports MonsterComposerPage: True
- uploaded router imports InspirationsPage: True
- uploaded router incompatible active section detected: True

## Validation
- AppShell receives home/crucible/inspirations content: True
- router starts on Home: True
- router keeps activeUiMode: True
- router imports CrucibleTopbar: True
- router imports legacy Crucible renderer: True
- router renders legacy Crucible in Darken panel: True
- router renders MonsterComposerPage: True
- router renders InspirationsPage: True
- router defines generator config: True
- router uses CrucibleTopbar component: True
- duplicated hardcoded topbar removed: True
- CrucibleTopbar has tool select: True
- CrucibleTopbar has no visible state row: True
- CrucibleTopbar keeps legacy slot support: True
- AppShell keeps Patreon placeholder: True
- CSS has Step 26 override: True
- CSS has Step 27 override: True
- CSS styles mode select: True
- CSS styles tool select: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no Supabase/backend calls added: True

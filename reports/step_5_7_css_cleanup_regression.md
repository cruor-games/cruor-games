# Step 5.7 — CSS Cleanup + Regression Pass

## Removed CSS
- Monster legacy selector parts removed: 70
- Monster full rules removed: 51
- Monster legacy at-rules removed: 2
- AppShell selector parts removed: 4
- AppShell full rules removed: 2

## Preserved
- `MonsterSilhouetteMap` / anatomy slot cards
- `ComponentNavigatorModal` fullscreen overlay
- `game-frame-drawer--fullscreen` overlay
- `darken-topbar__eyebrow` compatibility selectors
- shared Cruor UI token declarations

## Validation
- no exact legacy slot css classes: True
- no exact legacy slot jsx classes: True
- no emptySlot animation: True
- silhouette guided pulse preserved: True
- no dead app/topbar css classes: True
- no app home action span css: True
- darken eyebrow compatibility preserved: True
- no targeted undefined vars: True
- no bad border-color contexts: True
- monster page explicit css import: True
- component navigator fullscreen preserved: True
- game frame fullscreen preserved: True
- css braces balanced: True
- jsx braces roughly balanced: True
- targeted undefined `--cruor-ui-*` / `--cruor-z-*` vars: []
- bad border-color contexts: []

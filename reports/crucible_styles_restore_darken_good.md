# Crucible Styles Restore — Darken Good CSS

## Scope
- Changed only `features/crucible/crucible.styles.css`.
- Did not generate `features/crucible/styles.css`.
- Did not touch JSX.

## Cause
- The uploaded `crucible.styles.css` was Monster-scoped and missing Darken selectors.
- Broken file `.monster-shell` occurrences: 1259
- Broken file `.region-card` occurrences: 0
- Broken file `.sensory-subslot` occurrences: 0

## Fix
- Restored last-known-good Darken/Crucible CSS from `styles.css`.
- Wrote it only to `features/crucible/crucible.styles.css`.

## Validation
- output path is features/crucible/crucible.styles.css: True
- no features/crucible/styles.css generated: True
- no jsx changed: True
- restored darken app root styles: True
- restored region-card styles: True
- restored sensory-subslot styles: True
- restored build-slot styles: True
- removed monster-shell contamination: True
- bad exact border token patterns removed: True
- no border-color var resolves to border shorthand: True
- css braces balanced: True
- border-color contexts audited: 3
- bad border-color contexts: 0

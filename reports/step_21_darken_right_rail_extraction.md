# Step 21 — Darken Composer Right Rail Extraction

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`

## What Changed
- Extracted `LocationSlotRail`.
- Extracted local `AssignedSlotStack` inside `LocationSlotRail.jsx`.
- Extracted local `RegionFocusPanel` inside `LocationSlotRail.jsx`.
- Kept CSS unchanged.
- Kept behavior unchanged.
- No map pipeline, router, backend, or Monster changes.

## Note
`ComponentBrowserPanel` was not extracted as a separate component because the baseline did not contain that function yet. The component browser remains inside `LocationSlotRail.jsx` for a safer first extraction.

## Line Reduction
- Before Step 21 page file: 613 lines
- After Step 21 page file: 319 lines
- Removed from page file: 294 lines

## Validation
- page imports LocationSlotRail: True
- page renders LocationSlotRail: True
- page still has default export: True
- page no longer defines AssignedSlotStack: True
- page no longer defines RegionFocusPanel: True
- page no longer defines LocationSlotRail: True
- slot rail exports LocationSlotRail: True
- slot rail contains AssignedSlotStack: True
- slot rail contains RegionFocusPanel: True
- slot rail imports assignment helpers: True
- slot rail imports generated room helpers: True
- main page under 500 lines: True
- CSS unchanged: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- JS braces roughly balanced: True
- slot rail location regions import path fixed: True
- no border-color shorthand misuse: True

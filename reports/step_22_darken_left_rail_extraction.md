# Step 22 — Darken Composer Left Rail Extraction

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`

## What Changed
- Extracted `LocationBriefPanel`.
- Moved left-rail option constants into `LocationBriefPanel.jsx`.
- Kept CSS unchanged.
- Kept behavior unchanged.
- No map pipeline, router, backend, or Monster changes.

## Line Reduction
- Before Step 22 page file: 319 lines
- After Step 22 page file: 235 lines
- Removed from page file: 84 lines

## Validation
- page imports LocationBriefPanel: True
- page renders LocationBriefPanel: True
- page still has default export: True
- page no longer defines LocationBriefPanel: True
- brief component exports LocationBriefPanel: True
- brief component owns constants: True
- brief component imports source anchors: True
- brief component imports toggle helpers: True
- main page under 250 lines: True
- CSS unchanged: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- JS braces roughly balanced: True
- page import section removed brief-only symbols: True
- no border-color shorthand misuse: True

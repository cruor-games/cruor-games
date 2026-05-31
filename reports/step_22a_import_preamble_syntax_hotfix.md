# Step 22a — Import Preamble Syntax Hotfix

## Cause
Step 22 generated a corrupted import preamble in `DarkenLocationComposerPage.jsx`: import statements had `;,` artifacts and some imports were nested/indented as plain tokens.

## Fix
- Rebuilt the full import block of `DarkenLocationComposerPage.jsx`.
- Kept only the helpers still used by the page after the left/right rail extraction.
- Left all extracted components and CSS unchanged.

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`

## Validation
- page import preamble has no semicolon comma artifact: True
- page import preamble has no indented import artifact: True
- page imports React hooks cleanly: True
- page imports map generator helpers: True
- page imports composer state helpers: True
- page imports composer selector helpers: True
- page imports extracted components: True
- page still has default export: True
- page renders LocationBriefPanel: True
- page renders LocationSlotRail: True
- page renders LocationMapStage: True
- root remains location composer: True
- no Supabase/backend calls: True
- no monster-shell: True
- JS braces roughly balanced: True
- body symbols covered by import preamble: True

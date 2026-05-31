# Step 20c — Page Preview Overrides Import Hotfix

## Cause
`DarkenLocationComposerPage.jsx` still calls `generateMap(previewConfig, createEmptyManualOverrides())`, but Step 20 removed the import while extracting map-stage code.

## Fix
- Restored `import { createEmptyManualOverrides } from "../map-generator/map-generator.state.js";` in `DarkenLocationComposerPage.jsx`.
- Kept Step 20b’s `LocationMapStage.jsx` local `manualOverrides` fix.

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`

## Validation
- page imports createEmptyManualOverrides: True
- page still uses createEmptyManualOverrides for generateMap: True
- only page references createEmptyManualOverrides: True
- LocationMapStage no longer references createEmptyManualOverrides: True
- LocationMapStage local manualOverrides object remains: True
- LocationMapStage imports LocationCompilePreview: True
- page imports LocationMapStage: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- JS braces roughly balanced: True

## Occurrences
- `DarkenLocationComposerPage.jsx` line 6
- `DarkenLocationComposerPage.jsx` line 455

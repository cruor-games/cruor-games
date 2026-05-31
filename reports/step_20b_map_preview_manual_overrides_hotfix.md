# Step 20b — Map Preview Manual Overrides Hotfix

## Cause
`LocationMapStage.jsx` used `createEmptyManualOverrides()` after extraction. In runtime this symbol was unavailable, so the map preview fell back with `createEmptyManualOverrides is not defined`.

## Fix
- Removed the `createEmptyManualOverrides` dependency from `LocationMapStage.jsx`.
- Created the empty `manualOverrides` object locally inside `LocationMapPreview`.
- Preserved `LEVEL_VIEW_ALL` and `MapViewport` usage.

## Changed Files
- `features/darken-location/composer/components/LocationMapStage.jsx`

## Validation
- createEmptyManualOverrides removed from LocationMapStage: True
- LEVEL_VIEW_ALL import preserved: True
- manualOverrides object created locally: True
- MapViewport still receives manualOverrides: True
- LocationMapStage imports LocationCompilePreview: True
- LocationMapStage still renders LocationCompilePreview: True
- compile component exists and exports: True
- page imports LocationMapStage: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- JS braces roughly balanced: True

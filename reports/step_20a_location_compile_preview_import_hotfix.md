# Step 20a — LocationCompilePreview Import Hotfix

## Cause
`LocationMapStage.jsx` still rendered `<LocationCompilePreview />`, but Step 20 had moved that component to `LocationCompilePreview.jsx` without importing it locally.

## Fix
- Added `import { LocationCompilePreview } from "./LocationCompilePreview.jsx";` to `features/darken-location/composer/components/LocationMapStage.jsx`.

## Changed Files
- `features/darken-location/composer/components/LocationMapStage.jsx`

## Validation
- LocationMapStage imports LocationCompilePreview: True
- LocationMapStage still renders LocationCompilePreview: True
- compile component exists and exports: True
- page imports LocationMapStage: True
- page no longer defines extracted components: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- JS braces roughly balanced: True

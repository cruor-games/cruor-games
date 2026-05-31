# Step 20 — Darken Composer Component Extraction

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationCompilePreview.jsx`
- `features/darken-location/composer/components/LocationDraftControls.jsx`
- `features/darken-location/composer/components/LocationWorkflowGuide.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`

## Included Unchanged For Baseline Integrity
- `features/darken-location/composer/model/location-composer-output.js`
- `features/darken-location/composer/model/location-composer-draft.js`

## What Changed
- Extracted `LocationCompilePreview`.
- Extracted `LocationDraftControls`.
- Extracted `LocationWorkflowGuide`.
- Extracted `LocationMapStage` with local `LocationMapSyncStatus` and `LocationMapPreview`.
- Kept CSS unchanged.
- No map pipeline, router, backend, or Monster changes.

## Line Reduction
- Before: 1076 lines
- After: 612 lines
- Removed from page file: 464 lines

## Validation
- page imports LocationCompilePreview: True
- page imports LocationDraftControls: True
- page imports LocationWorkflowGuide: True
- page imports LocationMapStage: True
- page renders LocationMapStage: True
- page no longer defines extracted components: True
- compile component exports: True
- draft component exports: True
- workflow component exports: True
- map stage component exports: True
- map stage owns map sync and preview: True
- compile component owns copy helpers: True
- draft component owns timestamp format import: True
- workflow component owns slot/region imports: True
- main page under 650 lines: True
- CSS unchanged: True
- no Supabase/backend calls: True
- root remains location composer: True
- no monster-shell: True
- output module export async syntax valid: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- page no longer imports MapViewport directly: True
- page no longer imports output helpers directly: True
- no border-color shorthand misuse: True

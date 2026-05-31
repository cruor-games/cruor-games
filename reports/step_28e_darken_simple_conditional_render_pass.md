# Step 28e — Darken Simple Conditional Render Pass

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationDraftControls.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- `uiMode` is now passed from the page into draft controls and map stage.
- Old intro/workflow/audit/legend JSX is removed from the page.
- Draft controls no longer render `Clear Saved` and `Reset Current` in Simple mode.
- Draft technical/browser copy is removed from JSX.
- `LocationCompilePreview` is not mounted in Simple mode.
- Stage footer and active-region attachment strip are not mounted in Simple mode.
- Simple stage still keeps the map preview and region nodes.
- Embedded map preview props from Step 28d are preserved in `LocationMapStage.jsx`.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/map-generator/map-generator.page.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- Monster Composer
- legacy Crucible runtime
- shared CSS
- backend/Supabase

## Safety Checks
- page_removes_workflow_guide_import: True
- page_removes_old_intro_copy: True
- page_removes_audit_and_legend: True
- page_passes_ui_mode_to_draft_controls: True
- page_passes_ui_mode_to_map_stage: True
- draft_removes_technical_browser_copy: True
- draft_conditionally_renders_clear_reset: True
- draft_keeps_save_load: True
- map_stage_accepts_ui_mode: True
- map_stage_does_not_mount_output_in_simple: True
- map_stage_conditionally_renders_footer: True
- map_stage_keeps_embedded_map_props: True
- map_stage_keeps_region_nodes: True
- css_step28e_present: True
- css_braces_balanced: True
- page_braces_balanced: True
- draft_braces_balanced: True
- stage_braces_balanced: True
- no_router_appshell_topbar_touched: True
- no_map_generator_touched: True
- no_supabase_backend_added: True

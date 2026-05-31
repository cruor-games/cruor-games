# Step 28f — Darken Layout Polish Pass

## Changed Files
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Removed the separate `RegionSummaryPanel` from the right rail.
- Removed duplicate target summary rendering.
- Kept one compact Target area inside the Active Slot panel.
- Kept slot selection, target region switching, component add/remove, and map workspace button.
- Reduced right rail density through final Step 28f CSS overrides.
- Added fallback CSS to hide old `location-region-panel--summary` if stale DOM survives HMR.
- Softened simple-stage region nodes without touching `LocationMapStage.jsx`.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/map-generator/map-generator.page.jsx`
- Monster Composer
- legacy Crucible runtime
- shared CSS
- backend/Supabase

## Safety Checks
- slot_removes_region_summary_panel_function: True
- slot_removes_region_summary_panel_render: True
- slot_removes_duplicate_summary_imports: True
- slot_keeps_slot_list: True
- slot_keeps_active_target_control: True
- slot_keeps_add_remove: True
- slot_keeps_map_workspace_button: True
- slot_empty_state_quiet: True
- css_step28f_present: True
- css_hides_old_summary_fallback: True
- css_polishes_right_rail: True
- css_softens_region_nodes: True
- css_braces_balanced: True
- slot_braces_balanced: True
- no_router_appshell_topbar_touched: True
- no_map_stage_touched: True
- no_supabase_backend_added: True

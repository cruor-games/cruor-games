# Step 28c — Darken Simple Mode Structure Pass

## Changed Files
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Left rail now uses compact selects for Context, Horror, and Source instead of large button/card grids.
- Source Anchor descriptions are no longer rendered in the default panel.
- Map Sync status component is removed from the default stage surface.
- Compile Preview is moved into an advanced collapsed output container, hidden in Simple mode.
- Region nodes no longer render long helper text in their default body.
- Stage footer reduced to three compact metrics.
- Slot rail no longer renders long slot descriptions in each slot button.
- Component cards no longer render summary prose or per-card region chip groups.
- Region focus is reduced to a compact target summary, not full detail rows/debug output.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- Monster Composer
- Map Generator internals
- legacy Crucible runtime
- shared CSS
- backend/Supabase

## Safety Checks
- brief_removes_describeSourceAnchor: True
- brief_uses_selects: True
- brief_removes_source_descriptions: True
- map_removes_sync_status_component: True
- map_keeps_map_viewport: True
- map_keeps_region_board: True
- map_moves_compile_preview_to_details: True
- slot_removes_region_focus_detail_rows: True
- slot_removes_component_region_chips: True
- slot_keeps_add_remove: True
- slot_keeps_map_button: True
- css_step28c_present: True
- css_braces_balanced: True
- brief_braces_balanced: True
- map_braces_balanced: True
- slot_braces_balanced: True
- no_router_appshell_topbar_touched: True

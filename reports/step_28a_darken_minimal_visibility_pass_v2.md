# Step 28a — Darken Minimal Visibility Pass v2

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Replaced the onboarding header with a compact `Darken a Location` header.
- Removed `LocationWorkflowGuide` from the page render and import.
- Removed the visible readiness audit strip.
- Removed the visible output-scope/system legend.
- Preserved draft save/load logic, but moved it into the compact header surface.
- Hid draft implementation/status text in the default visual surface.
- In Simple mode, hid destructive/maintenance draft actions (`Clear Saved`, `Reset Current`).
- In Simple mode, reduced repeated explanatory prose in panels, cards, map sync, output, region details, and empty states.
- Preserved LocationBriefPanel, LocationMapStage, LocationSlotRail, map bridge, snapshot provider, and save/load handlers.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- Monster Composer
- Map Generator internals
- legacy Crucible runtime
- shared CSS
- backend/Supabase

## Safety Checks
- jsx_curly_balanced: True
- jsx_paren_balanced: True
- css_braces_balanced: True
- workflow_guide_import_removed: True
- workflow_guide_render_removed: True
- audit_strip_removed_from_jsx: True
- system_legend_removed_from_jsx: True
- intro_explanatory_copy_removed: True
- darken_title_present: True
- draft_controls_preserved: True
- map_stage_preserved: True
- slot_rail_preserved: True
- brief_panel_preserved: True
- snapshot_provider_preserved: True
- map_bridge_preserved: True
- minimal_css_override_present: True
- simple_mode_hides_status_layers: True
- simple_mode_quiets_panel_prose: True
- simple_mode_hides_debug_output: True

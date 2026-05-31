# Step 28g — Darken Layout Consolidation Pass

## Changed Files
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Replaced the stacked Step 28a–28f override blocks with one consolidated CSS file.
- Preserved current Simple mode behavior and fallback guards.
- Rebalanced the 3-column layout to give more visual weight to the center stage.
- Reduced left and right rail density.
- Kept the embedded map preview passive and quiet.
- Kept region node overlay styling, but softened it.
- Kept responsive collapse behavior.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- `features/darken-location/map-generator/map-generator.page.jsx`
- Monster Composer
- legacy Crucible runtime
- backend/Supabase

## Size
- Original CSS bytes: 46602
- New CSS bytes: 18687
- Delta bytes: -27915

## Safety Checks
- contains_single_step28g_header: True
- removes_step28a_section: True
- removes_step28b_section: True
- removes_step28c_section: True
- removes_step28d_section: True
- removes_step28e_section: True
- removes_step28f_section: True
- keeps_composer_shell_layout: True
- keeps_header_draft_controls: True
- keeps_left_rail_controls: True
- keeps_stage_preview: True
- keeps_embedded_map_chrome_hiding: True
- keeps_region_nodes: True
- keeps_right_rail: True
- keeps_simple_mode_guards: True
- keeps_responsive_breakpoints: True
- css_braces_balanced: True

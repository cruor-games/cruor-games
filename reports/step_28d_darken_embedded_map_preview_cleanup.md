# Step 28d — Darken Embedded Map Preview Cleanup

## Changed Files
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`
- `features/darken-location/map-generator/map-generator.page.jsx`

## What Changed
- `MapViewport` now supports an embedded quiet mode.
- The default full Map Generator behavior is preserved.
- Darken composer passes `embeddedPreview`, `showViewportChrome=false`, and `enableViewportInteractions=false`.
- Embedded preview no longer renders zoom toolbar, zoom hint, or context-menu UI.
- Embedded preview no longer attaches wheel zoom or pointer pan handlers.
- The map preview is treated as a passive background layer behind Darken region nodes.
- CSS adds a fallback to hide embedded map chrome even if older DOM survives during HMR.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- Monster Composer
- legacy Crucible runtime
- shared CSS
- backend/Supabase

## Safety Checks
- map_viewport_signature_has_embedded_props: True
- map_viewport_defaults_preserve_full_chrome: True
- map_viewport_disables_wheel_when_not_interactive: True
- map_viewport_conditionally_renders_context_menus: True
- map_viewport_conditionally_renders_bottom_bar: True
- location_stage_passes_embedded_props: True
- location_stage_keeps_map_viewport: True
- location_stage_keeps_region_board: True
- css_step28d_present: True
- css_hides_embedded_zoom_chrome: True
- css_makes_preview_passive: True
- css_braces_balanced: True
- stage_braces_balanced: True
- map_page_braces_balanced: True
- no_router_appshell_topbar_touched: True
- no_supabase_backend_added: True

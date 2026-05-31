# Step 28h — Darken Header Removal / Draft Controls Relocation

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Removed the redundant `location-composer__intro` header from the page render.
- Moved `LocationDraftControls` into `LocationBriefPanel` through a `draftControls` prop.
- `Save Draft` and `Load Draft` now live inside the left brief panel.
- Added a compact draft-control layout inside `location-brief-panel`.
- Removed obsolete `.location-composer__intro` CSS selectors.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/composer/components/LocationDraftControls.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- `features/darken-location/map-generator/map-generator.page.jsx`
- Monster Composer
- legacy Crucible runtime
- backend/Supabase

## Safety Checks
- page_removes_location_composer_intro_render: True
- page_removes_header_element: True
- page_passes_draft_controls_to_brief_panel: True
- brief_accepts_draft_controls_prop: True
- brief_renders_draft_controls_inside_panel: True
- draft_buttons_still_present_via_component: True
- css_adds_step28h: True
- css_styles_brief_draft: True
- css_no_intro_selectors: True
- css_braces_balanced: True
- page_braces_balanced: True
- brief_braces_balanced: True
- no_router_appshell_topbar_touched: True
- no_map_stage_touched: True
- no_map_generator_touched: True
- no_supabase_backend_added: True

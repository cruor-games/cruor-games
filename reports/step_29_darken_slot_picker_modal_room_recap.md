# Step 29 — Darken Slot Picker Modal + Persistent Room Recap

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/components/LocationBriefPanel.jsx`
- `features/darken-location/composer/components/LocationSlotRail.jsx`
- `features/darken-location/composer/components/LocationComponentPickerModal.jsx`
- `features/darken-location/composer/components/LocationMapStage.jsx`
- `features/darken-location/composer/components/LocationRoomRecapCard.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Removed the permanent active-slot component list from the right rail.
- Slot buttons now open a modal picker for Premise / Sensory Layer / Visible Anomaly / other slots.
- Added `LocationComponentPickerModal.jsx`, using the Monster Navigator modal panel class pattern.
- Added `LocationRoomRecapCard.jsx`, using the room tooltip card structure as a persistent map overlay.
- Moved the room recap directly above the embedded map surface.
- Kept add/remove component behavior and target-region switching inside the modal.
- Kept draft controls inside the brief panel.

## Not Touched
- `app/router.jsx`
- `app/AppShell.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`
- `features/darken-location/map-generator/map-generator.page.jsx`
- Monster Composer
- legacy Crucible runtime
- backend/Supabase

## Safety Checks
- page_no_header_intro: True
- page_passes_draft_controls_to_brief: True
- brief_accepts_draft_controls: True
- brief_uses_compact_selects: True
- slot_imports_picker_modal: True
- slot_no_active_panel_render: True
- slot_no_permanent_component_list: True
- slot_opens_picker_from_slot: True
- picker_modal_uses_navigator_panel_classes: True
- picker_modal_has_search: True
- picker_modal_can_add_remove: True
- stage_imports_room_recap: True
- stage_mounts_room_recap: True
- stage_receives_ui_mode: True
- room_recap_uses_tooltip_region_classes: True
- room_recap_has_fact_list: True
- css_step29_present: True
- css_modal_styles_present: True
- css_recap_styles_present: True
- css_hides_old_active_panel: True
- css_braces_balanced: True
- page_braces_balanced: True
- brief_braces_balanced: True
- slot_braces_balanced: True
- picker_braces_balanced: True
- stage_braces_balanced: True
- recap_braces_balanced: True
- no_router_appshell_topbar_touched: True
- no_map_generator_touched: True
- no_supabase_backend_added: True

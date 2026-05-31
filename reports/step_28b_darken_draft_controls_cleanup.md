# Step 28b — Darken Draft Controls Cleanup

## Changed Files
- `features/darken-location/composer/components/LocationDraftControls.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## What Changed
- Removed all technical draft copy from `LocationDraftControls.jsx`.
- Removed browser/backend/storage/locality status text from the rendered JSX.
- Removed `location-draft-strip__main`, `location-draft-strip__scope`, and `location-draft-strip__status` from the component.
- Kept only the draft actions: `Save Draft`, `Load Draft`, `Clear Saved`, `Reset Current`.
- Kept `Load Draft` and `Clear Saved` disabled when no saved draft exists.
- Kept Simple mode behavior: `Clear Saved` and `Reset Current` are hidden.
- Added a narrow Step 28b CSS block for the now-native compact component.

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
- draft_jsx_braces_balanced: True
- draft_jsx_parens_balanced: True
- css_braces_balanced: True
- technical_copy_removed_from_jsx: True
- draft_main_removed: True
- draft_scope_removed: True
- draft_status_removed: True
- save_button_preserved: True
- load_button_preserved: True
- clear_button_preserved: True
- reset_button_preserved: True
- simple_mode_still_hides_clear_and_reset: True
- step28a_css_still_present: True
- step28b_css_present: True

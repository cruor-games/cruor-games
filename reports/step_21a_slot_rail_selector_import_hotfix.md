# Step 21a — Slot Rail Selector Import Hotfix

## Cause
`LocationSlotRail.jsx` imported `getComponentAssignment` and `isComponentAssignedToSlot` from `location-composer-state.js`, but those functions are exported by `location-composer-selectors.js`.

## Fix
- Removed both functions from the `location-composer-state.js` import.
- Added both functions to the `location-composer-selectors.js` import.

## Changed Files
- `features/darken-location/composer/components/LocationSlotRail.jsx`

## Validation
- state import no longer asks for getComponentAssignment: True
- state import no longer asks for isComponentAssignedToSlot: True
- selector import includes getComponentAssignment: True
- selector import includes isComponentAssignedToSlot: True
- slot rail still uses getComponentAssignment: True
- slot rail still uses isComponentAssignedToSlot: True
- page imports LocationSlotRail: True
- root remains location composer: True
- no Supabase/backend calls: True
- no monster-shell: True
- JS braces roughly balanced: True

# Step 27b — Restore Legacy workflowButtons Bridge

## Cause
Step 27 introduced `CrucibleTopbar`, but the router did not pass the hidden `#workflowButtons` node required by the legacy Crucible DOM runtime. The runtime still calls `addEventListener` on that node during `attachEvents()`.

## Fix
- Added `legacyWorkflowSlot` to the `CrucibleTopbar` call in `router.jsx`.
- Restored the hidden `#workflowButtons` node.
- Did not add visible UI.
- Did not change AppShell, CSS visuals, Darken internals, Monster internals, or backend code.

## Changed Files
- `app/router.jsx`

## Included For Baseline Integrity
- `app/AppShell.jsx`
- `app/app-shell.css`
- `features/crucible/components/CrucibleTopbar.jsx`

## Validation
- router passes legacyWorkflowSlot: True
- router restores #workflowButtons node: True
- workflowButtons has expected legacy classes: True
- CrucibleTopbar renders hidden legacy slot: True
- CSS hides legacy workflow slot: True
- router still uses CrucibleTopbar: True
- router still imports legacy Crucible renderer: True
- router still renders legacy Crucible in Darken panel: True
- router still renders MonsterComposerPage: True
- router still renders InspirationsPage: True
- AppShell keeps Patreon placeholder: True
- CSS keeps full AppShell visual rules: True
- CSS keeps Step 27 override: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no Supabase/backend calls added: True

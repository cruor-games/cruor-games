# Step 5.8c — Crucible CSS Border Token Fix

## Cause
The bad rule was in the legacy Crucible/Darken CSS uploaded as `styles.css`, not in the Monster/AppShell subset patched by the previous ZIP.

## Fix
- Added corrected `features/crucible/crucible.styles.css`.
- Also included `features/crucible/styles.css` as a compatibility copy in case the local import rename has not been applied.
- Replaced all `border*-color` uses of shorthand `--cruor-ui-*-border*` tokens with matching `*-color` tokens.

## Validation
- reported bad patterns removed everywhere: True
- no direct shorthand vars in border-color properties: True
- no alias resolving to shorthand in border-color properties: True
- no undefined cruor ui/z vars: True
- crucible css included: True
- legacy crucible styles copy included: True
- app css braces balanced: True
- monster css braces balanced: True
- crucible css braces balanced: True
- components css braces balanced: True
- border-color contexts audited: 51
- bad contexts after fix: 0
- direct bad vars after fix: 0
- reported patterns after fix: 0

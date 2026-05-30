# Step 5.8b — Border Token Context Fix

## Direct Fix
- Replaced every `border*-color: var(--cruor-ui-*-border*)` with the matching `*-color` token.
- Replaced the specific bad line with `border-top-color: var(--cruor-ui-panel-border-top-color);`.
- Restored corrected shared Cruor token block in `shared/styles/components.css`.

## Validation
- specific reported line removed: True
- no direct shorthand vars in border-color properties: True
- no alias resolving to shorthand in border-color properties: True
- no undefined cruor ui/z vars: True
- shared corrected tokens present: True
- app css braces balanced: True
- monster css braces balanced: True
- components css braces balanced: True

- border-color contexts audited: 17
- bad semantic contexts after fix: 0
- undefined Cruor UI/Z vars after fix: 0

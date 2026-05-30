# Step 5.8b — Semantic Border Token Cleanup

## Scope
- `app/main.jsx`
- `shared/styles/composer-primitives.css`
- `features/crucible/crucible.styles.css`
- `features/monster-composer/monster-composer.styles.css`

## Fix
- Replaced shorthand border tokens inside `border*-color` declarations.
- Converted the Crucible base card group from `border-color` to `border` where applicable.
- Converted the Crucible panel top group from `border-top-color` to `border-top` where applicable.
- Converted Monster border aliases used in color-only contexts into color aliases.
- Added missing shared `--cruor-z-*` primitives.

## Validation
- main imports composer primitives: True
- no features/crucible/styles.css generated: True
- no direct shorthand tokens in border-color contexts: True
- no border-color var resolves to shorthand: True
- exact reported bad patterns removed: True
- monster aliases are color aliases: True
- composer primitives uses color token for active card: True
- composer primitives uses color token for active control: True
- targeted undefined cruor ui/z vars clean: True
- css braces balanced: True
- replacements applied: 21
- border-color contexts audited: 41
- direct bad contexts after fix: 0
- semantic bad contexts after fix: 0

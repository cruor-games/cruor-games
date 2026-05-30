# Step 5.8 Restart — Composer Style Unification Audit

## Decision
Do not rewrite large feature CSS files. Add one shared primitive layer imported after feature CSS.

## Changed Files
- `app/main.jsx`
- `shared/styles/composer-primitives.css`

## Existing Files Not Replaced
- `features/crucible/crucible.styles.css`
- `features/monster-composer/monster-composer.styles.css`
- `shared/styles/components.css`
- `app/app-shell.css`

## Shared Primitive Scope
- Darken root: `#darkenComposerPanel [data-cruor-ui-mode] .app`
- Monster root: `#monsterComposerPanel .monster-shell`

## Normalized Families
- workspace width/grid
- panels
- slots/cards
- buttons/controls
- chips/meta badges
- app shell icon/text spacing
- Patreon sign-in visual style

## Validation
- new shared primitive CSS only: True
- main imports composer-primitives after app-shell: True
- darken root targeted: True
- monster root targeted: True
- workspace max shared: True
- panel tokens split: True
- card border-color uses color token: True
- control border-color uses color token: True
- no border-color resolves to shorthand: True
- css braces balanced: True

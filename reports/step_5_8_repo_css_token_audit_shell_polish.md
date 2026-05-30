# Step 5.8 — Repo CSS Token Semantic Audit + Shell Polish

## Audited CSS Files
- `app/app-shell.css`
- `features/monster-composer/monster-composer.styles.css`
- `shared/styles/components.css`

## Fixes
- Restored corrected shared Cruor UI token declarations in `shared/styles/components.css`.
- Replaced direct shorthand-token use inside `border-color` / `border-top-color` contexts.
- Repointed Monster Composer alias tokens used by `border-color` to color tokens.
- Restored icon-based AppShell navigation and Patreon placeholder markup.
- Added AppShell CSS layer for icon/text spacing and Patreon button styling.

## Validation
- semantic border-color audit clean: True
- no undefined cruor ui/z vars: True
- monster alias card soft is color: True
- monster alias card active is color: True
- monster alias shared card is color: True
- monster alias panel top is color: True
- shared tokens restored: True
- AppShell has icons: True
- AppShell has Patreon placeholder: True
- AppShell spacing css present: True
- AppShell icon gap present: True
- AppShell Patreon styled: True
- monster explicit import: True
- css braces balanced: True
- jsx braces roughly balanced: True

## Remaining Problems
- bad border-color semantic contexts: `0`
- undefined `--cruor-ui-*` / `--cruor-z-*` vars: `0`

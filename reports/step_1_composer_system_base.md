# Step 1 — Composer System Base + Monster Compatibility Root

## Changed Files
- `app/main.jsx`
- `features/monster-composer/monster-composer.page.jsx`
- `shared/styles/composer-system.css`

## Untouched Uploaded Files
- `features/monster-composer/monster-composer.styles.css`
- `shared/styles/components.css`

## What Changed
- Replaced the ambiguous `composer-primitives.css` import with `composer-system.css`.
- Added Monster compatibility root: `cruor-composer-shell monster-composer monster-shell`.
- Created a feature-agnostic shared composer primitive layer.
- Did not touch Darken.
- Did not remove `monster-shell` yet.
- Did not create or include `features/crucible/styles.css`.

## Validation
- main imports composer-system.css: True
- main no longer imports composer-primitives.css: True
- Monster root uses compatibility classes: True
- Monster still keeps monster-shell compatibility: True
- composer-system.css has no feature-specific selectors: True
- composer-system.css defines root shell primitive: True
- composer-system.css defines stage/rail/panel/card/slot/control primitives: True
- no semantic border-color shorthand regressions in audited files: True
- no features/crucible/styles.css generated: True
- css braces balanced: True
- forbidden selector terms in composer-system.css: 0
- semantic border-color shorthand regressions: 0

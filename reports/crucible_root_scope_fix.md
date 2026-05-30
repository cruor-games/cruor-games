# Crucible Root Scope Fix

## Cause

`features/crucible/crucible.styles.css` is scoped under `.monster-shell`, but `features/crucible/index.js` rendered the mount root without that class.

Darken markup such as `.build-slot`, `.sensory-subslot`, `.region-card`, `.source-card`, `.component-card`, and `.component-list-item` therefore did not match the active stylesheet.

## Fix

Changed only `features/crucible/index.js` and added:

```js
className: "monster-shell"
```

to the Crucible root element.

## Files intentionally not changed

- `features/crucible/crucible.styles.css`
- `features/crucible/styles.css`
- `shared/styles/components.css`
- `features/monster-composer/monster-composer.styles.css`
- `app/app-shell.css`

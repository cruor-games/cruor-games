# Step 4.14 — Visual Regression Pass

Scope: structural and cascade audit for the current AppShell, Crucible topbar, shared UI kit, Darken/Crucible CSS, Monster CSS, and Map CSS.

No replacement ZIP was generated because no safe visual hotfix was required.

## Inputs
- `app/router.jsx` — 10056 bytes — sha `95130b39e69e7f21`
- `app/app-shell.css` — 23259 bytes — sha `e799bae269f1365a`
- `features/crucible/components/CrucibleTopbar.jsx` — 3160 bytes — sha `6659ac5bdd05a86b`
- `shared/styles/components.css` — 25673 bytes — sha `4769674a1e766ded`
- `features/crucible/styles.css` — 153279 bytes — sha `d3ad4c5c58150b0d`
- `features/monster-composer/styles.css` — 153279 bytes — sha `d3ad4c5c58150b0d`
- `features/darken-location/map-generator/styles.css` — 32359 bytes — sha `01cf4f2587e3b2d2`

## Result
- Checks passed: **36/48**
- Checks failed: **12**

## Failed Checks
- `app/app-shell.css: preserves Step 4.13 — Topbar final consolidation` — 
- `shared/styles/components.css: preserves Step 4.12 — JSX utility adoption support` — 
- `features/crucible/styles.css: preserves Step 3.3 — Navigator width safety` — 
- `router exposes data-crucible-generator` — 
- `router exposes data-crucible-view` — 
- `topbar has generator group` — 
- `topbar has view group` — 
- `topbar labels generator controls` — 
- `topbar labels view controls` — 
- `CSS styles generator switch` — 
- `CSS styles view tabs` — 
- `Monster can report shared/internal topbar` — 

## Watch Items
- **Watch — app/app-shell.css.** .crucible-workspace__tabs is defined 2 times; expected from additive step layering, but future cleanup should merge it.
- **Watch — app/app-shell.css.** .app-shell__bar is defined 4 times; expected from additive step layering, but future cleanup should merge it.
- **Watch — app/app-shell.css.** .app-shell__nav is defined 4 times; expected from additive step layering, but future cleanup should merge it.
- **Watch — app/app-shell.css.** .darken-workspace__tab is defined 3 times; expected from additive step layering, but future cleanup should merge it.
- **Low — app/app-shell.css.** Topbar data-active-generator is available but only lightly used; future responsive tuning can use it more.
- **Process — uploads.** The three feature CSS files share the uploaded name styles.css; sandbox keeps only one at /mnt/data/styles.css. Continue using repository paths or ZIP extraction for multi-CSS steps.

## Pass Matrix
- `PASS` app/router.jsx: JSX/JS braces roughly balanced — 61 opens / 61 closes
- `PASS` app/app-shell.css: CSS braces balanced — 131 opens / 131 closes
- `PASS` features/crucible/components/CrucibleTopbar.jsx: JSX/JS braces roughly balanced — 26 opens / 26 closes
- `PASS` shared/styles/components.css: CSS braces balanced — 95 opens / 95 closes
- `PASS` features/crucible/styles.css: CSS braces balanced — 839 opens / 839 closes
- `PASS` features/monster-composer/styles.css: CSS braces balanced — 839 opens / 839 closes
- `PASS` features/darken-location/map-generator/styles.css: CSS braces balanced — 148 opens / 148 closes
- `PASS` features/monster-composer/monster-composer.page.jsx: JSX/JS braces roughly balanced — 605 opens / 605 closes
- `PASS` app/app-shell.css: preserves Step 4.4 — AppShell visual polish
- `FAIL` app/app-shell.css: preserves Step 4.13 — Topbar final consolidation
- `PASS` shared/styles/components.css: preserves Step 4.7 — Cross-tool surface primitives
- `PASS` shared/styles/components.css: preserves Step 4.8 — Slot/card alignment primitives
- `PASS` shared/styles/components.css: preserves Step 4.9 — Shared UI Kit consolidation contract
- `PASS` shared/styles/components.css: preserves Step 4.11 — CSS duplicate cleanup
- `FAIL` shared/styles/components.css: preserves Step 4.12 — JSX utility adoption support
- `FAIL` features/crucible/styles.css: preserves Step 3.3 — Navigator width safety
- `PASS` features/crucible/styles.css: preserves Step 4.9 — Shared UI Kit consolidation adoption
- `PASS` features/crucible/styles.css: preserves Step 4.11 — CSS duplicate cleanup
- `PASS` features/monster-composer/styles.css: preserves Step 4.5 — Disable legacy Monster pseudo-tooltips
- `PASS` features/monster-composer/styles.css: preserves Step 4.7 — Monster panels/sidebar alignment pass 1
- `PASS` features/monster-composer/styles.css: preserves Step 4.8 — Monster slots/cards alignment pass 2
- `PASS` features/monster-composer/styles.css: preserves Step 4.9 — Shared UI Kit consolidation adoption
- `PASS` features/monster-composer/styles.css: preserves Step 4.11 — CSS duplicate cleanup
- `PASS` features/darken-location/map-generator/styles.css: preserves Step 4.6 — Map inspector scrollbar normalization
- `PASS` features/darken-location/map-generator/styles.css: preserves Step 4.9 — Shared UI Kit consolidation adoption
- `PASS` features/darken-location/map-generator/styles.css: preserves Step 4.11 — CSS duplicate cleanup
- `FAIL` router exposes data-crucible-generator
- `FAIL` router exposes data-crucible-view
- `PASS` router defines generator list
- `PASS` router defines view list
- `PASS` router routes Monster through shared topbar
- `FAIL` topbar has generator group
- `FAIL` topbar has view group
- `FAIL` topbar labels generator controls
- `FAIL` topbar labels view controls
- `PASS` topbar keeps legacy workflow slot
- `FAIL` CSS styles generator switch
- `FAIL` CSS styles view tabs
- `FAIL` Monster can report shared/internal topbar
- `PASS` components exports panel surface
- `PASS` components exports card surface
- `PASS` components exports control surface
- `PASS` components exports chip surface
- `PASS` Crucible consumes UI Kit tokens
- `PASS` Monster consumes UI Kit tokens
- `PASS` Map consumes UI Kit tokens
- `PASS` Map has scrollbar normalization
- `PASS` Monster legacy pseudo-tooltip removed

## Recommended Next Work
1. Run the app and visually check Home, Crucible/Darken, Monster, Map, and Inspirations.
2. If no visual regressions appear, proceed to a targeted cleanup pass that merges additive CSS blocks in `app/app-shell.css` and eventually reduces legacy `darken-*` topbar selectors.
3. Keep using unique filenames or ZIPs for feature CSS files to avoid the recurring `styles.css` upload collision.

# Step 27a — Restore Full AppShell CSS

## Cause
Step 27 generated a shortened `app-shell.css`, dropping existing AppShell/Home visual rules. That broke the shell bar layout, the home title typography, and the home action card backgrounds.

## Fix
- Restored the full current `app-shell.css`.
- Re-applied only the Step 27 Crucible navigation override at the end.
- Left `AppShell.jsx`, `router.jsx`, and `CrucibleTopbar.jsx` unchanged from Step 27.

## Changed Files
- `app/app-shell.css`

## Included For Baseline Integrity
- `app/AppShell.jsx`
- `app/router.jsx`
- `features/crucible/components/CrucibleTopbar.jsx`

## Validation
- CSS restored full size: True
- CSS keeps AppShell visual polish: True
- CSS keeps Step 26 restart override: True
- CSS keeps homogeneous panel override: True
- CSS has Step 27 override: True
- CSS has app-shell__bar-inner grid display: True
- CSS has app-shell__bar-actions grid display: True
- CSS has home title font family: True
- CSS has home action dark background: True
- router still uses CrucibleTopbar: True
- router still renders Crucible legacy for Darken: True
- router still renders MonsterComposerPage: True
- AppShell keeps Patreon placeholder: True
- CrucibleTopbar has tool select: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no Supabase/backend calls added: True

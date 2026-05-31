# Step 26 Restart — AppShell + Home Minimal Pass

## Changed Files
- `app/AppShell.jsx`
- `app/app-shell.css`
- `app/router.jsx`

## Constraints Followed
- Patreon placeholder kept.
- Tool mounts preserved.
- Darken internals untouched.
- Monster internals untouched.
- Inspirations internals untouched.
- No Supabase/backend changes.

## What Changed
- Home now starts as the initial section.
- Home copy reduced to one main headline and three action cards.
- Long card explanations removed.
- AppShell brand eyebrow removed.
- Mode cluster converted to compact select.
- Patreon placeholder kept but visually compact.
- CSS changes are appended as a minimal override instead of replacing the full file, to reduce regression risk.

## Baseline Checks
- current router imports DarkenLocationComposerPage: True
- current router renders DarkenLocationComposerPage: True
- current router imports MonsterComposerPage: True
- current router imports InspirationsPage: True
- current AppShell contains Patreon placeholder: True
- current CSS contains darken workspace layout: True
- current Darken page root intact: True

## Validation
- router still imports DarkenLocationComposerPage: True
- router still renders DarkenLocationComposerPage: True
- router still passes uiMode to DarkenLocationComposerPage: True
- router still imports MonsterComposerPage: True
- router still imports InspirationsPage: True
- router starts on Home: True
- home copy is minimal: True
- home long copy removed: True
- AppShell keeps Patreon placeholder: True
- AppShell uses compact mode select: True
- AppShell old mode cluster removed from markup: True
- AppShell brand eyebrow removed from markup: True
- Darken page untouched root intact: True
- CSS has minimal override: True
- CSS keeps darken workspace section: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no Supabase/backend calls added: True

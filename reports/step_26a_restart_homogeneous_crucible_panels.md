# Step 26a Restart — Homogeneous Crucible Tool Panels

## Changed Files
- `app/app-shell.css`

## Included For Baseline Integrity
- `app/AppShell.jsx`
- `app/router.jsx`

## What Changed
- `#darkenComposerPanel` and `#monsterComposerPanel` now share the same width rule.
- Both panels now share the same outer border.
- Both panels now share the same outer background.
- Both panels now share the same outer shadow.
- Darken and Monster internal root backgrounds are normalized to transparent inside the shared frame.
- Monster internal topbar remains hidden so it does not duplicate the Crucible topbar.
- No page/component mount was changed.

## Validation
- router still imports DarkenLocationComposerPage: True
- router still renders DarkenLocationComposerPage: True
- router still imports MonsterComposerPage: True
- router still renders MonsterComposerPage: True
- AppShell keeps Patreon placeholder: True
- AppShell keeps compact mode select: True
- CSS has homogeneous panel block: True
- CSS frames both panels together: True
- CSS gives both panels same border: True
- CSS gives both panels same background: True
- CSS normalizes internal shell backgrounds: True
- CSS hides monster internal topbar: True
- CSS braces balanced: True
- JS braces roughly balanced: True
- no Supabase/backend calls added: True

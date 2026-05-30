# Step 5.8c — Safe Composer Primitives Hotfix

## Cause
- The previous `composer-primitives.css` was imported last and directly targeted feature DOM.
- It overrode `.workbench`, `.build-canvas`, `.navigator`, `.build-slot`, `.region-card`, and Monster equivalents.
- That broke Darken's existing layout/resizer and visually flattened the page.

## Fix
- Replaced `composer-primitives.css` with a safe layer.
- It now contains only shared tokens, z-index tokens, app-shell icon spacing, and Patreon button styling.
- It does not target Darken or Monster feature DOM directly.

## Validation
- composer primitives contains no direct feature selectors: True
- composer primitives still defines shared surface tokens: True
- composer primitives keeps app shell icon spacing: True
- composer primitives keeps patreon styling: True
- no border-color var resolves to shorthand: True
- no targeted undefined vars in safe layer: True
- css braces balanced: True
- forbidden direct feature selectors found: 0
- bad border-color contexts: 0
- undefined targeted vars: 0

# Step 12a — Output Export Syntax Hotfix

## Changed Files
- `features/darken-location/composer/model/location-composer-output.js`

## Cause
- Invalid syntax: `async export function copyTextToClipboard`.
- Correct syntax: `export async function copyTextToClipboard`.

## Validation
- bad async export removed: True
- copyTextToClipboard correctly exported: True
- file still exports compile helper: True
- file still exports JSON payload helper: True
- braces balanced: True

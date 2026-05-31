# Step 5 — MapViewport Preview Integration

## Changed Files
- `features/darken-location/composer/DarkenLocationComposerPage.jsx`
- `features/darken-location/composer/darken-location-composer.styles.css`

## Included Preserved Files
- `features/darken-location/darken-location.map-request.js`

## What Changed
- Mounted `MapViewport` in the Darken center stage as a live generated map preview.
- Generated preview config from the existing Darken `mapRequest`.
- Generated preview geometry with the map generator pipeline.
- Kept the occult board fallback for errors or unavailable geometry.
- Disabled editor mode for the embedded preview.
- Hid the internal MapViewport bottom bar in the composer preview.
- Preserved the Step 4 region/component map request contract.
- Did not modify Monster.
- Did not modify full Map Generator workspace files.

## Validation
- page imports map generator css: True
- page imports MapViewport directly: True
- page imports createConfigFromNormalizedMapRequest: True
- page imports generateMap: True
- preview disables editor mode: True
- preview disables props overlay: True
- preview renders map fallback: True
- preview catches pipeline errors: True
- stage passes generated map preview: True
- stage keeps location composer root: True
- no monster shell in updated files: True
- css hides map viewport internal bottom bar: True
- css lets region board overlay avoid blocking map except nodes: True
- map request keeps assigned components contract: True
- css braces balanced: True
- uploaded map page exports MapViewport: True
- uploaded map input exports createConfigFromNormalizedMapRequest: True
- uploaded map pipeline exports generateMap: True
- no border-color shorthand misuse in updated CSS: True

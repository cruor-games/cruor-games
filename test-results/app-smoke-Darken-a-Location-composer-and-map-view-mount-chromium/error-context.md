# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-smoke.spec.js >> Darken a Location composer and map view mount
- Location: tests\e2e\app-smoke.spec.js:29:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /haunted map board prototype/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /haunted map board prototype/i })

```

```yaml
- banner:
  - strong: Cruor Games
  - navigation "Primary sections":
    - button "Home"
    - button "Crucible"
    - button "Inspirations"
  - text: Interface mode
  - combobox "Interface mode":
    - option "Simple" [selected]
    - option "Advanced"
    - option "Debug"
  - button "Patreon" [disabled]
- main:
  - region "Crucible workspace":
    - region "Crucible workspace":
      - heading "I need to Crucible tool Darken a Location" [level=1]:
        - text: I need to Crucible tool
        - combobox "Crucible tool":
          - option "Darken a Location" [selected]
          - option "Build a Monster"
      - tablist "Darken a Location views":
        - tab "Composer" [selected]
        - tab "Map"
      - tabpanel "Composer":
        - heading "Darken a Location" [level=1]
        - region "Browser-local draft controls":
          - button "Save Draft"
          - button "Load Draft" [disabled]
        - complementary "Location frame":
          - heading "Darken the place before the party enters." [level=2]
          - text: Context
          - list "Location contexts":
            - button "Crypt"
            - button "Chapel"
            - button "Cave"
            - button "Mine"
            - button "Ruins"
            - button "Noble House"
            - button "Village"
            - button "Forest"
          - text: Horror Direction
          - list "Horror directions":
            - button "Religious Horror"
            - button "Body Horror"
            - button "Gothic"
            - button "Folk Horror"
            - button "Psychological Horror"
            - button "Cosmic Horror"
            - button "Disease Horror"
          - text: Source Anchors
          - button "Towers of Silence":
            - strong: Towers of Silence
          - button "Sedlec Ossuary":
            - strong: Sedlec Ossuary
          - button "Mortuary Totems":
            - strong: Mortuary Totems
          - button "Mustard Gas":
            - strong: Mustard Gas
          - button "The Mist":
            - strong: The Mist
          - button "Endocannibalism":
            - strong: Endocannibalism
          - button "Genetic Mutations":
            - strong: Genetic Mutations
          - button "Crucifixion":
            - strong: Crucifixion
          - text: Intrusion
          - list "Intrusion level":
            - button "Low"
            - button "Medium"
            - button "High"
        - main "Location map stage":
          - img "Generated Cruor location map": IN 1 2 3 4
          - button "Zoom In"
          - button "Zoom Out"
          - button "Fit Map"
          - text: 127% Wheel zooms. Drag pans. Arrow keys pan. + / - zoom. 0 or Home fits.
          - heading "Cursed Location Build" [level=2]
          - paragraph: Current Build
          - strong: No premise assigned yet
          - text: 0/7 slots filledActive room 1 · structure
          - button "Use Bone-Lit Vestibule as the active region target":
            - text: "01"
            - strong: Bone-Lit Vestibule
            - emphasis: Target
          - button "Use Soft-Floored Tunnel as the active region target":
            - text: "02"
            - strong: Soft-Floored Tunnel
            - emphasis: Synced
          - button "Use Skyless Ossuary Well as the active region target":
            - text: "03"
            - strong: Skyless Ossuary Well
            - emphasis: Synced
          - button "Use Fog-Return Corridor as the active region target":
            - text: "04"
            - strong: Fog-Return Corridor
            - emphasis: Synced
          - strong: 4 regions
          - strong: Synced
          - strong: 4/4
          - strong: "#1 · secret"
        - complementary "Location slots and components":
          - heading "Attach horror to the map." [level=2]
          - button "Open Map Workspace"
          - button "Premise 0/1":
            - text: Premise
            - strong: 0/1
          - button "Sensory Layer 0/3":
            - text: Sensory Layer
            - strong: 0/3
          - button "Visible Anomaly 0/2":
            - text: Visible Anomaly
            - strong: 0/2
          - button "Hazard 0/1":
            - text: Hazard
            - strong: 0/1
          - button "Clue 0/1":
            - text: Clue
            - strong: 0/1
          - button "Encounter Twist 0/1":
            - text: Encounter Twist
            - strong: 0/1
          - button "Outcome 0/1":
            - text: Outcome
            - strong: 0/1
          - heading "Premise" [level=2]
          - text: Next assignment
          - strong: Premise → Bone-Lit Vestibule
          - text: Compatible Components
          - strong: "2"
          - article:
            - text: Premise
            - emphasis: Available
            - strong: The Chapel Is Hungry
            - text: Assign Region
            - button "R1"
            - button "R2"
            - button "R3"
            - button "R4"
            - button "Add to Target"
          - article:
            - text: Premise
            - emphasis: Available
            - strong: The Bone Chapel Counts the Dead
            - text: Assign Region
            - button "R1"
            - button "R2"
            - button "R3"
            - button "R4"
            - button "Add to Target"
          - text: Default Region Target
          - strong: Bone-Lit Vestibule
          - text: Add to Target sends the active slot to Room 1 · structure
          - button "1"
          - button "2"
          - button "3"
          - button "4"
          - button "Regenerate Regions"
          - text: 1 matching region templates available.
          - heading "Bone-Lit Vestibule" [level=2]
          - strong: "0"
          - text: Generated Room → Session Insert
          - strong: Room 1
          - text: archivelevel 0structure
          - button "01Bone-Lit Vestibule":
            - text: "01"
            - strong: Bone-Lit Vestibule
          - button "02Soft-Floored Tunnel":
            - text: "02"
            - strong: Soft-Floored Tunnel
          - button "03Skyless Ossuary Well":
            - text: "03"
            - strong: Skyless Ossuary Well
          - button "04Fog-Return Corridor":
            - text: "04"
            - strong: Fog-Return Corridor
          - article: Feature
          - article: Interaction
          - article: Danger
          - article: Secret
          - article: Reward
          - article: Read-Aloud
          - text: Attached Components
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("home, crucible, and inspirations sections mount", async ({ page }) => {
  4  |   await page.goto("/");
  5  | 
  6  |   await expect(page.getByRole("banner").getByText("Cruor Games")).toBeVisible();
  7  | 
  8  |   await expect(
  9  |     page.getByRole("heading", {
  10 |       name: /build drop-in horror for the session you already prepared/i,
  11 |     })
  12 |   ).toBeVisible();
  13 | 
  14 |   await page.getByRole("button", { name: "Crucible" }).click();
  15 |   await expect(page.getByRole("heading", { name: /i need to/i })).toBeVisible();
  16 | 
  17 |   await page.getByRole("button", { name: "Inspirations" }).click();
  18 |   await expect(page.getByRole("main")).toContainText(/Inspirations|Source|Anchor/i);
  19 | 
  20 |   await page.getByRole("button", { name: "Home" }).click();
  21 | 
  22 |   await expect(
  23 |     page.getByRole("heading", {
  24 |       name: /build drop-in horror for the session you already prepared/i,
  25 |     })
  26 |   ).toBeVisible();
  27 | });
  28 | 
  29 | test("Darken a Location composer and map view mount", async ({ page }) => {
  30 |   await page.goto("/");
  31 | 
  32 |   await page.getByRole("button", { name: "Location" }).click();
  33 | 
  34 |   await expect(page.locator("[data-location-composer-ready='true']")).toBeVisible();
> 35 |   await expect(page.getByRole("heading", { name: /haunted map board prototype/i })).toBeVisible();
     |                                                                                     ^ Error: expect(locator).toBeVisible() failed
  36 | 
  37 |   await page.getByRole("tab", { name: "Map" }).click();
  38 | 
  39 |   await expect(page.locator("#darkenMapGeneratorPanel")).toBeVisible();
  40 |   await expect(page.locator("#darkenMapGeneratorPanel svg").first()).toBeVisible();
  41 | });
  42 | 
  43 | test("Build a Monster can start from scratch and open the graft navigator", async ({ page }) => {
  44 |   await page.goto("/");
  45 | 
  46 |   await page.getByRole("button", { name: "Monster" }).click();
  47 |   await expect(page.locator(".monster-shell")).toBeVisible();
  48 | 
  49 |   await page.getByRole("button", { name: /build from scratch/i }).click();
  50 |   await expect(page.locator(".monster-shell")).toHaveAttribute("data-composer-started", "true");
  51 | 
  52 |   await page
  53 |     .getByRole("button", { name: /focus body/i })
  54 |     .first()
  55 |     .click();
  56 | 
  57 |   const graftDialog = page.getByRole("dialog", { name: /choose body graft/i });
  58 |   await expect(graftDialog).toBeVisible();
  59 | 
  60 |   const firstAddButton = graftDialog.getByRole("button", { name: /^Add / }).first();
  61 |   await expect(firstAddButton).toBeVisible();
  62 |   await expect(firstAddButton).toBeEnabled();
  63 | 
  64 |   await firstAddButton.focus();
  65 |   await page.keyboard.press("Enter");
  66 | 
  67 |   await expect(graftDialog).toBeHidden();
  68 |   await expect(page.getByLabel("Selected graft inspector")).toContainText(/Installed/i);
  69 | });
  70 | 
```
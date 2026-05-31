# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-smoke.spec.js >> home, crucible, and inspirations sections mount
- Location: tests\e2e\app-smoke.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /i need to/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /i need to/i })

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
  - region "Home":
    - region "Build drop-in horror for the session you already prepared.":
      - heading "Build drop-in horror for the session you already prepared." [level=1]
      - button "Darken a Location Haunted regions and map":
        - strong: Darken a Location
        - text: Haunted regions and map
      - button "Build a Monster Body, pressure, weakness":
        - strong: Build a Monster
        - text: Body, pressure, weakness
      - button "Browse Inspirations Sources and motifs":
        - strong: Browse Inspirations
        - text: Sources and motifs
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("home, crucible, and inspirations sections mount", async ({ page }) => {
  4  |   await page.goto("/");
  5  | 
  6  |   await expect(page.getByRole("banner").getByText("Cruor Games")).toBeVisible();
> 7  |   await expect(page.getByRole("heading", { name: /i need to/i })).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  8  | 
  9  |   await page.getByRole("button", { name: "Home" }).click();
  10 |   await expect(page.getByRole("heading", { name: /drop-in horror workbenches/i })).toBeVisible();
  11 | 
  12 |   await page.getByRole("button", { name: "Inspirations" }).click();
  13 |   await expect(page.getByRole("main")).toContainText(/Inspirations|Source|Anchor/i);
  14 | 
  15 |   await page.getByRole("button", { name: "Crucible" }).click();
  16 |   await expect(page.getByRole("heading", { name: /i need to/i })).toBeVisible();
  17 | });
  18 | 
  19 | test("Darken a Location composer and map view mount", async ({ page }) => {
  20 |   await page.goto("/");
  21 | 
  22 |   await page.getByRole("button", { name: "Location" }).click();
  23 |   await expect(page.locator("[data-location-composer-ready='true']")).toBeVisible();
  24 |   await expect(page.getByRole("heading", { name: /haunted map board prototype/i })).toBeVisible();
  25 | 
  26 |   await page.getByRole("tab", { name: "Map" }).click();
  27 |   await expect(page.locator("#darkenMapGeneratorPanel")).toBeVisible();
  28 |   await expect(page.locator("#darkenMapGeneratorPanel svg").first()).toBeVisible();
  29 | });
  30 | 
  31 | test("Build a Monster can start from scratch and open the graft navigator", async ({ page }) => {
  32 |   await page.goto("/");
  33 | 
  34 |   await page.getByRole("button", { name: "Monster" }).click();
  35 |   await expect(page.locator(".monster-shell")).toBeVisible();
  36 | 
  37 |   await page.getByRole("button", { name: /build from scratch/i }).click();
  38 |   await expect(page.locator(".monster-shell")).toHaveAttribute("data-composer-started", "true");
  39 | 
  40 |   await page.getByRole("button", { name: /focus body/i }).first().click();
  41 |   await expect(page.getByRole("dialog", { name: /choose body graft/i })).toBeVisible();
  42 | 
  43 |   await page.getByRole("button", { name: /^Add / }).first().click();
  44 |   await expect(page.getByRole("dialog", { name: /choose body graft/i })).toBeHidden();
  45 |   await expect(page.getByLabel("Selected graft inspector")).toContainText(/Installed/i);
  46 | });
  47 | 
```
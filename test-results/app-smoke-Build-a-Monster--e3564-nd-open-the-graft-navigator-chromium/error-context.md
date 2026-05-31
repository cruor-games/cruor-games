# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-smoke.spec.js >> Build a Monster can start from scratch and open the graft navigator
- Location: tests\e2e\app-smoke.spec.js:31:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^Add / }).first()
    - locator resolved to <button type="button" class="component-toggle-btn" aria-label="Add Skin Slippage">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="darken-topbar__control-row crucible-topbar__control-row">…</div> from <div class="darken-workspace__topbar">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="darken-topbar__control-row crucible-topbar__control-row">…</div> from <div class="darken-workspace__topbar">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    53 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="darken-topbar__control-row crucible-topbar__control-row">…</div> from <div class="darken-workspace__topbar">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic "Cruor Games" [ref=e6]:
        - generic [ref=e8]: C
        - strong [ref=e10]: Cruor Games
      - generic [ref=e11]:
        - navigation "Primary sections" [ref=e12]:
          - button "Home" [ref=e13] [cursor=pointer]:
            - generic [ref=e14]: 
            - text: Home
          - button "Crucible" [ref=e15] [cursor=pointer]:
            - generic [ref=e16]: 
            - text: Crucible
          - button "Inspirations" [ref=e17] [cursor=pointer]:
            - generic [ref=e18]: 
            - text: Inspirations
        - generic [ref=e19]:
          - generic [ref=e20]: Interface mode
          - combobox "Interface mode" [ref=e21]:
            - option "Simple" [selected]
            - option "Advanced"
            - option "Debug"
          - button "Patreon" [disabled] [ref=e22] [cursor=pointer]:
            - generic [ref=e23]: 
            - text: Patreon
  - main [ref=e24]:
    - region "Crucible workspace" [ref=e25]:
      - region "Crucible workspace" [ref=e26]:
        - generic [ref=e28]:
          - heading "I need to Build a Monster" [level=1] [ref=e29]:
            - generic [ref=e30]: I need to
            - generic [ref=e31]: Build a Monster
          - generic [ref=e32]:
            - generic "Choose Crucible tool" [ref=e33]:
              - button "Location" [ref=e34] [cursor=pointer]:
                - generic: 
                - generic: Location
              - button "Monster" [pressed] [ref=e35] [cursor=pointer]:
                - generic: 
                - generic: Monster
            - generic "Build a Monster views" [ref=e36]:
              - button "Composer" [ref=e37] [cursor=pointer]:
                - generic: 
                - generic: Composer
        - tabpanel "Build a Monster composer" [ref=e38]:
          - main [ref=e40]:
            - region "The Crucible build canvas" [ref=e42]:
              - generic [ref=e43]:
                - generic [ref=e44]:
                  - heading "Cruor Zombie" [level=2] [ref=e45]
                  - generic "Current anatomy composer state" [ref=e46]:
                    - button "Open Monster Frame" [ref=e47] [cursor=pointer]:
                      - img [ref=e48]
                    - strong [ref=e49]: 0/9 Filled
                - generic "Build actions" [ref=e51]:
                  - button "Forge Monster" [ref=e52] [cursor=pointer]:
                    - img [ref=e53]
                    - text: Forge
                  - button "Open Component Navigator" [ref=e55] [cursor=pointer]:
                    - img [ref=e56]
                    - text: Components
                  - button "Start Over" [ref=e57] [cursor=pointer]:
                    - img [ref=e58]
              - region "Monster anatomy composer" [ref=e61]:
                - generic "Scratch build hint":
                  - strong: Empty Anatomy Frame
                  - generic: Click Body, Attack Pattern, or Weakness / Tell to install the first graft.
                - generic [ref=e63]:
                  - complementary "Left anatomy slots" [ref=e64]:
                    - article [ref=e65]:
                      - generic [ref=e67]:
                        - generic [ref=e68]: Pressure
                        - strong [ref=e69]: 0 / 16
                    - generic [ref=e71]:
                      - button "Focus Mind" [ref=e72] [cursor=pointer]:
                        - generic [ref=e73]:
                          - generic [ref=e74]:
                            - img [ref=e75]
                            - text: Mind
                          - strong [ref=e78]: —
                        - generic [ref=e79]:
                          - strong [ref=e80]: Empty Slot
                          - emphasis [ref=e81]: What drives its behavior.
                      - button "Focus Horror Feature" [ref=e82] [cursor=pointer]:
                        - generic [ref=e83]:
                          - generic [ref=e84]:
                            - img [ref=e85]
                            - text: Horror Feature
                          - strong [ref=e87]: —
                        - generic [ref=e88]:
                          - strong [ref=e89]: Empty Slot
                          - emphasis [ref=e90]: The memorable disturbing element.
                      - button "Focus Weakness / Tell" [ref=e91] [cursor=pointer]:
                        - generic [ref=e92]:
                          - generic [ref=e93]:
                            - img [ref=e94]
                            - text: Weakness / Tell
                          - strong [ref=e96]: —
                        - generic [ref=e97]:
                          - strong [ref=e98]: Empty Slot
                          - emphasis [ref=e99]: Counterplay and readability.
                      - button "Focus Death Effect" [ref=e100] [cursor=pointer]:
                        - generic [ref=e101]:
                          - generic [ref=e102]:
                            - img [ref=e103]
                            - text: Death Effect
                          - strong [ref=e108]: —
                        - generic [ref=e109]:
                          - strong [ref=e110]: Empty Slot
                          - emphasis [ref=e111]: What happens when it dies.
                  - generic "Interactive monster silhouette" [ref=e112]:
                    - generic [ref=e113]:
                      - img
                      - button "Zombie Silhouette. Open Monster Frame" [ref=e114] [cursor=pointer]
                      - button "Focus Body" [active] [pressed] [ref=e117] [cursor=pointer]:
                        - img [ref=e118]
                      - button "Focus Mind" [ref=e120] [cursor=pointer]:
                        - img [ref=e121]
                      - button "Focus Movement" [ref=e124] [cursor=pointer]:
                        - img [ref=e125]
                      - button "Focus Attack Pattern" [ref=e128] [cursor=pointer]:
                        - img [ref=e129]
                      - button "Focus Horror Feature" [ref=e134] [cursor=pointer]:
                        - img [ref=e135]
                      - button "Focus Combat Twist" [ref=e137] [cursor=pointer]:
                        - img [ref=e138]
                      - button "Focus Weakness / Tell" [ref=e141] [cursor=pointer]:
                        - img [ref=e142]
                      - button "Focus Death Effect" [ref=e144] [cursor=pointer]:
                        - img [ref=e145]
                      - button "Focus Lair / Scene Effect" [ref=e150] [cursor=pointer]:
                        - img [ref=e151]
                  - complementary "Right anatomy slots" [ref=e153]:
                    - article [ref=e154]:
                      - generic [ref=e156]:
                        - generic [ref=e157]: Complexity
                        - strong [ref=e158]: 0 / 8
                    - generic [ref=e160]:
                      - button "Focus Body" [pressed] [ref=e161] [cursor=pointer]:
                        - generic [ref=e162]:
                          - generic [ref=e163]:
                            - img [ref=e164]
                            - text: Body
                          - strong [ref=e166]: —
                        - generic [ref=e167]:
                          - strong [ref=e168]: Empty Slot
                          - emphasis [ref=e169]: What the creature physically is.
                      - button "Focus Attack Pattern" [ref=e170] [cursor=pointer]:
                        - generic [ref=e171]:
                          - generic [ref=e172]:
                            - img [ref=e173]
                            - text: Attack Pattern
                          - strong [ref=e178]: —
                        - generic [ref=e179]:
                          - strong [ref=e180]: Empty Slot
                          - emphasis [ref=e181]: Its main offensive loop.
                      - button "Focus Movement" [ref=e182] [cursor=pointer]:
                        - generic [ref=e183]:
                          - generic [ref=e184]:
                            - img [ref=e185]
                            - text: Movement
                          - strong [ref=e188]: —
                        - generic [ref=e189]:
                          - strong [ref=e190]: Empty Slot
                          - emphasis [ref=e191]: How it reaches the characters.
                      - button "Focus Combat Twist" [ref=e192] [cursor=pointer]:
                        - generic [ref=e193]:
                          - generic [ref=e194]:
                            - img [ref=e195]
                            - text: Combat Twist
                          - strong [ref=e198]: —
                        - generic [ref=e199]:
                          - strong [ref=e200]: Empty Slot
                          - emphasis [ref=e201]: The rule that changes the fight.
                  - generic "Bottom anatomy slot" [ref=e202]:
                    - button "Focus Lair / Scene Effect" [ref=e203] [cursor=pointer]:
                      - generic [ref=e204]:
                        - generic [ref=e205]:
                          - img [ref=e206]
                          - text: Lair / Scene Effect
                        - strong [ref=e208]: —
                      - generic [ref=e209]:
                        - strong [ref=e210]: Empty Slot
                        - emphasis [ref=e211]: Optional pressure from the environment.
              - region "Build flow" [ref=e212]:
                - generic [ref=e213]:
                  - generic [ref=e214]:
                    - strong [ref=e215]: Add Body
                    - paragraph [ref=e216]: Define what the creature physically is before choosing attacks.
                  - button "Open Body Slot" [ref=e217] [cursor=pointer]
                - navigation "Monster build progress" [ref=e218]:
                  - button "1 Start" [ref=e219] [cursor=pointer]:
                    - generic [ref=e220]: "1"
                    - generic [ref=e221]: Start
                  - button "2 Body" [ref=e222] [cursor=pointer]:
                    - generic [ref=e223]: "2"
                    - generic [ref=e224]: Body
                  - button "3 Attack" [ref=e225] [cursor=pointer]:
                    - generic [ref=e226]: "3"
                    - generic [ref=e227]: Attack
                  - button "4 Tell" [ref=e228] [cursor=pointer]:
                    - generic [ref=e229]: "4"
                    - generic [ref=e230]: Tell
                  - button "5 Complete" [ref=e231] [cursor=pointer]:
                    - generic [ref=e232]: "5"
                    - generic [ref=e233]: Complete
                  - button "6 Review" [ref=e234] [cursor=pointer]:
                    - generic [ref=e235]: "6"
                    - generic [ref=e236]: Review
                  - button "7 Export" [ref=e237] [cursor=pointer]:
                    - generic [ref=e238]: "7"
                    - generic [ref=e239]: Export
              - group "Selected graft inspector" [ref=e240]:
                - generic "Body Decomposition 4 Options" [ref=e241] [cursor=pointer]:
                  - heading "Body" [level=3] [ref=e243]:
                    - img [ref=e244]
                    - text: Body
                  - generic [ref=e246]:
                    - generic [ref=e247]: Decomposition
                    - strong [ref=e248]: 4 Options
            - dialog "Choose Body Graft" [ref=e249]:
              - button "Close Component Navigator" [ref=e250] [cursor=pointer]
              - complementary "Component Navigator" [ref=e251]:
                - generic [ref=e252]:
                  - generic [ref=e253]:
                    - heading "Choose Body Graft" [level=2] [ref=e254]
                    - paragraph [ref=e255]: Pick a graft for Body.
                  - button "Close Component Navigator" [ref=e256] [cursor=pointer]:
                    - img [ref=e257]
                - generic [ref=e261]:
                  - searchbox "Search components" [ref=e263]
                  - button "Filter components" [ref=e264] [cursor=pointer]:
                    - img [ref=e265]
                  - generic "Visible component count" [ref=e266]: "4"
                - region "Best picks for Body" [ref=e267]:
                  - generic [ref=e268]:
                    - strong [ref=e269]: Best Picks
                    - generic [ref=e270]: Body
                  - generic [ref=e271]:
                    - article [ref=e272]:
                      - generic [ref=e273]:
                        - generic [ref=e274]: Recommended
                        - button "Add" [ref=e275] [cursor=pointer]
                      - heading "Skin Slippage" [level=3] [ref=e276]
                      - generic [ref=e277]: Core Monster Composer
                      - paragraph [ref=e278]: Outer layers detach in wet sheets when the corpse is grabbed or struck.
                      - emphasis [ref=e279]: Pressure 0 · Complexity 0 · Counterplay Improves
                    - article [ref=e280]:
                      - generic [ref=e281]:
                        - generic [ref=e282]: Safe
                        - button "Add" [ref=e283] [cursor=pointer]
                      - heading "Swollen Corpse Vessel" [level=3] [ref=e284]
                      - generic [ref=e285]: Core Monster Composer
                      - paragraph [ref=e286]: The body is stretched tight with grave gas, purge fluid, and unstable pressure.
                      - emphasis [ref=e287]: Pressure +1 · Complexity 0 · DPR +2 · HP +12 · Counterplay Improves
                    - article [ref=e288]:
                      - generic [ref=e289]:
                        - generic [ref=e290]: Spicy
                        - button "Add" [ref=e291] [cursor=pointer]
                      - heading "Volatile Immobile Mass" [level=3] [ref=e292]
                      - generic [ref=e293]: Core Monster Composer
                      - paragraph [ref=e294]: The corpse is too swollen to walk and functions like a living explosive hazard.
                      - emphasis [ref=e295]: Pressure +3 · Complexity +1 · HP +28 · AC -1 · Counterplay Improves · Adds 1 warning
                - generic [ref=e296]:
                  - article [ref=e297]:
                    - button "Add Skin Slippage" [ref=e298] [cursor=pointer]:
                      - img [ref=e299]
                      - generic [ref=e300]: Add
                    - generic [ref=e302]:
                      - heading "Skin Slippage" [level=3] [ref=e303]
                      - generic [ref=e304]: Core Monster Composer
                    - paragraph [ref=e305]: Outer layers detach in wet sheets when the corpse is grabbed or struck.
                    - paragraph [ref=e306]: Pressure 0 · Complexity 0 · Counterplay Improves
                    - group [ref=e307]:
                      - generic "Details" [ref=e308] [cursor=pointer]
                  - article [ref=e309]:
                    - button "Add Swollen Corpse Vessel" [ref=e310] [cursor=pointer]:
                      - img [ref=e311]
                      - generic [ref=e312]: Add
                    - generic [ref=e314]:
                      - heading "Swollen Corpse Vessel" [level=3] [ref=e315]
                      - generic [ref=e316]: Core Monster Composer
                    - paragraph [ref=e317]: The body is stretched tight with grave gas, purge fluid, and unstable pressure.
                    - paragraph [ref=e318]: Pressure +1 · Complexity 0 · DPR +2 · HP +12 · Counterplay Improves
                    - group [ref=e319]:
                      - generic "Details" [ref=e320] [cursor=pointer]
                  - article [ref=e321]:
                    - button "Add Fresh Bloat Hide" [ref=e322] [cursor=pointer]:
                      - img [ref=e323]
                      - generic [ref=e324]: Add
                    - generic [ref=e326]:
                      - heading "Fresh Bloat Hide" [level=3] [ref=e327]
                      - generic [ref=e328]: Core Monster Composer
                    - paragraph [ref=e329]: The cadaver has only recently entered the bloating stage and still moves with heavy resilience.
                    - paragraph [ref=e330]: Pressure +3 · Complexity 0 · HP +18 · AC +2 · Counterplay Improves
                    - group [ref=e331]:
                      - generic "Details" [ref=e332] [cursor=pointer]
                  - article [ref=e333]:
                    - button "Add Volatile Immobile Mass" [ref=e334] [cursor=pointer]:
                      - img [ref=e335]
                      - generic [ref=e336]: Add
                    - generic [ref=e338]:
                      - heading "Volatile Immobile Mass" [level=3] [ref=e339]
                      - generic [ref=e340]: Core Monster Composer
                    - paragraph [ref=e341]: The corpse is too swollen to walk and functions like a living explosive hazard.
                    - paragraph [ref=e342]: Pressure +3 · Complexity +1 · HP +28 · AC -1 · Counterplay Improves · Adds 1 warning
                    - group [ref=e343]:
                      - generic "Details" [ref=e344] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("home, crucible, and inspirations sections mount", async ({ page }) => {
  4  |   await page.goto("/");
  5  | 
  6  |   await expect(page.getByRole("banner").getByText("Cruor Games")).toBeVisible();
  7  |   await expect(page.getByRole("heading", { name: /i need to/i })).toBeVisible();
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
> 43 |   await page.getByRole("button", { name: /^Add / }).first().click();
     |                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  44 |   await expect(page.getByRole("dialog", { name: /choose body graft/i })).toBeHidden();
  45 |   await expect(page.getByLabel("Selected graft inspector")).toContainText(/Installed/i);
  46 | });
  47 | 
```
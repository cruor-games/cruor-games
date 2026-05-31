import { expect, test } from "@playwright/test";

test("home, crucible, and inspirations sections mount", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner").getByText("Cruor Games")).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: /build drop-in horror for the session you already prepared/i,
    })
  ).toBeVisible();

  await page.getByRole("button", { name: "Crucible" }).click();
  await expect(page.getByRole("heading", { name: /i need to/i })).toBeVisible();

  await page.getByRole("button", { name: "Inspirations" }).click();
  await expect(page.getByRole("main")).toContainText(/Inspirations|Source|Anchor/i);

  await page.getByRole("button", { name: "Home" }).click();

  await expect(
    page.getByRole("heading", {
      name: /build drop-in horror for the session you already prepared/i,
    })
  ).toBeVisible();
});

test("Darken a Location composer and map view mount", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Location" }).click();

  await expect(page.locator("[data-location-composer-ready='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: /haunted map board prototype/i })).toBeVisible();

  await page.getByRole("tab", { name: "Map" }).click();

  await expect(page.locator("#darkenMapGeneratorPanel")).toBeVisible();
  await expect(page.locator("#darkenMapGeneratorPanel svg").first()).toBeVisible();
});

test("Build a Monster can start from scratch and open the graft navigator", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Monster" }).click();
  await expect(page.locator(".monster-shell")).toBeVisible();

  await page.getByRole("button", { name: /build from scratch/i }).click();
  await expect(page.locator(".monster-shell")).toHaveAttribute("data-composer-started", "true");

  await page
    .getByRole("button", { name: /focus body/i })
    .first()
    .click();

  const graftDialog = page.getByRole("dialog", { name: /choose body graft/i });
  await expect(graftDialog).toBeVisible();

  const firstAddButton = graftDialog.getByRole("button", { name: /^Add / }).first();
  await expect(firstAddButton).toBeVisible();
  await expect(firstAddButton).toBeEnabled();

  await firstAddButton.focus();
  await page.keyboard.press("Enter");

  await expect(graftDialog).toBeHidden();
  await expect(page.getByLabel("Selected graft inspector")).toContainText(/Installed/i);
});

import { expect, test } from "@playwright/test";

// SC-006: once the room is drawn, an idle scene must not redraw at all.
test("0 redraws/second while idle", async ({ page }) => {
  await page.goto("/");
  const debug = page.locator("#debug");
  await expect(debug).toHaveText(/redraws: [1-9]/);

  const first = await debug.textContent();
  await page.waitForTimeout(3000);
  expect(await debug.textContent()).toBe(first);
});

import { type Page, expect, test } from "@playwright/test";

interface Obj {
  id: string;
  quickAction?: string;
  visualState: string;
  x: number;
  y: number;
}

interface Hook {
  objects(): Obj[];
  camera(): { level: number; x: number; y: number };
}

const objects = (page: Page): Promise<Obj[]> =>
  page.evaluate(() => (window as unknown as { __isoHome: Hook }).__isoHome.objects());
const camera = (page: Page) =>
  page.evaluate(() => (window as unknown as { __isoHome: Hook }).__isoHome.camera());
const ready = (page: Page) => page.waitForFunction(() => "__isoHome" in window);
const find = async (page: Page, id: string): Promise<Obj> =>
  (await objects(page)).find((o) => o.id === id) as Obj;

/** Dispatches synthetic touch pointer events on the canvas (for two-finger pinch). */
const touch = (page: Page, type: string, pointerId: number, x: number, y: number) =>
  page.evaluate(
    ([type, pointerId, x, y]) => {
      const c = document.querySelector("canvas") as HTMLCanvasElement;
      const r = c.getBoundingClientRect();
      c.dispatchEvent(
        new PointerEvent(type as string, {
          pointerId: pointerId as number,
          pointerType: "touch",
          clientX: r.left + (x as number),
          clientY: r.top + (y as number),
          bubbles: true,
        }),
      );
    },
    [type, pointerId, x, y] as const,
  );

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await ready(page);
});

test("canvas disables native touch scrolling (FR-013)", async ({ page }) => {
  expect(await page.locator("canvas").evaluate((c) => getComputedStyle(c).touchAction)).toBe(
    "none",
  );
});

test("tap opens the info panel for a device", async ({ page }) => {
  const tv = await find(page, "tv-1");
  await page.mouse.click(tv.x, tv.y);
  await expect(page.locator("#info-panel")).toContainText("media_player.tv");
});

test("long-press on a quick-action lamp toggles it without a panel", async ({ page }) => {
  const lamp = await find(page, "lamp-1");
  expect(lamp.visualState).toBe("off");
  await page.mouse.move(lamp.x, lamp.y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await expect.poll(async () => (await find(page, "lamp-1")).visualState).toBe("on");
  await expect(page.locator("#info-panel")).toBeHidden();
});

test("a failed quick action rolls the lamp back", async ({ page }) => {
  await page.getByLabel("fail next quick action").check();
  const lamp = await find(page, "lamp-1");
  await page.mouse.move(lamp.x, lamp.y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await expect.poll(async () => (await find(page, "lamp-1")).visualState).toBe("off");
});

test("long-press on a device without a quick action opens the panel", async ({ page }) => {
  const tv = await find(page, "tv-1");
  await page.mouse.move(tv.x, tv.y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await expect(page.locator("#info-panel")).toBeVisible();
});

test("a pack with a forbidden quick action is tap-only and logs a message", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (m) => messages.push(m.text()));
  await page.goto("/?bad-pack");
  await ready(page);
  expect(await objects(page)).toHaveLength(6);
  expect((await find(page, "bad-1")).quickAction).toBeUndefined();
  expect(messages.some((m) => m.includes("quick action rejected"))).toBe(true);
});

test("one-finger drag pans the scene", async ({ page }) => {
  const before = await camera(page);
  await page.mouse.move(100, 400);
  await page.mouse.down();
  await page.mouse.move(160, 430, { steps: 5 });
  await page.mouse.up();
  const after = await camera(page);
  expect(after.x - before.x).toBeCloseTo(60, 0);
  expect(after.y - before.y).toBeCloseTo(30, 0);
});

test("pinch zooms in an integer step and double-tap recenters", async ({ page }) => {
  const start = await camera(page);
  await touch(page, "pointerdown", 1, 300, 300);
  await touch(page, "pointerdown", 2, 400, 300);
  await touch(page, "pointermove", 2, 500, 300);
  await touch(page, "pointerup", 2, 500, 300);
  await touch(page, "pointerup", 1, 300, 300);
  expect((await camera(page)).level).toBe(1);

  await page.mouse.dblclick(50, 500);
  const end = await camera(page);
  expect(end.level).toBe(0);
  expect(end.x).toBeCloseTo(start.x, 3);
});

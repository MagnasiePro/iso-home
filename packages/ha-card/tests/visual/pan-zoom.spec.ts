import { expect, test } from "@playwright/test";

// SC-007: panning and zooming stay usable on a tablet profile with the CPU
// throttled 4x (research.md §8). The playground renders through the same
// core surface as the card.
test("pan then pinch-zoom on a 4x-throttled tablet matches the reference", async ({
  page,
  context,
}) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/");
  await page.waitForFunction(() => "__isoHome" in window);
  // Overlays (debug counter, mock toggles) are not part of the scene reference.
  await page.addStyleTag({ content: "body > div:not(#app){visibility:hidden}" });

  await page.mouse.move(200, 500);
  await page.mouse.down();
  await page.mouse.move(260, 520, { steps: 10 });
  await page.mouse.up();

  const touch = (type: string, pointerId: number, x: number, y: number) =>
    page.evaluate(
      ([type, pointerId, x, y]) => {
        const canvas = document.querySelector("canvas") as HTMLCanvasElement;
        canvas.dispatchEvent(
          new PointerEvent(type as string, {
            pointerId: pointerId as number,
            pointerType: "touch",
            clientX: x as number,
            clientY: y as number,
            bubbles: true,
          }),
        );
      },
      [type, pointerId, x, y] as const,
    );
  await touch("pointerdown", 1, 300, 500);
  await touch("pointerdown", 2, 400, 500);
  await touch("pointermove", 2, 520, 500);
  await touch("pointerup", 2, 520, 500);
  await touch("pointerup", 1, 300, 500);

  const level = await page.evaluate(
    () =>
      (window as unknown as { __isoHome: { camera(): { level: number } } }).__isoHome.camera()
        .level,
  );
  expect(level).toBe(1);
  await expect(page.locator("canvas")).toHaveScreenshot("pan-zoom.png");
});

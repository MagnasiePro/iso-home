import { mergeHomeModel } from "@iso-home/core-model";
import {
  IdleRenderLoop,
  buildRoomScene,
  createApp,
  fitRoomToViewport,
} from "@iso-home/core-render";
import { extractFromSvg, toRoom } from "@iso-home/importer-magicplan";
// Synthetic test fixture — see fixtures/magicplan/README.md and docs/adr/0001.
// Real room name/device list are still-to-come configuration data (spec.md Assumptions).
import sampleRoomSvg from "../../../fixtures/magicplan/sample-room.svg?raw";

async function main(): Promise<void> {
  const appContainer = document.getElementById("app");
  const debugEl = document.getElementById("debug");
  if (appContainer === null || debugEl === null) {
    throw new Error("Missing #app or #debug element in index.html");
  }
  const debugElement: HTMLElement = debugEl;

  // Milestone 1: importer output merged with an (empty, for now) hand-written
  // device list, proving the merge contract end-to-end (FR-002). Devices are
  // wired up visually in Milestone 2 (US2).
  const geometry = extractFromSvg(sampleRoomSvg);
  const room = toRoom("Living Room", geometry);
  const homeModel = mergeHomeModel([room], []);

  const app = await createApp({ width: window.innerWidth, height: window.innerHeight });
  appContainer.appendChild(app.canvas);

  const firstRoom = homeModel.rooms[0];
  if (firstRoom === undefined) {
    throw new Error("HomeModel has no rooms to render");
  }

  const sceneContainer = buildRoomScene(firstRoom);
  app.stage.addChild(sceneContainer);
  fitRoomToViewport(sceneContainer, firstRoom, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Pixi's Application ticker renders continuously by default; stop it and
  // drive rendering ourselves through IdleRenderLoop so idle = 0 redraws/sec
  // (FR-008, SC-006).
  app.stop();
  const idleLoop = new IdleRenderLoop(() => app.render());

  let lastShownCount = -1;
  function frame(): void {
    idleLoop.tick();
    const count = idleLoop.getRedrawCount();
    if (count !== lastShownCount) {
      debugElement.textContent = `redraws: ${count}`;
      lastShownCount = count;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    fitRoomToViewport(sceneContainer, firstRoom, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    idleLoop.requestRender();
  });
}

main().catch((error: unknown) => {
  console.error(error);
  const debugEl = document.getElementById("debug");
  if (debugEl !== null) {
    debugEl.textContent = `error: ${error instanceof Error ? error.message : String(error)}`;
  }
});

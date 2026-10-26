import { mergeHomeModel } from "@iso-home/core-model";
import {
  Camera,
  IdleRenderLoop,
  buildObjectSprites,
  buildRoomScene,
  createApp,
  loadPacks,
} from "@iso-home/core-render";
import { extractFromSvg, toRoom } from "@iso-home/importer-magicplan";
import { Assets, type Texture } from "pixi.js";
// Synthetic test fixture — see fixtures/magicplan/README.md and docs/adr/0001.
// Real room name/device list are still-to-come configuration data (spec.md Assumptions).
import sampleRoomSvg from "../../../fixtures/magicplan/sample-room.svg?raw";
import { badPack, badPackDevice, liveEntities, sampleDevices } from "./devices.js";
import { startLiveMode } from "./live-mode.js";
import { startMockMode } from "./mock-mode.js";

const manifests = Object.values(
  import.meta.glob("../../../packs/base/*/manifest.json", { eager: true, import: "default" }),
);
const spriteUrls = import.meta.glob("../../../packs/base/*/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Loads every pack sprite, keyed by file name (unique across the base pack). */
async function loadTextures(): Promise<Map<string, Texture>> {
  const textures = new Map<string, Texture>();
  for (const [path, url] of Object.entries(spriteUrls)) {
    const texture = await Assets.load<Texture>(url);
    texture.source.scaleMode = "nearest";
    textures.set(path.split("/").pop() as string, texture);
  }
  return textures;
}

async function main(): Promise<void> {
  const appContainer = document.getElementById("app");
  const debugEl = document.getElementById("debug");
  if (appContainer === null || debugEl === null) {
    throw new Error("Missing #app or #debug element in index.html");
  }
  const debugElement: HTMLElement = debugEl;

  // Importer output merged with the hand-written device list (FR-002).
  const withBadPack = new URLSearchParams(location.search).has("bad-pack");
  const geometry = extractFromSvg(sampleRoomSvg);
  const room = toRoom("Living Room", geometry);
  const isLive = import.meta.env.MODE === "live";
  const devices = isLive
    ? sampleDevices.map((d) => {
        const entityId = liveEntities[d.id];
        return entityId === undefined ? d : { ...d, entityId };
      })
    : sampleDevices;
  const homeModel = mergeHomeModel([room], withBadPack ? [...devices, badPackDevice] : devices);
  const packs = loadPacks(withBadPack ? [...manifests, badPack] : manifests);
  const textures = await loadTextures();
  const texture = (_pack: unknown, frame: string): Texture => textures.get(frame) as Texture;

  const app = await createApp({ width: window.innerWidth, height: window.innerHeight });
  appContainer.appendChild(app.canvas);

  const firstRoom = homeModel.rooms[0];
  if (firstRoom === undefined) {
    throw new Error("HomeModel has no rooms to render");
  }

  const sceneContainer = buildRoomScene(firstRoom);
  app.stage.addChild(sceneContainer);
  const items = buildObjectSprites(homeModel.objects, packs, texture);
  for (const item of items) sceneContainer.addChild(item.sprite);

  const camera = new Camera(sceneContainer, firstRoom, () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  camera.refit();

  // Pixi's Application ticker renders continuously by default; stop it and
  // drive rendering ourselves through IdleRenderLoop so idle = 0 redraws/sec
  // (FR-008, SC-006).
  app.stop();
  const idleLoop = new IdleRenderLoop(() => app.render());

  const modeOptions = { app, world: sceneContainer, items, camera, loop: idleLoop, texture };
  if (isLive) await startLiveMode(modeOptions);
  else startMockMode(modeOptions);

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
    camera.refit();
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

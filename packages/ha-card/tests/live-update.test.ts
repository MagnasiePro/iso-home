import { type PlacedObject, validateElementPack } from "@iso-home/core-model";
import {
  ConnectionState,
  IdleRenderLoop,
  attachInteractions,
  buildObjectSprites,
} from "@iso-home/core-render";
import { Container, Texture } from "pixi.js";
import { describe, expect, it } from "vitest";
import { diffEntities } from "../src/entity-diff.js";
import type { HassEntity } from "../src/hass.js";

const lampPack = validateElementPack({
  id: "floor-lamp",
  type: "floor-lamp",
  footprint: { width: 1, height: 1 },
  sprites: { off: "off.png", on: "on.png" },
  stateMap: { on: "on", off: "off" },
  quickAction: { service: "light.toggle" },
});
if (lampPack.ok !== true) throw new Error("fixture pack invalid");
const pack = lampPack.pack;

const lamp: PlacedObject = {
  id: "lamp-1",
  type: "floor-lamp",
  roomId: "r",
  position: { x: 1.5, y: 0.5 },
  rotation: 0,
  entityId: "light.lamp",
};

function setup() {
  const items = buildObjectSprites([lamp], new Map([["floor-lamp", pack]]), () => Texture.EMPTY);
  const world = new Container();
  for (const item of items) world.addChild(item.sprite);
  const connection = new ConnectionState();
  const interactions = attachInteractions({
    canvas: new EventTarget() as unknown as HTMLCanvasElement,
    stage: new Container(),
    items,
    camera: { refit() {}, pan() {}, zoomStep() {}, level: 0 } as never,
    texture: () => Texture.EMPTY,
    loop: new IdleRenderLoop(() => {}),
    connection,
    onOpenDevice() {},
    onQuickAction: async () => {},
  });
  return { items, interactions, connection };
}

describe("live state update (SC-002)", () => {
  it("reflects a simulated HA state change in the sprite well within 1 second", () => {
    const { items, interactions } = setup();
    const last = new Map<string, HassEntity | undefined>();
    const hassStates = { "light.lamp": { state: "on", attributes: { brightness: 200 } } };

    const startedAt = performance.now();
    for (const [id, entity] of diffEntities(last, hassStates, ["light.lamp"])) {
      interactions.applyEntityState(id, entity.state, entity.attributes);
    }

    expect(items[0]?.state.visualState).toBe("on");
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });

  it("ignores unchanged and unwatched entities", () => {
    const last = new Map<string, HassEntity | undefined>();
    const states = {
      "light.lamp": { state: "on", attributes: {} },
      "light.other": { state: "on", attributes: {} },
    };
    expect(diffEntities(last, states, ["light.lamp"])).toHaveLength(1);
    expect(diffEntities(last, states, ["light.lamp"])).toHaveLength(0);
  });

  it("dims every sprite while reconnecting and restores on reconnect (FR-017)", () => {
    const { items, connection } = setup();
    connection.setStatus("reconnecting");
    expect(items[0]?.sprite.alpha).toBeLessThan(1);
    expect(items[0]?.state.stale).toBe(true);
    connection.setStatus("connected");
    expect(items[0]?.sprite.alpha).toBe(1);
    expect(items[0]?.state.stale).toBe(false);
  });
});

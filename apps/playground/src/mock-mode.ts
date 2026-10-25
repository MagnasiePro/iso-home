import {
  type Camera,
  type IdleRenderLoop,
  type RenderedObject,
  attachInteractions,
} from "@iso-home/core-render";
import type { TextureResolver } from "@iso-home/core-render";
import type { Application } from "pixi.js";
import type { Container } from "pixi.js";

export interface MockModeOptions {
  app: Application;
  world: Container;
  items: RenderedObject[];
  camera: Camera;
  loop: IdleRenderLoop;
  texture: TextureResolver;
}

const initialStates: Record<string, string> = {
  "light.floor_lamp": "off",
  "light.ceiling": "off",
  "media_player.tv": "off",
  "media_player.speaker": "off",
};
const QUICK_ACTION_LATENCY_MS = 250;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: string,
  text = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  node.textContent = text;
  return node;
}

/**
 * Mock mode (Milestone 2): simulated entity states, a stand-in info panel on
 * tap, and debug toggles to flip a state "from outside" or fail the next call.
 */
export function startMockMode(opts: MockModeOptions): void {
  const states = new Map(Object.entries(initialStates));
  let failNext = false;

  const panel = el(
    "div",
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:none;padding:12px 16px;background:#2a211a;color:#e8dcc2;font:14px monospace;border-radius:8px;gap:12px;align-items:center",
  );
  panel.id = "info-panel";
  const close = el("button", "min-width:44px;min-height:44px", "Close");
  close.addEventListener("click", () => {
    panel.style.display = "none";
  });
  const label = el("span", "");
  panel.append(label, close);

  const debug = el(
    "div",
    "position:fixed;top:8px;right:8px;display:flex;flex-direction:column;gap:4px;font:12px monospace;color:#e8dcc2;background:rgba(0,0,0,.5);padding:6px 8px;border-radius:4px",
  );
  const failBox = el("input", "");
  failBox.type = "checkbox";
  failBox.addEventListener("change", () => {
    failNext = failBox.checked;
  });
  const failLabel = el("label", "");
  failLabel.append(failBox, " fail next quick action");
  debug.append(failLabel);

  document.body.append(panel, debug);

  const interactions = attachInteractions({
    canvas: opts.app.canvas,
    stage: opts.app.stage,
    items: opts.items,
    camera: opts.camera,
    texture: opts.texture,
    loop: opts.loop,
    onOpenDevice(item) {
      const id = item.object.entityId ?? item.object.id;
      label.textContent = `${id}: ${states.get(id) ?? "unknown"}`;
      panel.style.display = "flex";
    },
    async onQuickAction(item) {
      await new Promise((r) => setTimeout(r, QUICK_ACTION_LATENCY_MS));
      if (failNext) {
        failBox.checked = false;
        failNext = false;
        throw new Error("mock service call failed");
      }
      const id = item.object.entityId as string;
      states.set(id, states.get(id) === "on" ? "off" : "on");
    },
  });

  for (const [entityId, state] of states) {
    interactions.applyEntityState(entityId, state);
    const toggle = el("button", "min-height:32px", `toggle ${entityId}`);
    toggle.addEventListener("click", () => {
      const next = states.get(entityId) === "on" ? "off" : "on";
      states.set(entityId, next);
      interactions.applyEntityState(entityId, next);
    });
    debug.append(toggle);
  }

  // Read-only hook for the Playwright gesture spec.
  (window as unknown as { __isoHome: unknown }).__isoHome = {
    camera: () => ({
      level: opts.camera.level,
      x: opts.world.position.x,
      y: opts.world.position.y,
      scale: opts.world.scale.x,
    }),
    objects: () =>
      opts.items.map((i) => {
        const b = i.sprite.getBounds();
        return {
          id: i.object.id,
          entityId: i.object.entityId,
          quickAction: i.pack.quickAction?.service,
          visualState: i.state.visualState,
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
        };
      }),
  };
}

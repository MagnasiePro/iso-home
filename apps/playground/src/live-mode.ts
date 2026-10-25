import { ConnectionState, attachInteractions } from "@iso-home/core-render";
import {
  callService,
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
} from "home-assistant-js-websocket";
import type { MockModeOptions } from "./mock-mode.js";

const BRIGHTNESS_MAX = 255;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text = "") {
  const node = document.createElement(tag);
  node.style.cssText = css;
  node.textContent = text;
  return node;
}

/**
 * Live mode (Milestone 3): a real Home Assistant websocket. The token comes
 * only from `.env.local` (`VITE_HA_TOKEN`) and never leaves this dev tool.
 * Entity ids in `devices.ts` must match the real instance.
 */
export async function startLiveMode(opts: MockModeOptions): Promise<void> {
  const url = import.meta.env.VITE_HA_URL as string | undefined;
  const token = import.meta.env.VITE_HA_TOKEN as string | undefined;
  if (!url || !token) {
    throw new Error("Live mode needs VITE_HA_URL and VITE_HA_TOKEN in apps/playground/.env.local");
  }

  const connection = await createConnection({ auth: createLongLivedTokenAuth(url, token) });
  const status = new ConnectionState();
  connection.addEventListener("ready", () => status.setStatus("connected"));
  connection.addEventListener("disconnected", () => status.setStatus("reconnecting"));

  const panel = el(
    "div",
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:none;gap:8px;align-items:center;padding:12px 16px;background:#2a211a;color:#e8dcc2;font:14px monospace;border-radius:8px",
  );
  panel.id = "info-panel";
  document.body.append(panel);

  const interactions = attachInteractions({
    canvas: opts.app.canvas,
    stage: opts.app.stage,
    items: opts.items,
    camera: opts.camera,
    texture: opts.texture,
    loop: opts.loop,
    connection: status,
    onOpenDevice(item) {
      const entityId = item.object.entityId as string;
      const [domain = ""] = entityId.split(".");
      const call = (service: string, data: Record<string, unknown> = {}) =>
        callService(connection, domain, service, { entity_id: entityId, ...data });

      const close = el("button", "min-width:44px;min-height:44px", "Close");
      close.addEventListener("click", () => {
        panel.style.display = "none";
      });
      const on = el("button", "min-width:44px;min-height:44px", "On");
      on.addEventListener("click", () => void call("turn_on"));
      const off = el("button", "min-width:44px;min-height:44px", "Off");
      off.addEventListener("click", () => void call("turn_off"));
      panel.replaceChildren(el("span", "", entityId), on, off);
      if (domain === "light") {
        const slider = el("input", "width:120px");
        slider.type = "range";
        slider.min = "1";
        slider.max = String(BRIGHTNESS_MAX);
        slider.addEventListener(
          "change",
          () => void call("turn_on", { brightness: +slider.value }),
        );
        panel.append(slider);
      }
      panel.append(close);
      panel.style.display = "flex";
    },
    async onQuickAction(item, service) {
      const [domain = "", name = ""] = service.split(".");
      await callService(connection, domain, name, { entity_id: item.object.entityId });
    },
  });

  subscribeEntities(connection, (entities) => {
    for (const item of opts.items) {
      const id = item.object.entityId;
      const entity = id === undefined ? undefined : entities[id];
      if (id !== undefined && entity !== undefined) {
        interactions.applyEntityState(id, entity.state, entity.attributes);
      }
    }
  });
}

import type { Point } from "@iso-home/core-model";
import { type Container, Graphics } from "pixi.js";
import type { ConnectionState } from "./connection-state.js";
import { GestureRecognizer, LONG_PRESS_MS } from "./gestures.js";
import { haloStyle, updateHalo } from "./halo.js";
import { type HitTarget, pickTarget } from "./hit-area.js";
import { type RenderedObject, type TextureResolver, refreshSprite } from "./objects.js";
import type { IdleRenderLoop } from "./render-loop.js";
import {
  applyOptimistic,
  clearError,
  confirm,
  optimisticVisualState,
  resolveVisualState,
  rollback,
} from "./sprite-state.js";
import type { Camera } from "./viewport.js";

export interface InteractionOptions {
  canvas: HTMLCanvasElement;
  /** Screen-space container for overlays (the progress ring), not the panned world. */
  stage: Container;
  items: RenderedObject[];
  camera: Camera;
  texture: TextureResolver;
  loop: IdleRenderLoop;
  /** When given, every sprite dims while the status is not "connected" (FR-017). */
  connection?: ConnectionState;
  /** Tap, or a long-press on a device without a quick action (spec US2 scenario 1). */
  onOpenDevice(item: RenderedObject): void;
  /** Resolves on HA confirmation, rejects on failure (rolled back). */
  onQuickAction(item: RenderedObject, service: string): Promise<void>;
}

export interface Interactions {
  /** Reconciles an item with a real entity state (FR-007). */
  applyEntityState(entityId: string, haState: string, attributes?: Record<string, unknown>): void;
  dispose(): void;
}

const ERROR_FLASH_MS = 400;
const RING_RADIUS = 24;
const STALE_ALPHA = 0.4;

export function attachInteractions(opts: InteractionOptions): Interactions {
  const { canvas, items, camera, texture, loop, stage } = opts;
  const ring = new Graphics();
  ring.visible = false;
  stage.addChild(ring);
  let ringFrame = 0;

  const byId = new Map(items.map((i) => [i.object.id, i]));

  function itemAt(p: Point): RenderedObject | undefined {
    const targets: HitTarget[] = items.map((i) => {
      const b = i.sprite.getBounds();
      return {
        id: i.object.id,
        rect: { x: b.x, y: b.y, width: b.width, height: b.height },
        depth: i.sprite.zIndex,
      };
    });
    const id = pickTarget(targets, p);
    return id === undefined ? undefined : byId.get(id);
  }

  function repaint(item: RenderedObject): void {
    refreshSprite(item, texture);
    loop.requestRender();
  }

  function startRing(p: Point): void {
    const began = performance.now();
    ring.position.set(p.x, p.y);
    ring.visible = true;
    loop.setAnimating(true);
    const draw = (): void => {
      const progress = Math.min((performance.now() - began) / LONG_PRESS_MS, 1);
      ring
        .clear()
        .arc(0, 0, RING_RADIUS, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
        .stroke({ color: 0xffffff, width: 3 });
      ringFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  function stopRing(): void {
    cancelAnimationFrame(ringFrame);
    ring.visible = false;
    loop.setAnimating(false);
    loop.requestRender();
  }

  async function runQuickAction(item: RenderedObject, service: string): Promise<void> {
    navigator.vibrate?.(30);
    const preview = optimisticVisualState(item.pack, item.state.visualState);
    if (preview !== undefined) {
      item.state = applyOptimistic(item.state, preview);
      repaint(item);
    }
    try {
      await opts.onQuickAction(item, service);
      item.state = confirm(item.state, item.state.visualState);
    } catch (error) {
      console.error(`[iso-home] ${service} failed for ${item.object.id}`, error);
      item.state = rollback(item.state);
      item.sprite.tint = 0xff6666;
      repaint(item);
      setTimeout(() => {
        item.state = clearError(item.state);
        item.sprite.tint = 0xffffff;
        loop.requestRender();
      }, ERROR_FLASH_MS);
    }
  }

  function openIfDevice(item: RenderedObject | undefined): void {
    if (item?.object.entityId !== undefined) opts.onOpenDevice(item);
  }

  const setStale = (stale: boolean): void => {
    for (const item of items) {
      item.state = { ...item.state, stale };
      item.sprite.alpha = stale ? STALE_ALPHA : 1;
      if (item.halo) item.halo.alpha = item.sprite.alpha;
    }
    loop.requestRender();
  };
  const unsubscribe = opts.connection?.subscribe((status) => setStale(status !== "connected"));

  const gestures = new GestureRecognizer({
    onTap: (p) => openIfDevice(itemAt(p)),
    onDoubleTap: () => {
      camera.refit();
      loop.requestRender();
    },
    onPressStart: (p) => {
      if (itemAt(p)?.pack.quickAction !== undefined) startRing(p);
    },
    onPressCancel: stopRing,
    onLongPress: (p) => {
      stopRing();
      const item = itemAt(p);
      const service = item?.pack.quickAction?.service;
      if (item !== undefined && service !== undefined) void runQuickAction(item, service);
      else openIfDevice(item);
    },
    onPan: (dx, dy) => {
      camera.pan(dx, dy);
      loop.requestRender();
    },
    onZoomStep: (direction, center) => {
      camera.zoomStep(direction, center);
      loop.requestRender();
    },
  });

  const point = (e: PointerEvent): Point => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: PointerEvent): void => {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers have no active capture target; gestures still work.
    }
    gestures.pointerDown(e.pointerId, point(e));
  };
  const move = (e: PointerEvent): void => gestures.pointerMove(e.pointerId, point(e));
  const up = (e: PointerEvent): void => gestures.pointerUp(e.pointerId, point(e), e.timeStamp);
  const cancel = (e: PointerEvent): void => gestures.pointerCancel(e.pointerId);

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", cancel);

  return {
    applyEntityState(entityId, haState, attributes) {
      for (const item of items) {
        if (item.object.entityId !== entityId) continue;
        const next = resolveVisualState(item.pack, haState, item.state.visualState);
        item.state = confirm(item.state, next);
        updateHalo(item, haloStyle(attributes));
        repaint(item);
      }
    },
    dispose() {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      unsubscribe?.();
      stopRing();
    },
  };
}

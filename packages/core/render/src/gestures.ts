import type { Point } from "@iso-home/core-model";

export const LONG_PRESS_MS = 500;
/** Finger travel beyond this cancels a long-press and starts a pan (FR-005). */
export const LONG_PRESS_SLOP_PX = 10;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP_PX = 30;
/** Finger-distance ratio that counts as one integer zoom step. */
const PINCH_STEP_RATIO = 1.4;

export interface GestureHandlers {
  onTap?(p: Point): void;
  onDoubleTap?(p: Point): void;
  /** Finger down, long-press timer running — show the progress ring. */
  onPressStart?(p: Point): void;
  /** Press ended without a long-press (released, moved, or second finger). */
  onPressCancel?(): void;
  onLongPress?(p: Point): void;
  onPan?(dx: number, dy: number): void;
  onZoomStep?(direction: 1 | -1, center: Point): void;
}

type Mode = "idle" | "press" | "pan" | "pinch" | "ignore";

const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Pure Pointer Events gesture recognizer (research.md §3): feed it
 * pointerdown/move/up/cancel and it calls the handlers. Time comes from the
 * global `setTimeout` and the `t` argument, so it is unit-testable in node.
 */
export class GestureRecognizer {
  private readonly pointers = new Map<number, Point>();
  private mode: Mode = "idle";
  private start: Point = { x: 0, y: 0 };
  private last: Point = { x: 0, y: 0 };
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pinchBase = 0;
  private lastTap: { p: Point; t: number } | undefined;

  constructor(private readonly handlers: GestureHandlers) {}

  pointerDown(id: number, p: Point): void {
    this.pointers.set(id, p);
    if (this.pointers.size === 1) {
      this.mode = "press";
      this.start = p;
      this.last = p;
      this.handlers.onPressStart?.(p);
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.mode = "ignore";
        this.lastTap = undefined;
        this.handlers.onLongPress?.(this.start);
      }, LONG_PRESS_MS);
    } else if (this.pointers.size === 2) {
      this.cancelPress();
      this.mode = "pinch";
      this.pinchBase = this.pinchDistance();
    }
  }

  pointerMove(id: number, p: Point): void {
    if (!this.pointers.has(id)) return;
    this.pointers.set(id, p);

    if (this.mode === "press" && dist(p, this.start) > LONG_PRESS_SLOP_PX) {
      this.cancelPress();
      this.mode = "pan";
    }
    if (this.mode === "pan") {
      this.handlers.onPan?.(p.x - this.last.x, p.y - this.last.y);
      this.last = p;
    } else if (this.mode === "pinch") {
      const d = this.pinchDistance();
      const ratio = d / this.pinchBase;
      if (ratio >= PINCH_STEP_RATIO || ratio <= 1 / PINCH_STEP_RATIO) {
        this.handlers.onZoomStep?.(ratio > 1 ? 1 : -1, this.pinchCenter());
        this.pinchBase = d;
      }
    }
  }

  pointerUp(id: number, p: Point, t: number): void {
    if (this.mode === "press") {
      this.cancelPress();
      const prev = this.lastTap;
      if (prev && t - prev.t < DOUBLE_TAP_MS && dist(prev.p, p) < DOUBLE_TAP_SLOP_PX) {
        this.lastTap = undefined;
        this.handlers.onDoubleTap?.(p);
      } else {
        this.lastTap = { p, t };
        this.handlers.onTap?.(p);
      }
    }
    this.release(id);
  }

  pointerCancel(id: number): void {
    this.cancelPress();
    this.release(id);
  }

  private release(id: number): void {
    this.pointers.delete(id);
    if (this.pointers.size === 0) this.mode = "idle";
    // Dropping from two fingers to one must not jump into a pan.
    else if (this.mode === "pinch") this.mode = "ignore";
  }

  private cancelPress(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.handlers.onPressCancel?.();
  }

  private pinchPoints(): [Point, Point] {
    const [a, b] = [...this.pointers.values()];
    return [a as Point, b as Point];
  }

  private pinchDistance(): number {
    const [a, b] = this.pinchPoints();
    return dist(a, b) || 1;
  }

  private pinchCenter(): Point {
    const [a, b] = this.pinchPoints();
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}

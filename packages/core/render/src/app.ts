import { Application } from "pixi.js";

export interface CreateAppOptions {
  width: number;
  height: number;
  /** Defaults to `window.devicePixelRatio`. */
  devicePixelRatio?: number;
}

/**
 * Bootstraps the PixiJS Application with a WebGPU → WebGL fallback
 * (research.md §4) and `devicePixelRatio` capped at 2 (the tablet budget,
 * FR per constitution Principle IX). The canvas disables native touch
 * scrolling (FR-013) so gestures never scroll the page behind it.
 *
 * PixiJS v8 does not ship a Canvas2D fallback out of the box; if both
 * WebGPU and WebGL init fail, this rethrows rather than silently
 * degrading — a tertiary Canvas2D renderer is a known follow-up, not yet
 * implemented in this POC.
 */
export async function createApp(options: CreateAppOptions): Promise<Application> {
  const resolution = Math.min(options.devicePixelRatio ?? globalThis.devicePixelRatio ?? 1, 2);
  const app = new Application();

  try {
    await app.init({
      width: options.width,
      height: options.height,
      resolution,
      autoDensity: true,
      preference: "webgpu",
      antialias: false,
    });
  } catch (webgpuError) {
    try {
      await app.init({
        width: options.width,
        height: options.height,
        resolution,
        autoDensity: true,
        preference: "webgl",
        antialias: false,
      });
    } catch (webglError) {
      throw new AggregateError(
        [webgpuError, webglError],
        "Could not initialize a WebGPU or WebGL renderer (no Canvas2D fallback in this POC)",
      );
    }
  }

  app.canvas.style.touchAction = "none";

  return app;
}

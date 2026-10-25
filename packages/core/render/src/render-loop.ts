/**
 * Redraws only on a state change, a user interaction, or an in-progress
 * animation — otherwise stays at rest (FR-008, SC-006: 0 redraws/sec idle).
 * Kept independent of PixiJS's own ticker so the scheduling logic is
 * unit-testable without a real renderer; wire `tick()` to the app's ticker.
 */
export class IdleRenderLoop {
  private dirty = true;
  private animating = false;
  private redrawCount = 0;

  constructor(private readonly render: () => void) {}

  /** Call after any state/interaction change that should produce one redraw. */
  requestRender(): void {
    this.dirty = true;
  }

  /** Call while an animation is in progress; redraws continuously until false. */
  setAnimating(animating: boolean): void {
    this.animating = animating;
    if (animating) this.dirty = true;
  }

  /** Call every tick (e.g. from the PixiJS ticker). */
  tick(): void {
    if (!this.dirty && !this.animating) return;
    this.render();
    this.redrawCount += 1;
    this.dirty = false;
  }

  /** For the on-screen debug counter (SC-006). */
  getRedrawCount(): number {
    return this.redrawCount;
  }
}

import type { ElementPack } from "@iso-home/core-model";

/** Runtime state of one rendered PlacedObject (data-model.md). */
export interface SpriteState {
  objectId: string;
  visualState: string;
  optimistic: boolean;
  stale: boolean;
  errorFlag: boolean;
  /** Pre-optimistic value, kept only while `optimistic` so a failure can roll back. */
  previousVisualState?: string;
}

export function createSpriteState(objectId: string, visualState: string): SpriteState {
  return { objectId, visualState, optimistic: false, stale: false, errorFlag: false };
}

/** Resolves an HA state string to one of the pack's sprite keys; unmapped states keep `fallback`. */
export function resolveVisualState(pack: ElementPack, haState: string, fallback: string): string {
  const key = pack.stateMap[haState];
  return key !== undefined && key in pack.sprites ? key : fallback;
}

/** Quick-action preview: toggles flip on/off; other services have no local preview. */
export function optimisticVisualState(pack: ElementPack, current: string): string | undefined {
  if (!pack.quickAction?.service.endsWith(".toggle")) return undefined;
  const next = current === "on" ? "off" : "on";
  return next in pack.sprites ? next : undefined;
}

export function applyOptimistic(state: SpriteState, next: string): SpriteState {
  return {
    ...state,
    visualState: next,
    optimistic: true,
    errorFlag: false,
    previousVisualState: state.previousVisualState ?? state.visualState,
  };
}

/** Real state arrived (FR-006/FR-007): reconcile and drop any optimistic marker. */
export function confirm(state: SpriteState, visualState: string): SpriteState {
  const { previousVisualState: _prev, ...rest } = state;
  return { ...rest, visualState, optimistic: false, errorFlag: false };
}

/** The service call failed: revert to the pre-optimistic value and flag the error. */
export function rollback(state: SpriteState): SpriteState {
  const { previousVisualState, ...rest } = state;
  return {
    ...rest,
    visualState: previousVisualState ?? state.visualState,
    optimistic: false,
    errorFlag: true,
  };
}

export function clearError(state: SpriteState): SpriteState {
  return { ...state, errorFlag: false };
}

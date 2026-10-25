import type { HassEntity } from "./hass.js";

/**
 * Returns the watched entities whose state or attributes changed since the
 * last call, and records the new values in `last`. HA replaces an entity's
 * object on every change, so reference inequality is the change test.
 */
export function diffEntities(
  last: Map<string, HassEntity | undefined>,
  states: Record<string, HassEntity | undefined>,
  watched: Iterable<string>,
): Array<[string, HassEntity]> {
  const changed: Array<[string, HassEntity]> = [];
  for (const id of watched) {
    const entity = states[id];
    if (entity === undefined || last.get(id) === entity) continue;
    last.set(id, entity);
    changed.push([id, entity]);
  }
  return changed;
}

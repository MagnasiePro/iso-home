import { z } from "zod";

export const QuickActionSchema = z.object({
  /** "domain.service", e.g. "light.toggle". */
  service: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
});
export type QuickAction = z.infer<typeof QuickActionSchema>;

/**
 * Service domains a quick action may ever target — an allowlist, not a
 * denylist (FR-009). Generic/indirect services (`homeassistant.*`,
 * `script.*`, `scene.*`, `automation.*`, ...) can act on ANY entity
 * regardless of domain, so they are rejected outright rather than
 * enumerated as individually "forbidden" — a denylist of specific
 * dangerous domains would miss them entirely.
 */
const ALLOWED_QUICK_ACTION_DOMAINS = new Set([
  "light",
  "switch",
  "fan",
  "input_boolean",
  "media_player",
  "cover",
]);

/**
 * `cover` device classes a quick action may target. Fail-closed: an
 * unknown or missing device_class is treated as unsafe, not safe — a
 * garage/door/gate cover reported with no device_class would otherwise
 * slip through a check that only rejects *known* dangerous classes.
 */
const SAFE_COVER_DEVICE_CLASSES = new Set([
  "curtain",
  "blind",
  "shade",
  "shutter",
  "awning",
  "window",
]);

export interface QuickActionRejection {
  reason: string;
}

/**
 * Checks a quick action against the domain allowlist (FR-009).
 * `deviceClass` is the bound entity's `device_class` attribute, only
 * meaningful for `cover`. `entityId`, when known, is cross-checked against
 * the service's own domain so a quick action can never fire against an
 * entity from a different — and potentially unsafe — domain than the one
 * its service declares.
 */
export function checkQuickAction(
  quickAction: QuickAction,
  deviceClass?: string,
  entityId?: string,
): QuickActionRejection | null {
  const [domain] = quickAction.service.split(".");

  if (domain === undefined) {
    return { reason: `Quick action service "${quickAction.service}" has no domain` };
  }

  if (!ALLOWED_QUICK_ACTION_DOMAINS.has(domain)) {
    return {
      reason: `Quick actions are only allowed on domains [${[...ALLOWED_QUICK_ACTION_DOMAINS].join(", ")}] (service: ${quickAction.service})`,
    };
  }

  if (
    domain === "cover" &&
    (deviceClass === undefined || !SAFE_COVER_DEVICE_CLASSES.has(deviceClass))
  ) {
    return {
      reason: `Quick actions on "cover" entities require a known, safe device_class (one of [${[...SAFE_COVER_DEVICE_CLASSES].join(", ")}]); got "${deviceClass ?? "unknown"}" (service: ${quickAction.service})`,
    };
  }

  if (entityId !== undefined) {
    const entityDomain = entityId.split(".")[0];
    if (entityDomain !== domain) {
      return {
        reason: `Quick action service domain "${domain}" does not match the bound entity's domain "${entityDomain ?? "unknown"}" (entityId: ${entityId})`,
      };
    }
  }

  return null;
}

import { z } from "zod";

export const QuickActionSchema = z.object({
  /** "domain.service", e.g. "light.toggle". */
  service: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
});
export type QuickAction = z.infer<typeof QuickActionSchema>;

/**
 * Domains a quick action may never target, regardless of what a pack manifest
 * declares (FR-009). `cover` is only forbidden for garage/door/gate device
 * classes — other covers (e.g. curtains) are fine, matching roadmap item 005.
 */
const FORBIDDEN_QUICK_ACTION_DOMAINS = new Set(["lock", "alarm_control_panel", "valve"]);
const FORBIDDEN_COVER_DEVICE_CLASSES = new Set(["garage", "door", "gate"]);

export interface QuickActionRejection {
  reason: string;
}

/**
 * Checks a quick action against the forbidden-domain blocklist. `deviceClass`
 * is the bound entity's `device_class` attribute, only meaningful for `cover`.
 */
export function checkQuickAction(
  quickAction: QuickAction,
  deviceClass?: string,
): QuickActionRejection | null {
  const [domain] = quickAction.service.split(".");

  if (domain === undefined) {
    return { reason: `Quick action service "${quickAction.service}" has no domain` };
  }

  if (FORBIDDEN_QUICK_ACTION_DOMAINS.has(domain)) {
    return {
      reason: `Quick actions are not allowed on the "${domain}" domain (service: ${quickAction.service})`,
    };
  }

  if (
    domain === "cover" &&
    deviceClass !== undefined &&
    FORBIDDEN_COVER_DEVICE_CLASSES.has(deviceClass)
  ) {
    return {
      reason: `Quick actions are not allowed on "cover" entities with device_class "${deviceClass}" (service: ${quickAction.service})`,
    };
  }

  return null;
}

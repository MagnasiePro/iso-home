import { type ElementPack, validateElementPack } from "@iso-home/core-model";

/**
 * Validates raw pack manifests (FR-009, contracts/pack-manifest.schema.md).
 * A forbidden quick action is logged and dropped, leaving the device tap-only;
 * a malformed manifest is logged and skipped. Returns packs keyed by `type`.
 */
export function loadPacks(
  manifests: unknown[],
  log: (message: string) => void = console.error,
): Map<string, ElementPack> {
  const packs = new Map<string, ElementPack>();
  for (const raw of manifests) {
    const result = validateElementPack(raw);
    if (result.ok === false) {
      log(`[iso-home] pack rejected: ${result.reason}`);
      continue;
    }
    if (result.ok === "tap-only") {
      log(
        `[iso-home] pack "${result.pack.id}": quick action rejected, device is tap-only. ${result.reason}`,
      );
    }
    packs.set(result.pack.type, result.pack);
  }
  return packs;
}

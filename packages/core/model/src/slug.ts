/**
 * Deterministic room id: the same room name always produces the same slug,
 * so a device's roomId stays valid across repeated Magicplan re-imports
 * (Clarification 1 in spec.md).
 */
export function slugifyRoomName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length === 0) {
    throw new Error(`Room name "${name}" produces an empty slug`);
  }

  return slug;
}

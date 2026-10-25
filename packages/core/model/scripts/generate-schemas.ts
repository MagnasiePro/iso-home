import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { HomeModelSchema } from "../src/home-model.js";
import { ElementPackSchema } from "../src/pack-schema.js";

/**
 * Contributor-facing JSON Schema, generated from the same zod schemas that
 * validate HomeModel/manifests at runtime — one source of truth (Principle V,
 * research.md §7).
 */
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "schemas");

const targets: Array<[name: string, schema: unknown]> = [
  ["home-model.schema.json", HomeModelSchema],
  ["pack-manifest.schema.json", ElementPackSchema],
];

for (const [fileName, schema] of targets) {
  const jsonSchema = zodToJsonSchema(schema as never, fileName.replace(".schema.json", ""));
  writeFileSync(join(outDir, fileName), `${JSON.stringify(jsonSchema, null, 2)}\n`);
  console.log(`Wrote ${fileName}`);
}

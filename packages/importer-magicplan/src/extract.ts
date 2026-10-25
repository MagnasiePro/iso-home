import { XMLParser } from "fast-xml-parser";
import { type Vec2, nearestEdgeIndex } from "./geometry.js";

export interface RawOpening {
  type: "door" | "window";
  center: Vec2;
  /** The opening's size along the wall, in the source SVG's units (cm). */
  width: number;
  wallSegmentIndex: number;
}

export interface RawRoomGeometry {
  /** Wall outline, in the source SVG's units (cm). */
  outline: Vec2[];
  openings: RawOpening[];
}

function parsePoints(points: string): Vec2[] {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error(`Malformed polygon point "${pair}"`);
      }
      return { x, y };
    });
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Extracts wall outline + openings from the fixture's SVG convention (see
 * fixtures/magicplan/README.md): a `class="wall-outline"` polygon and
 * `class="door"`/`class="window"` rects, matched to the nearest wall edge.
 * See docs/adr/0001-magicplan-source-format.md — this parsing is provisional
 * pending a real Magicplan export.
 */
export function extractFromSvg(svgContent: string): RawRoomGeometry {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(svgContent);
  const svg = doc.svg;
  if (svg === undefined) {
    throw new Error("Not an SVG document");
  }

  const polygons = toArray(svg.polygon).filter((polygon) => polygon["@_class"] === "wall-outline");
  const outlinePolygon = polygons[0];
  if (outlinePolygon === undefined) {
    throw new Error('No <polygon class="wall-outline"> found');
  }
  const outline = parsePoints(outlinePolygon["@_points"]);

  const rects = toArray(svg.rect);
  const openings: RawOpening[] = [];

  for (const rect of rects) {
    const rectClass = rect["@_class"];
    if (rectClass !== "door" && rectClass !== "window") continue;

    const x = Number(rect["@_x"]);
    const y = Number(rect["@_y"]);
    const width = Number(rect["@_width"]);
    const height = Number(rect["@_height"]);
    const center: Vec2 = { x: x + width / 2, y: y + height / 2 };

    openings.push({
      type: rectClass,
      center,
      width: Math.max(width, height),
      wallSegmentIndex: nearestEdgeIndex(center, outline),
    });
  }

  return { outline, openings };
}

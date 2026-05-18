/**
 * dxfParser.worker.ts
 *
 * Web Worker that runs the DXF parsing pipeline off the main thread.
 * This prevents the UI from freezing when loading large DXF files.
 *
 * Message protocol:
 *   → { text: string; fileName: string }   (main → worker)
 *   ← { type: 'result'; payload: DxfData } (worker → main, on success)
 *   ← { type: 'error';  message: string  } (worker → main, on failure)
 */

// @ts-ignore — no bundled types for this package
import { parseString } from "dxf";

// ─── Types (duplicated here so the worker is self-contained) ─────────────────

interface DxfVertex {
  x: number;
  y: number;
  z?: number;
}

interface DxfLayer {
  name: string;
  color: number;
  colorHex: string;
  visible: boolean;
  entityCount: number;
}

interface DxfEntity {
  type: string;
  layer?: string;
  handle?: string | number;
  start?: DxfVertex;
  end?: DxfVertex;
  vertices?: DxfVertex[];
  shape?: boolean;
  center?: DxfVertex;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  majorAxisEndPoint?: DxfVertex;
  axisRatio?: number;
  controlPoints?: DxfVertex[];
  text?: string;
  position?: DxfVertex;
  x?: number;
  y?: number;
}

interface DxfData {
  layers: DxfLayer[];
  entities: DxfEntity[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  entityCount: number;
  fileName: string;
}

// ─── ACI colour lookup ────────────────────────────────────────────────────────

function aciToHex(colorIndex: number): string {
  const ACI: Record<number, string> = {
    0: "#000000", 1: "#FF0000", 2: "#FFFF00", 3: "#00FF00",
    4: "#00FFFF", 5: "#0000FF", 6: "#FF00FF", 7: "#FFFFFF",
    8: "#808080", 9: "#C0C0C0", 10: "#FF0000", 11: "#FF7F7F",
    12: "#CC0000", 13: "#CC6666", 14: "#990000", 15: "#994C4C",
    30: "#FF7F00", 40: "#FFBF00", 50: "#FFFF00", 60: "#7FFF00",
    70: "#00FF00", 80: "#00FF7F", 90: "#00FFFF", 100: "#007FFF",
    110: "#0000FF", 120: "#7F00FF", 130: "#FF00FF", 140: "#FF007F",
    150: "#FF0040", 256: "#00E5FF",
  };
  return ACI[colorIndex] ?? "#00E5FF";
}

// ─── Bounds computation ───────────────────────────────────────────────────────

function computeBounds(entities: DxfEntity[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const expand = (x: number, y: number) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const e of entities) {
    if (e.vertices) for (const v of e.vertices) expand(v.x, v.y);
    if (e.start) expand(e.start.x, e.start.y);
    if (e.end) expand(e.end.x, e.end.y);
    if (e.center && e.radius) {
      expand(e.center.x - e.radius, e.center.y - e.radius);
      expand(e.center.x + e.radius, e.center.y + e.radius);
    }
    if (e.position) expand(e.position.x, e.position.y);
    if (e.controlPoints) for (const cp of e.controlPoints) expand(cp.x, cp.y);
    if (typeof e.x === "number" && typeof e.y === "number") expand(e.x, e.y);
  }

  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
  return { minX, minY, maxX, maxY };
}

// ─── Main parse function ──────────────────────────────────────────────────────

function parseDxf(text: string, fileName: string): DxfData {
  const dxf = parseString(text);
  if (!dxf) throw new Error("Parser returned null — file may not be a valid DXF.");

  const layerMap: Record<string, DxfLayer> = {};
  const rawLayers = dxf.tables?.layers ?? dxf.tables?.layer?.layers ?? {};
  for (const [name, layer] of Object.entries(
    rawLayers as Record<string, { colorNumber?: number; colorIndex?: number }>
  )) {
    const colorNum = layer.colorNumber ?? layer.colorIndex ?? 256;
    const absColor = Math.abs(colorNum);
    layerMap[name] = {
      name,
      color: absColor,
      colorHex: aciToHex(absColor),
      visible: colorNum >= 0,
      entityCount: 0,
    };
  }

  const entities: DxfEntity[] = ((dxf?.entities ?? []) as unknown[]) as DxfEntity[];

  for (const entity of entities) {
    const layerName = entity.layer ?? "0";
    if (!layerMap[layerName]) {
      layerMap[layerName] = {
        name: layerName,
        color: 256,
        colorHex: "#00E5FF",
        visible: true,
        entityCount: 0,
      };
    }
    layerMap[layerName].entityCount++;
  }

  return {
    layers: Object.values(layerMap),
    entities,
    bounds: computeBounds(entities),
    entityCount: entities.length,
    fileName,
  };
}

// ─── Worker message handler ───────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<{ text: string; fileName: string }>) => {
  const { text, fileName } = event.data;
  try {
    const result = parseDxf(text, fileName);
    self.postMessage({ type: "result", payload: result });
  } catch (err) {
    self.postMessage({ type: "error", message: (err as Error).message });
  }
};

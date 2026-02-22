/**
 * useDxfParser — DXF file parsing hook
 * Uses the 'dxf' npm package (parseString) which correctly handles LWPOLYLINE vertices.
 * Field names from this library: LINE uses start/end, LWPOLYLINE uses vertices[].
 */

import { useState, useCallback } from "react";
// @ts-ignore — no bundled types
import { parseString } from "dxf";

export interface DxfLayer {
  name: string;
  color: number;
  colorHex: string;
  visible: boolean;
  entityCount: number;
}

export interface DxfVertex {
  x: number;
  y: number;
  z?: number;
}

export interface DxfEntity {
  type: string;
  layer?: string;
  handle?: string | number;
  // LINE
  start?: DxfVertex;
  end?: DxfVertex;
  // LWPOLYLINE / POLYLINE
  vertices?: DxfVertex[];
  shape?: boolean;
  // CIRCLE / ARC
  center?: DxfVertex;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  // ELLIPSE
  majorAxisEndPoint?: DxfVertex;
  axisRatio?: number;
  // SPLINE
  controlPoints?: DxfVertex[];
  // TEXT / MTEXT
  text?: string;
  position?: DxfVertex;
  // POINT
  x?: number;
  y?: number;
}

export interface DxfData {
  layers: DxfLayer[];
  entities: DxfEntity[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  entityCount: number;
  fileName: string;
}

/** Convert ACI (color index) to a hex string */
function aciToHex(colorIndex: number): string {
  const ACI: Record<number, string> = {
    0: "#000000",
    1: "#FF0000",
    2: "#FFFF00",
    3: "#00FF00",
    4: "#00FFFF",
    5: "#0000FF",
    6: "#FF00FF",
    7: "#FFFFFF",
    8: "#808080",
    9: "#C0C0C0",
    10: "#FF0000",
    11: "#FF7F7F",
    12: "#CC0000",
    13: "#CC6666",
    14: "#990000",
    15: "#994C4C",
    30: "#FF7F00",
    40: "#FFBF00",
    50: "#FFFF00",
    60: "#7FFF00",
    70: "#00FF00",
    80: "#00FF7F",
    90: "#00FFFF",
    100: "#007FFF",
    110: "#0000FF",
    120: "#7F00FF",
    130: "#FF00FF",
    140: "#FF007F",
    150: "#FF0040",
    256: "#00E5FF", // BYLAYER → use cyan accent
  };
  return ACI[colorIndex] ?? "#00E5FF";
}

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

export function useDxfParser() {
  const [dxfData, setDxfData] = useState<DxfData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const dxf = parseString(text);
        if (!dxf) throw new Error("Parser returned null — file may not be a valid DXF.");

        // Extract layers from tables
        // The 'dxf' package uses tables.layers (not tables.layer.layers)
        // and colorNumber (not colorIndex); negative colorNumber means layer is off
        const layerMap: Record<string, DxfLayer> = {};
        const rawLayers = dxf.tables?.layers ?? dxf.tables?.layer?.layers ?? {};
        for (const [name, layer] of Object.entries(
          rawLayers as Record<string, { colorNumber?: number; colorIndex?: number }>
        )) {
          const colorNum = layer.colorNumber ?? layer.colorIndex ?? 256;
          const absColor = Math.abs(colorNum); // negative = layer off, but we still show it
          layerMap[name] = {
            name,
            color: absColor,
            colorHex: aciToHex(absColor),
            visible: colorNum >= 0, // respect frozen/off state
            entityCount: 0,
          };
        }

        const entities: DxfEntity[] = ((dxf?.entities ?? []) as unknown[]) as DxfEntity[];

        // Count entities per layer & auto-create missing layer entries
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

        const layers = Object.values(layerMap);
        const bounds = computeBounds(entities);

        setDxfData({
          layers,
          entities,
          bounds,
          entityCount: entities.length,
          fileName: file.name,
        });
      } catch (err) {
        setError(`Failed to parse DXF: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const reset = useCallback(() => {
    setDxfData(null);
    setError(null);
  }, []);

  return { dxfData, loading, error, parseFile, reset };
}

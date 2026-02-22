/**
 * useDxfParser — DXF file parsing hook
 * Design: Technical Brutalism / Engineering Blueprint
 * Parses DXF files using dxf-parser and extracts entities + layers.
 */

import { useState, useCallback } from "react";
// @ts-ignore — dxf-parser has no bundled types
import DxfParser from "dxf-parser";

export interface DxfLayer {
  name: string;
  color: number;
  colorHex: string;
  visible: boolean;
  entityCount: number;
}

export interface DxfEntity {
  type: string;
  layer: string;
  handle?: string | number;
  // Line / Polyline
  vertices?: Array<{ x: number; y: number; z?: number }>;
  startPoint?: { x: number; y: number; z?: number };
  endPoint?: { x: number; y: number; z?: number };
  // Circle / Arc
  center?: { x: number; y: number; z?: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  // Ellipse
  majorAxisEndPoint?: { x: number; y: number; z?: number };
  axisRatio?: number;
  // Spline
  controlPoints?: Array<{ x: number; y: number; z?: number }>;
  // Text
  text?: string;
  position?: { x: number; y: number; z?: number };
  // Point
  x?: number;
  y?: number;
  // Insert (block reference)
  name?: string;
}

export interface DxfData {
  layers: DxfLayer[];
  entities: DxfEntity[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  entityCount: number;
  fileName: string;
}

/** Convert AutoCAD color index (ACI) to a hex string */
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
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const e of entities) {
    if (e.vertices) {
      for (const v of e.vertices) expand(v.x, v.y);
    }
    if (e.startPoint) expand(e.startPoint.x, e.startPoint.y);
    if (e.endPoint) expand(e.endPoint.x, e.endPoint.y);
    if (e.center && e.radius) {
      expand(e.center.x - e.radius, e.center.y - e.radius);
      expand(e.center.x + e.radius, e.center.y + e.radius);
    }
    if (e.position) expand(e.position.x, e.position.y);
    if (e.controlPoints) {
      for (const cp of e.controlPoints) expand(cp.x, cp.y);
    }
    if (typeof e.x === "number" && typeof e.y === "number") {
      expand(e.x, e.y);
    }
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
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);
        if (!dxf) throw new Error("Parser returned null — file may not be a valid DXF.");

        // Extract layers
        const layerMap: Record<string, DxfLayer> = {};
        if (dxf.tables?.layer?.layers) {
          for (const [name, layer] of Object.entries(dxf.tables.layer.layers as Record<string, { colorIndex?: number }>)) {
            layerMap[name] = {
              name,
              color: layer.colorIndex ?? 256,
              colorHex: aciToHex(layer.colorIndex ?? 256),
              visible: true,
              entityCount: 0,
            };
          }
        }

        // Extract entities
        const entities: DxfEntity[] = ((dxf?.entities ?? []) as unknown[]) as DxfEntity[];

        // Count entities per layer
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
        setError(`Failed to parse DXF file: ${(err as Error).message}`);
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

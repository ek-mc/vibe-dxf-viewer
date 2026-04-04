/**
 * DxfCanvas — SVG-based renderer for DXF entities
 * Enhanced:
 * - layer-path batching + fast mode
 * - inspect tool
 * - measure tool (+ endpoint snapping)
 * - saved views
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { DxfData, DxfEntity } from "@/hooks/useDxfParser";

interface Props {
  dxfData: DxfData;
  visibleLayers: Set<string>;
  layerColors: Record<string, string>;
  theme: "light" | "dark";
  fastMode?: boolean;
  toolMode?: "pan" | "inspect" | "measure";
  resetViewToken?: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface Point2D {
  x: number;
  y: number;
}

const PADDING = 48;
const SNAP_SCREEN_PX = 14;

function entityToPath(entity: DxfEntity, fastMode = false): string | null {
  if (fastMode && (entity.type === "SPLINE" || entity.type === "ELLIPSE")) return null;

  switch (entity.type) {
    case "LINE": {
      const s = entity.start;
      const e = entity.end;
      if (!s || !e) return null;
      return `M ${s.x} ${-s.y} L ${e.x} ${-e.y}`;
    }

    case "LWPOLYLINE":
    case "POLYLINE": {
      const verts = entity.vertices;
      if (!verts || verts.length < 2) return null;
      const step = fastMode && verts.length > 1200 ? Math.ceil(verts.length / 1200) : 1;
      const sampled = step > 1 ? verts.filter((_, i) => i % step === 0 || i === verts.length - 1) : verts;
      const d = sampled.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${-v.y}`).join(" ");
      const isClosed = (entity as any).closed === true || (entity as any).shape === true;
      return isClosed ? d + " Z" : d;
    }

    case "CIRCLE": {
      const c = entity.center;
      const r = entity.radius;
      if (!c || !r) return null;
      return (
        `M ${c.x - r} ${-c.y} ` +
        `a ${r} ${r} 0 1 0 ${r * 2} 0 ` +
        `a ${r} ${r} 0 1 0 ${-r * 2} 0`
      );
    }

    case "ARC": {
      const c = entity.center;
      const r = entity.radius;
      if (!c || !r) return null;
      const startDeg = entity.startAngle ?? 0;
      const endDeg = entity.endAngle ?? 360;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const sa = toRad(startDeg);
      const ea = toRad(endDeg);
      const x1 = c.x + r * Math.cos(sa);
      const y1 = -(c.y + r * Math.sin(sa));
      const x2 = c.x + r * Math.cos(ea);
      const y2 = -(c.y + r * Math.sin(ea));
      let sweep = endDeg - startDeg;
      if (sweep < 0) sweep += 360;
      const large = sweep > 180 ? 1 : 0;
      return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
    }

    case "ELLIPSE": {
      const c = entity.center;
      const maj = entity.majorAxisEndPoint;
      if (!c || !maj) return null;
      const rx = Math.sqrt(maj.x * maj.x + maj.y * maj.y);
      const ry = rx * (entity.axisRatio ?? 1);
      const angle = (Math.atan2(maj.y, maj.x) * 180) / Math.PI;
      return (
        `M ${c.x - rx} ${-c.y} ` +
        `a ${rx} ${ry} ${angle} 1 0 ${rx * 2} 0 ` +
        `a ${rx} ${ry} ${angle} 1 0 ${-rx * 2} 0`
      );
    }

    case "SPLINE": {
      const pts = entity.controlPoints;
      if (!pts || pts.length < 2) return null;
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${-p.y}`).join(" ");
    }

    case "POINT": {
      const px = entity.position?.x ?? entity.x;
      const py = entity.position?.y ?? entity.y;
      if (px == null || py == null) return null;
      const s = 1;
      return `M ${px - s} ${-py} L ${px + s} ${-py} M ${px} ${-py - s} L ${px} ${-py + s}`;
    }

    default:
      return null;
  }
}

function computeViewBox(bounds: DxfData["bounds"]) {
  return {
    x: bounds.minX,
    y: -bounds.maxY,
    w: bounds.maxX - bounds.minX || 1,
    h: bounds.maxY - bounds.minY || 1,
  };
}

function getEntitySnapPoints(entity: DxfEntity): Point2D[] {
  const points: Point2D[] = [];
  if (entity.start) points.push({ x: entity.start.x, y: -entity.start.y });
  if (entity.end) points.push({ x: entity.end.x, y: -entity.end.y });
  if (entity.center) points.push({ x: entity.center.x, y: -entity.center.y });
  if (entity.vertices?.length) {
    points.push({ x: entity.vertices[0].x, y: -entity.vertices[0].y });
    const last = entity.vertices[entity.vertices.length - 1];
    points.push({ x: last.x, y: -last.y });
  }
  if (entity.position) points.push({ x: entity.position.x, y: -entity.position.y });
  return points;
}

function screenToWorld(sx: number, sy: number, t: Transform): Point2D {
  return {
    x: (sx - t.x) / t.scale,
    y: (sy - t.y) / t.scale,
  };
}

function dist(a: Point2D, b: Point2D) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function DxfCanvas({
  dxfData,
  visibleLayers,
  layerColors,
  theme,
  fastMode = false,
  toolMode = "pan",
  resetViewToken = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  const [selectedEntity, setSelectedEntity] = useState<{ idx: number; entity: DxfEntity } | null>(null);
  const [measurePoints, setMeasurePoints] = useState<Point2D[]>([]);
  const [savedViews, setSavedViews] = useState<Array<Transform | null>>([null, null, null]);

  const { bounds, entities } = dxfData;
  const vb = useMemo(() => computeViewBox(bounds), [bounds]);

  const computeFit = useCallback(
    (w: number, h: number): Transform => {
      const scaleX = (w - PADDING * 2) / vb.w;
      const scaleY = (h - PADDING * 2) / vb.h;
      const scale = Math.min(scaleX, scaleY);
      const x = (w - vb.w * scale) / 2 - vb.x * scale;
      const y = (h - vb.h * scale) / 2 - vb.y * scale;
      return { x, y, scale };
    },
    [vb]
  );

  const fitToView = useCallback(() => {
    setTransform(computeFit(containerSize.w, containerSize.h));
    setSelectedEntity(null);
    setMeasurePoints([]);
  }, [computeFit, containerSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setContainerSize({ w: width, h: height });
    setTransform(computeFit(width, height));
    setSelectedEntity(null);
    setMeasurePoints([]);
  }, [dxfData, computeFit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (resetViewToken === 0) return;
    fitToView();
  }, [resetViewToken, fitToView]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (toolMode !== "pan") return;
      setIsPanning(true);
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    },
    [transform, toolMode]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setTransform((t) => ({
        ...t,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
    },
    [isPanning]
  );

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setTransform((t) => {
      const newScale = Math.min(Math.max(t.scale * factor, 0.001), 1000);
      return {
        scale: newScale,
        x: cx - (cx - t.x) * (newScale / t.scale),
        y: cy - (cy - t.y) * (newScale / t.scale),
      };
    });
  }, []);

  const visibleEntityRows = useMemo(() => {
    const rows: Array<{ i: number; entity: DxfEntity; layer: string }> = [];
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const layer = entity.layer ?? "0";
      if (!visibleLayers.has(layer)) continue;
      rows.push({ i, entity, layer });
    }
    return rows;
  }, [entities, visibleLayers]);

  const batchedLayerPaths = useMemo(() => {
    const byLayer: Record<string, string[]> = {};
    for (const row of visibleEntityRows) {
      const d = entityToPath(row.entity, fastMode);
      if (!d) continue;
      if (!byLayer[row.layer]) byLayer[row.layer] = [];
      byLayer[row.layer].push(d);
    }
    return Object.entries(byLayer).map(([layer, parts]) => ({
      layer,
      d: parts.join(" "),
    }));
  }, [visibleEntityRows, fastMode]);

  const findNearestSnap = useCallback(
    (worldPoint: Point2D): { point: Point2D; row: { i: number; entity: DxfEntity; layer: string } } | null => {
      let best: { point: Point2D; row: { i: number; entity: DxfEntity; layer: string } } | null = null;
      let bestDist = Infinity;
      const snapWorldThreshold = SNAP_SCREEN_PX / transform.scale;

      for (const row of visibleEntityRows) {
        const pts = getEntitySnapPoints(row.entity);
        for (const p of pts) {
          const d = dist(worldPoint, p);
          if (d < bestDist && d <= snapWorldThreshold) {
            bestDist = d;
            best = { point: p, row };
          }
        }
      }
      return best;
    },
    [visibleEntityRows, transform.scale]
  );

  const onCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, transform);
      const snap = findNearestSnap(world);

      if (toolMode === "inspect") {
        if (snap) {
          setSelectedEntity({ idx: snap.row.i, entity: snap.row.entity });
        } else {
          setSelectedEntity(null);
        }
        return;
      }

      if (toolMode === "measure") {
        const point = snap?.point ?? world;
        setMeasurePoints((prev) => {
          if (prev.length >= 2) return [point];
          return [...prev, point];
        });
      }
    },
    [findNearestSnap, toolMode, transform]
  );

  const distanceValue = useMemo(() => {
    if (measurePoints.length !== 2) return null;
    return dist(measurePoints[0], measurePoints[1]);
  }, [measurePoints]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${theme === "dark" ? "bg-black" : "bg-white"}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onClick={onCanvasClick}
      style={{ cursor: toolMode === "pan" ? (isPanning ? "grabbing" : "grab") : "crosshair" }}
    >
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {batchedLayerPaths.map(({ layer, d }) => {
            let color = layerColors[layer] ?? "#00E5FF";
            if (theme === "dark") {
              if (color === "#000000") color = "#FFFFFF";
            } else {
              if (color === "#FFFFFF") color = "#111827";
            }
            return (
              <path
                key={layer}
                d={d}
                stroke={color}
                strokeWidth={(fastMode ? 1.2 : 1.5) / transform.scale}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {measurePoints.length > 0 && (
            <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r={5 / transform.scale} fill="#22d3ee" />
          )}
          {measurePoints.length > 1 && (
            <>
              <line
                x1={measurePoints[0].x}
                y1={measurePoints[0].y}
                x2={measurePoints[1].x}
                y2={measurePoints[1].y}
                stroke="#f59e0b"
                strokeDasharray={`${6 / transform.scale} ${6 / transform.scale}`}
                strokeWidth={2 / transform.scale}
              />
              <circle cx={measurePoints[1].x} cy={measurePoints[1].y} r={5 / transform.scale} fill="#f59e0b" />
            </>
          )}
        </g>
      </svg>

      <div className="absolute bottom-10 right-3 flex flex-col gap-1">
        <button
          className="toolbar-btn w-7 h-7 justify-center text-base"
          onClick={() => setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.3, 1000) }))}
          title="Zoom in"
        >
          +
        </button>
        <button
          className="toolbar-btn w-7 h-7 justify-center text-base"
          onClick={() => setTransform((t) => ({ ...t, scale: Math.max(t.scale / 1.3, 0.001) }))}
          title="Zoom out"
        >
          −
        </button>
        <button className="toolbar-btn w-7 h-7 justify-center text-xs" onClick={fitToView} title="Fit to view">
          ⊡
        </button>
      </div>

      <div className="absolute top-3 left-3 text-xs font-mono bg-card/80 border border-border px-2 py-1 text-muted-foreground">
        Mode: <span className="text-primary">{toolMode}</span>
        {fastMode ? <span className="ml-2 text-amber-400">FAST</span> : null}
      </div>

      <div className="absolute top-3 right-3 flex gap-1">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="flex gap-0.5">
            <button
              className="toolbar-btn h-7 px-2 text-[10px]"
              onClick={() =>
                setSavedViews((prev) => {
                  const n = [...prev];
                  n[slot] = { ...transform };
                  return n;
                })
              }
              title={`Save view ${slot + 1}`}
            >
              S{slot + 1}
            </button>
            <button
              className="toolbar-btn h-7 px-2 text-[10px]"
              onClick={() => {
                const v = savedViews[slot];
                if (v) setTransform(v);
              }}
              title={`Load view ${slot + 1}`}
              disabled={!savedViews[slot]}
            >
              L{slot + 1}
            </button>
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-3 text-xs text-muted-foreground font-mono flex items-center gap-2">
        <span>{Math.round(transform.scale * 100)}%</span>
        <span>•</span>
        <span>{visibleEntityRows.length} visible ents</span>
        {distanceValue != null ? (
          <>
            <span>•</span>
            <span className="text-amber-400">dist {distanceValue.toFixed(3)}</span>
          </>
        ) : null}
      </div>

      {selectedEntity && (
        <div className="absolute left-3 bottom-20 w-72 bg-card border border-border p-2 text-xs font-mono">
          <div className="text-primary mb-1">Entity Inspector</div>
          <div>Index: {selectedEntity.idx}</div>
          <div>Type: {selectedEntity.entity.type}</div>
          <div>Layer: {selectedEntity.entity.layer ?? "0"}</div>
          <div>Handle: {String(selectedEntity.entity.handle ?? "-")}</div>
          {selectedEntity.entity.vertices?.length ? <div>Vertices: {selectedEntity.entity.vertices.length}</div> : null}
          {selectedEntity.entity.radius ? <div>Radius: {selectedEntity.entity.radius.toFixed(3)}</div> : null}
          {selectedEntity.entity.text ? <div className="truncate">Text: {selectedEntity.entity.text}</div> : null}
        </div>
      )}

      {toolMode === "measure" && (
        <button
          className="absolute left-3 top-12 toolbar-btn text-xs"
          onClick={() => setMeasurePoints([])}
          title="Clear measure"
        >
          Clear measure
        </button>
      )}
    </div>
  );
}

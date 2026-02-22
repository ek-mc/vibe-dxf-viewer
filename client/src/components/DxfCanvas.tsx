/**
 * DxfCanvas — SVG-based renderer for DXF entities
 * Design: vibe-dxf-viewer / Technical Brutalism / pitch black bg + electric cyan
 * Supports pan, zoom, and layer visibility filtering.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { DxfData, DxfEntity } from "@/hooks/useDxfParser";

interface Props {
  dxfData: DxfData;
  visibleLayers: Set<string>;
  layerColors: Record<string, string>;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const PADDING = 48;

/** Build an SVG path string for a single DXF entity. Y is flipped (DXF Y-up → SVG Y-down). */
function entityToPath(entity: DxfEntity): string | null {
  switch (entity.type) {
    case "LINE": {
      const s = entity.startPoint;
      const e = entity.endPoint;
      if (!s || !e) return null;
      return `M ${s.x} ${-s.y} L ${e.x} ${-e.y}`;
    }

    case "LWPOLYLINE":
    case "POLYLINE": {
      const verts = entity.vertices;
      if (!verts || verts.length < 2) return null;
      const d = verts.map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${-v.y}`).join(" ");
      // Close if the entity flag says so
      return (entity as any).shape ? d + " Z" : d;
    }

    case "CIRCLE": {
      const c = entity.center;
      const r = entity.radius;
      if (!c || !r) return null;
      // SVG arc trick for full circle
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
      // DXF angles are CCW from +X; SVG is CW from +X with Y flipped
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
      // sweep-flag=0 because Y is flipped (CCW in DXF becomes CW in SVG)
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
      // Render as polyline through control points
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

/** Compute the bounding box of all entities in flipped-Y space */
function computeViewBox(entities: DxfEntity[], bounds: DxfData["bounds"]) {
  return {
    x: bounds.minX,
    y: -bounds.maxY,
    w: bounds.maxX - bounds.minX || 1,
    h: bounds.maxY - bounds.minY || 1,
  };
}

export default function DxfCanvas({ dxfData, visibleLayers, layerColors }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  const { bounds, entities } = dxfData;
  const vb = useMemo(() => computeViewBox(entities, bounds), [entities, bounds]);

  /** Compute fit-to-view transform */
  const computeFit = useCallback(
    (w: number, h: number): Transform => {
      const scaleX = (w - PADDING * 2) / vb.w;
      const scaleY = (h - PADDING * 2) / vb.h;
      const scale = Math.min(scaleX, scaleY);
      // Center the drawing
      const x = (w - vb.w * scale) / 2 - vb.x * scale;
      const y = (h - vb.h * scale) / 2 - vb.y * scale;
      return { x, y, scale };
    },
    [vb]
  );

  // Fit on mount and data change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setContainerSize({ w: width, h: height });
    setTransform(computeFit(width, height));
  }, [dxfData, computeFit]);

  // Resize observer
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

  // Pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    },
    [transform]
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

  // Zoom
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

  const fitToView = useCallback(() => {
    setTransform(computeFit(containerSize.w, containerSize.h));
  }, [computeFit, containerSize]);

  // Build SVG paths
  const paths = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      const layerName = e.layer ?? "0";
      if (!visibleLayers.has(layerName)) continue;
      const d = entityToPath(e);
      if (!d) continue;
      const color = layerColors[layerName] ?? "#00E5FF";
      result.push(
        <path
          key={`${e.type}-${i}`}
          d={d}
          stroke={color}
          strokeWidth={1 / transform.scale}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    return result;
  }, [entities, visibleLayers, layerColors, transform.scale]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      style={{ cursor: isPanning ? "grabbing" : "crosshair" }}
    >
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {paths}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-10 right-3 flex flex-col gap-1">
        <button
          className="toolbar-btn w-7 h-7 justify-center text-base"
          onClick={() =>
            setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.3, 1000) }))
          }
          title="Zoom in"
        >
          +
        </button>
        <button
          className="toolbar-btn w-7 h-7 justify-center text-base"
          onClick={() =>
            setTransform((t) => ({ ...t, scale: Math.max(t.scale / 1.3, 0.001) }))
          }
          title="Zoom out"
        >
          −
        </button>
        <button
          className="toolbar-btn w-7 h-7 justify-center text-xs"
          onClick={fitToView}
          title="Fit to view"
        >
          ⊡
        </button>
      </div>

      {/* Zoom level */}
      <div className="absolute bottom-10 left-3 text-xs text-muted-foreground font-mono">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}

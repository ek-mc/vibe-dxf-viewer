/**
 * DxfCanvas — SVG-based renderer for DXF entities
 * Design: vibe-dxf-viewer / Technical Brutalism / pitch black bg + electric cyan
 * Supports pan, zoom, and layer visibility filtering.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { DxfData, DxfEntity, DxfLayer } from "@/hooks/useDxfParser";

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

const PADDING = 40;

function entityToPath(entity: DxfEntity, flipY: (y: number) => number): string | null {
  switch (entity.type) {
    case "LINE": {
      const s = entity.startPoint;
      const e = entity.endPoint;
      if (!s || !e) return null;
      return `M ${s.x} ${flipY(s.y)} L ${e.x} ${flipY(e.y)}`;
    }
    case "LWPOLYLINE":
    case "POLYLINE": {
      const verts = entity.vertices;
      if (!verts || verts.length < 2) return null;
      return verts
        .map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${flipY(v.y)}`)
        .join(" ");
    }
    case "CIRCLE": {
      const c = entity.center;
      const r = entity.radius;
      if (!c || !r) return null;
      const cy = flipY(c.y);
      return `M ${c.x - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
    }
    case "ARC": {
      const c = entity.center;
      const r = entity.radius;
      if (!c || !r) return null;
      const startAngle = ((entity.startAngle ?? 0) * Math.PI) / 180;
      const endAngle = ((entity.endAngle ?? 360) * Math.PI) / 180;
      const cy = flipY(c.y);
      const x1 = c.x + r * Math.cos(startAngle);
      const y1 = cy - r * Math.sin(startAngle);
      const x2 = c.x + r * Math.cos(endAngle);
      const y2 = cy - r * Math.sin(endAngle);
      let diff = endAngle - startAngle;
      if (diff < 0) diff += 2 * Math.PI;
      const large = diff > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
    }
    case "SPLINE": {
      const pts = entity.controlPoints;
      if (!pts || pts.length < 2) return null;
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${flipY(p.y)}`).join(" ");
    }
    case "POINT": {
      const x = entity.x ?? entity.position?.x;
      const y = entity.y ?? entity.position?.y;
      if (x == null || y == null) return null;
      return `M ${x - 1} ${flipY(y)} L ${x + 1} ${flipY(y)} M ${x} ${flipY(y) - 1} L ${x} ${flipY(y) + 1}`;
    }
    default:
      return null;
  }
}

export default function DxfCanvas({ dxfData, visibleLayers, layerColors }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  const { bounds, entities } = dxfData;
  const dxfW = bounds.maxX - bounds.minX || 1;
  const dxfH = bounds.maxY - bounds.minY || 1;

  // Flip Y for SVG coordinate system
  const flipY = useCallback(
    (y: number) => bounds.maxY + bounds.minY - y,
    [bounds.maxY, bounds.minY]
  );

  // Fit to container on mount / data change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setContainerSize({ w: width, h: height });
    const scaleX = (width - PADDING * 2) / dxfW;
    const scaleY = (height - PADDING * 2) / dxfH;
    const scale = Math.min(scaleX, scaleY, 10);
    const x = (width - dxfW * scale) / 2 - bounds.minX * scale;
    const y = (height - dxfH * scale) / 2 - (bounds.maxY + bounds.minY - bounds.maxY) * scale;
    setTransform({ x, y, scale });
  }, [dxfData, dxfW, dxfH, bounds]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform(t => ({ ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
  }, [isPanning, panStart]);

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  // Zoom handler
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setTransform(t => {
      const newScale = Math.min(Math.max(t.scale * factor, 0.01), 500);
      return {
        scale: newScale,
        x: cx - (cx - t.x) * (newScale / t.scale),
        y: cy - (cy - t.y) * (newScale / t.scale),
      };
    });
  }, []);

  // Fit to view
  const fitToView = useCallback(() => {
    const { w, h } = containerSize;
    const scaleX = (w - PADDING * 2) / dxfW;
    const scaleY = (h - PADDING * 2) / dxfH;
    const scale = Math.min(scaleX, scaleY, 10);
    const x = (w - dxfW * scale) / 2 - bounds.minX * scale;
    const y = (h - dxfH * scale) / 2;
    setTransform({ x, y, scale });
  }, [containerSize, dxfW, dxfH, bounds]);

  // Build SVG paths grouped by layer
  const paths = useMemo(() => {
    return entities
      .filter(e => visibleLayers.has(e.layer ?? "0"))
      .map((e, i) => {
        const d = entityToPath(e, flipY);
        if (!d) return null;
        const layerName = e.layer ?? "0";
        const color = layerColors[layerName] ?? "#00E5FF";
        const key = `${e.type}-${i}`;
        return (
          <path
            key={key}
            d={d}
            stroke={color}
            strokeWidth={1 / transform.scale}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={hoveredEntity && hoveredEntity !== layerName ? 0.25 : 1}
            style={{ transition: "opacity 0.2s" }}
          />
        );
      })
      .filter(Boolean);
  }, [entities, visibleLayers, layerColors, flipY, transform.scale, hoveredEntity]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden canvas-cursor bg-black"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      style={{ cursor: isPanning ? "grabbing" : "crosshair" }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {paths}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-10 right-3 flex flex-col gap-1">
        <button
          className="toolbar-btn w-7 h-7 justify-center text-base"
          onClick={() => setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.3, 500) }))}
          title="Zoom in"
        >+</button>
        <button
          className="toolbar-btn w-7 h-7 justify-center text-base"
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(t.scale / 1.3, 0.01) }))}
          title="Zoom out"
        >−</button>
        <button
          className="toolbar-btn w-7 h-7 justify-center text-xs"
          onClick={fitToView}
          title="Fit to view"
        >⊡</button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-10 left-3 text-xs text-muted-foreground font-mono">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}

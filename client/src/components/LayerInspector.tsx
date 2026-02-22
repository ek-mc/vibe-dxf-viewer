/**
 * LayerInspector — Sidebar panel listing DXF layers with visibility toggles
 * Design: vibe-dxf-viewer / Technical Brutalism / pitch black + electric cyan
 */

import { useState } from "react";
import { Eye, EyeOff, Layers, ChevronDown, ChevronRight } from "lucide-react";
import type { DxfLayer } from "@/hooks/useDxfParser";

interface Props {
  layers: DxfLayer[];
  visibleLayers: Set<string>;
  onToggleLayer: (name: string) => void;
  onToggleAll: (visible: boolean) => void;
  entityCount: number;
}

export default function LayerInspector({
  layers,
  visibleLayers,
  onToggleLayer,
  onToggleAll,
  entityCount,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const allVisible = layers.every(l => visibleLayers.has(l.name));

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-border bg-sidebar h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button
          className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Layers className="w-3.5 h-3.5 text-primary" />
          LAYERS
        </button>
        <button
          className="text-xs text-muted-foreground hover:text-primary transition-colors px-1"
          onClick={() => onToggleAll(!allVisible)}
          title={allVisible ? "Hide all" : "Show all"}
        >
          {allVisible ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Layer count */}
      {!collapsed && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border/40 flex justify-between">
          <span>{layers.length} layer{layers.length !== 1 ? "s" : ""}</span>
          <span>{entityCount} entities</span>
        </div>
      )}

      {/* Layer list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          {layers.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground">No layers found.</div>
          ) : (
            layers.map(layer => {
              const isVisible = visibleLayers.has(layer.name);
              return (
                <div
                  key={layer.name}
                  className={`layer-row ${isVisible ? "" : "opacity-40"}`}
                  onClick={() => onToggleLayer(layer.name)}
                >
                  {/* Color swatch */}
                  <span
                    className="w-3 h-3 shrink-0 border border-white/10"
                    style={{ backgroundColor: layer.colorHex }}
                  />
                  {/* Layer name */}
                  <span
                    className="flex-1 truncate text-xs"
                    style={{ color: isVisible ? layer.colorHex : undefined }}
                    title={layer.name}
                  >
                    {layer.name}
                  </span>
                  {/* Entity count badge */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {layer.entityCount}
                  </span>
                  {/* Visibility icon */}
                  <button
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    onClick={e => { e.stopPropagation(); onToggleLayer(layer.name); }}
                    title={isVisible ? "Hide layer" : "Show layer"}
                  >
                    {isVisible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}

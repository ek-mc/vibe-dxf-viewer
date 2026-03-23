/**
 * LayerInspector — Sidebar panel listing DXF layers with visibility toggles
 * Enhanced: search, isolate, lock
 */

import { useMemo, useState } from "react";
import { Eye, EyeOff, Layers, ChevronDown, ChevronRight, Lock, Unlock, Focus } from "lucide-react";
import type { DxfLayer } from "@/hooks/useDxfParser";

interface Props {
  layers: DxfLayer[];
  visibleLayers: Set<string>;
  lockedLayers: Set<string>;
  onToggleLayer: (name: string) => void;
  onToggleLayerLock: (name: string) => void;
  onIsolateLayer: (name: string) => void;
  onClearIsolation: () => void;
  onToggleAll: (visible: boolean) => void;
  entityCount: number;
}

export default function LayerInspector({
  layers,
  visibleLayers,
  lockedLayers,
  onToggleLayer,
  onToggleLayerLock,
  onIsolateLayer,
  onClearIsolation,
  onToggleAll,
  entityCount,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const allVisible = layers.every((l) => visibleLayers.has(l.name));

  const filteredLayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return layers;
    return layers.filter((l) => l.name.toLowerCase().includes(q));
  }, [layers, query]);

  return (
    <aside className="flex flex-col w-72 shrink-0 border-r border-border bg-sidebar h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <button
          className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Layers className="w-3.5 h-3.5 text-primary" />
          LAYERS
        </button>

        <div className="flex items-center gap-1">
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-1"
            onClick={onClearIsolation}
            title="Clear isolation"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-1"
            onClick={() => onToggleAll(!allVisible)}
            title={allVisible ? "Hide all" : "Show all"}
          >
            {allVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="px-3 py-2 border-b border-border/50">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search layers..."
              className="w-full h-8 rounded-none border border-border bg-background px-2 text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Layer count */}
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border/40 flex justify-between">
            <span>
              {filteredLayers.length}/{layers.length} layers
            </span>
            <span>{entityCount} entities</span>
          </div>

          {/* Layer list */}
          <div className="flex-1 overflow-y-auto">
            {filteredLayers.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground">No layers match.</div>
            ) : (
              filteredLayers.map((layer) => {
                const isVisible = visibleLayers.has(layer.name);
                const isLocked = lockedLayers.has(layer.name);
                return (
                  <div
                    key={layer.name}
                    className={`layer-row ${isVisible ? "" : "opacity-40"} ${isLocked ? "bg-muted/20" : ""}`}
                    onClick={() => !isLocked && onToggleLayer(layer.name)}
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
                    <span className="text-xs text-muted-foreground shrink-0">{layer.entityCount}</span>

                    {/* Isolate */}
                    <button
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onIsolateLayer(layer.name);
                      }}
                      title="Isolate layer"
                    >
                      <Focus className="w-3 h-3" />
                    </button>

                    {/* Lock */}
                    <button
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerLock(layer.name);
                      }}
                      title={isLocked ? "Unlock layer" : "Lock layer"}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>

                    {/* Visibility icon */}
                    <button
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) onToggleLayer(layer.name);
                      }}
                      title={isVisible ? "Hide layer" : "Show layer"}
                      disabled={isLocked}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </aside>
  );
}

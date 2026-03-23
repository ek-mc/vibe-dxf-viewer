/**
 * Home — Main page for vibe-dxf-viewer
 * Enhanced with performance + CAD UX controls
 */

import { useState, useCallback } from "react";
import { FolderOpen, RotateCcw, Github, Layers, Info, Sun, Moon, Gauge, MousePointer2, Ruler, Hand } from "lucide-react";
import { useDxfParser } from "@/hooks/useDxfParser";
import DxfCanvas from "@/components/DxfCanvas";
import LayerInspector from "@/components/LayerInspector";
import DropZone from "@/components/DropZone";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const { dxfData, loading, error, parseFile, reset } = useDxfParser();
  const { theme, toggleTheme } = useTheme();
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [lockedLayers, setLockedLayers] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [toolMode, setToolMode] = useState<"pan" | "inspect" | "measure">("pan");

  const handleFile = useCallback(
    (file: File) => {
      parseFile(file);
    },
    [parseFile]
  );

  const layerNames = dxfData?.layers.map((l) => l.name) ?? [];
  const effectiveVisible = dxfData ? (visibleLayers.size === 0 ? new Set(layerNames) : visibleLayers) : new Set<string>();

  const handleToggleLayer = useCallback(
    (name: string) => {
      setVisibleLayers((prev) => {
        const base = prev.size === 0 ? new Set(layerNames) : new Set(prev);
        if (base.has(name)) base.delete(name);
        else base.add(name);
        return base;
      });
    },
    [layerNames]
  );

  const handleToggleAll = useCallback(
    (visible: boolean) => {
      if (visible) setVisibleLayers(new Set(layerNames));
      else setVisibleLayers(new Set());
    },
    [layerNames]
  );

  const handleToggleLayerLock = useCallback((name: string) => {
    setLockedLayers((prev) => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });
  }, []);

  const handleIsolateLayer = useCallback((name: string) => {
    setVisibleLayers(new Set([name]));
  }, []);

  const handleClearIsolation = useCallback(() => {
    setVisibleLayers(new Set(layerNames));
  }, [layerNames]);

  const handleReset = useCallback(() => {
    reset();
    setVisibleLayers(new Set());
    setLockedLayers(new Set());
    setToolMode("pan");
    setFastMode(false);
  }, [reset]);

  const layerColors: Record<string, string> = {};
  if (dxfData) {
    for (const l of dxfData.layers) {
      layerColors[l.name] = l.colorHex;
    }
  }

  const handleOpenFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dxf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      {/* Toolbar */}
      <header className="flex items-center gap-0 h-12 border-b border-border bg-card/80 shrink-0 px-2">
        <div className="flex items-center gap-2 px-2 mr-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" stroke="#00E5FF" strokeWidth="1.5" />
            <line x1="1" y1="9" x2="17" y2="9" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="9" y1="1" x2="9" y2="17" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle cx="9" cy="9" r="2.5" stroke="#00E5FF" strokeWidth="1" />
          </svg>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">vibe-dxf-viewer</span>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <button className="toolbar-btn" onClick={handleOpenFile}>
          <FolderOpen className="w-3.5 h-3.5" />
          Open
        </button>

        {dxfData && (
          <button className="toolbar-btn" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" />
            Close
          </button>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        <button className={`toolbar-btn ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen((s) => !s)}>
          <Layers className="w-3.5 h-3.5" />
          Layers
        </button>

        {dxfData && (
          <>
            <button className={`toolbar-btn ${fastMode ? "active" : ""}`} onClick={() => setFastMode((f) => !f)}>
              <Gauge className="w-3.5 h-3.5" />
              Fast
            </button>

            <button className={`toolbar-btn ${toolMode === "pan" ? "active" : ""}`} onClick={() => setToolMode("pan")}>
              <Hand className="w-3.5 h-3.5" />
              Pan
            </button>
            <button
              className={`toolbar-btn ${toolMode === "inspect" ? "active" : ""}`}
              onClick={() => setToolMode("inspect")}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              Inspect
            </button>
            <button
              className={`toolbar-btn ${toolMode === "measure" ? "active" : ""}`}
              onClick={() => setToolMode("measure")}
            >
              <Ruler className="w-3.5 h-3.5" />
              Measure
            </button>
          </>
        )}

        <button
          className="toolbar-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>

        <div className="flex-1" />

        {dxfData && <span className="text-xs text-muted-foreground mr-3 truncate max-w-xs">{dxfData.fileName}</span>}

        <a
          href="https://github.com/ek-mc/vibe-dxf-viewer"
          target="_blank"
          rel="noopener noreferrer"
          className="toolbar-btn"
          title="View on GitHub"
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && dxfData && (
          <LayerInspector
            layers={dxfData.layers}
            visibleLayers={effectiveVisible}
            lockedLayers={lockedLayers}
            onToggleLayer={handleToggleLayer}
            onToggleLayerLock={handleToggleLayerLock}
            onIsolateLayer={handleIsolateLayer}
            onClearIsolation={handleClearIsolation}
            onToggleAll={handleToggleAll}
            entityCount={dxfData.entityCount}
          />
        )}

        <main className="flex-1 relative overflow-hidden">
          {dxfData ? (
            <DxfCanvas
              dxfData={dxfData}
              visibleLayers={effectiveVisible}
              layerColors={layerColors}
              theme={theme}
              fastMode={fastMode}
              toolMode={toolMode}
            />
          ) : (
            <DropZone onFile={handleFile} loading={loading} error={error} />
          )}
        </main>
      </div>

      <footer className="status-bar shrink-0">
        {dxfData ? (
          <>
            <span className="text-primary">●</span>
            <span>{dxfData.fileName}</span>
            <span className="text-border">|</span>
            <span>{dxfData.entityCount} entities</span>
            <span className="text-border">|</span>
            <span>{dxfData.layers.length} layers</span>
            <span className="text-border">|</span>
            <span>
              W: {(dxfData.bounds.maxX - dxfData.bounds.minX).toFixed(2)} &nbsp; H: {(dxfData.bounds.maxY - dxfData.bounds.minY).toFixed(2)}
            </span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground">{fastMode ? "Fast mode ON" : `Tool: ${toolMode}`}</span>
          </>
        ) : (
          <>
            <Info className="w-3 h-3" />
            <span>Drop a .dxf file to begin — scroll to zoom, drag to pan</span>
          </>
        )}
      </footer>
    </div>
  );
}

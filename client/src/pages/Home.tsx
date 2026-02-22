/**
 * Home — Main page for vibe-dxf-viewer
 * Design: Technical Brutalism / pitch black + electric cyan / JetBrains Mono
 * Layout: top toolbar (48px) + sidebar (260px) + canvas (fill) + status bar (28px)
 */

import { useState, useCallback } from "react";
import { FolderOpen, RotateCcw, Github, Layers, Info } from "lucide-react";
import { toast } from "sonner";
import { useDxfParser } from "@/hooks/useDxfParser";
import DxfCanvas from "@/components/DxfCanvas";
import LayerInspector from "@/components/LayerInspector";
import DropZone from "@/components/DropZone";

export default function Home() {
  const { dxfData, loading, error, parseFile, reset } = useDxfParser();
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // When new data arrives, make all layers visible
  const handleFile = useCallback(
    (file: File) => {
      parseFile(file);
    },
    [parseFile]
  );

  // Sync visible layers when dxfData changes
  const layerNames = dxfData?.layers.map(l => l.name) ?? [];
  const effectiveVisible = dxfData
    ? visibleLayers.size === 0
      ? new Set(layerNames)
      : visibleLayers
    : new Set<string>();

  const handleToggleLayer = useCallback((name: string) => {
    setVisibleLayers(prev => {
      // On first toggle, initialize from all layers
      const base = prev.size === 0 ? new Set(layerNames) : new Set(prev);
      if (base.has(name)) base.delete(name);
      else base.add(name);
      return base;
    });
  }, [layerNames]);

  const handleToggleAll = useCallback((visible: boolean) => {
    if (visible) setVisibleLayers(new Set(layerNames));
    else setVisibleLayers(new Set());
  }, [layerNames]);

  const handleReset = useCallback(() => {
    reset();
    setVisibleLayers(new Set());
  }, [reset]);

  const layerColors: Record<string, string> = {};
  if (dxfData) {
    for (const l of dxfData.layers) {
      layerColors[l.name] = l.colorHex;
    }
  }

  // File open via toolbar button
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
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden select-none">

      {/* ── Toolbar ── */}
      <header className="flex items-center gap-0 h-12 border-b border-border bg-card/80 shrink-0 px-2">
        {/* Brand */}
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

        {/* File actions */}
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

        {/* Layer toggle */}
        <button
          className={`toolbar-btn ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(s => !s)}
        >
          <Layers className="w-3.5 h-3.5" />
          Layers
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* File name */}
        {dxfData && (
          <span className="text-xs text-muted-foreground mr-3 truncate max-w-xs">
            {dxfData.fileName}
          </span>
        )}

        {/* GitHub link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="toolbar-btn"
          onClick={e => { e.preventDefault(); toast.info("Open the GitHub repo from your profile."); }}
          title="View on GitHub"
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && dxfData && (
          <LayerInspector
            layers={dxfData.layers}
            visibleLayers={effectiveVisible}
            onToggleLayer={handleToggleLayer}
            onToggleAll={handleToggleAll}
            entityCount={dxfData.entityCount}
          />
        )}

        {/* Canvas / Drop zone */}
        <main className="flex-1 relative overflow-hidden">
          {dxfData ? (
            <DxfCanvas
              dxfData={dxfData}
              visibleLayers={effectiveVisible}
              layerColors={layerColors}
            />
          ) : (
            <DropZone onFile={handleFile} loading={loading} error={error} />
          )}
        </main>
      </div>

      {/* ── Status bar ── */}
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
              W: {(dxfData.bounds.maxX - dxfData.bounds.minX).toFixed(2)} &nbsp;
              H: {(dxfData.bounds.maxY - dxfData.bounds.minY).toFixed(2)}
            </span>
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

/**
 * DropZone — Drag-and-drop file upload area for DXF files
 * Design: vibe-dxf-viewer / pitch black bg + electric cyan + dot-grid
 */

import { useCallback, useState } from "react";
import { Upload, FileCode } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const BG_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663217647812/oDYyGPQaNyPcPGMf.png";

export default function DropZone({ onFile, loading, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Drop zone card */}
      <label
        className={`relative z-10 flex flex-col items-center justify-center gap-5
          w-96 h-64 border-2 border-dashed transition-all duration-200
          ${isDragging
            ? "drop-zone-active border-primary bg-primary/10"
            : "border-border/60 hover:border-primary/50 hover:bg-primary/5 bg-black/60"
          }
          cursor-pointer`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".dxf"
          className="sr-only"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-primary tracking-widest uppercase">Parsing DXF…</span>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-14 h-14 border border-border/60 bg-card/60">
              <FileCode className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground mb-1">
                Drop a <span className="text-primary">.dxf</span> file here
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Upload className="w-3 h-3" />
              <span>AutoCAD DXF format supported</span>
            </div>
          </>
        )}
      </label>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
          px-4 py-2 border border-destructive/60 bg-destructive/10 text-destructive text-xs max-w-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}

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
  "https://private-us-east-1.manuscdn.com/sessionFile/PQUysrquK7u87WTB3n71hM/sandbox/8qNAISGyx4tMj7kshQzGF2-img-1_1771801482000_na1fn_ZHhmLWNhbnZhcy1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUFFVeXNycXVLN3U4N1dUQjNuNzFoTS9zYW5kYm94LzhxTkFJU0d5eDR0TWo3a3NoUXpHRjItaW1nLTFfMTc3MTgwMTQ4MjAwMF9uYTFmbl9aSGhtTFdOaGJuWmhjeTFpWncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=TQZ~yejcTucxV7qclVGBvtM97BE5M0c8ODdfrpY7QNuOfkca72VfZUUS0CBu7DjS9dXkBVVJjNhDUCoM8TV5XpvPzsKaexxPfX02Oqu50vKGCLQJc4gXqTkZ0D4DHbXVqHbcEomJ~Yx2TypqTuRjxTizr7dyjca0S5NRyHKfLui1hC8wDcm~DKL1GCdFLv0Z-2NyYCjpALeOAVnQcfCiO3gVtxWM4p1GJ6BAWsVX7U~qVxr-dsZrYp5RJX7i26A9E7D2zvTzALh50vhi8zqsIkqykOQ~vej1~wLVSesLaUM3xM998ayoO5jpWjZmBfZunA11k5-IDgW6AydKsz3JRw__";

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

/**
 * useDxfParser — DXF file parsing hook
 *
 * Offloads the heavy DXF parse pipeline to a dedicated Web Worker so the
 * main UI thread stays responsive even for large (50 MB+) drawings.
 *
 * Worker protocol:
 *   → { text: string; fileName: string }
 *   ← { type: 'result'; payload: DxfData }
 *   ← { type: 'error';  message: string  }
 */

import { useState, useCallback, useRef } from "react";
import DxfWorker from "../workers/dxfParser.worker?worker";

export interface DxfLayer {
  name: string;
  color: number;
  colorHex: string;
  visible: boolean;
  entityCount: number;
}

export interface DxfVertex {
  x: number;
  y: number;
  z?: number;
}

export interface DxfEntity {
  type: string;
  layer?: string;
  handle?: string | number;
  // LINE
  start?: DxfVertex;
  end?: DxfVertex;
  // LWPOLYLINE / POLYLINE
  vertices?: DxfVertex[];
  shape?: boolean;
  // CIRCLE / ARC
  center?: DxfVertex;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  // ELLIPSE
  majorAxisEndPoint?: DxfVertex;
  axisRatio?: number;
  // SPLINE
  controlPoints?: DxfVertex[];
  // TEXT / MTEXT
  text?: string;
  position?: DxfVertex;
  // POINT
  x?: number;
  y?: number;
}

export interface DxfData {
  layers: DxfLayer[];
  entities: DxfEntity[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  entityCount: number;
  fileName: string;
}

export function useDxfParser() {
  const [dxfData, setDxfData] = useState<DxfData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the active worker so we can terminate it if a new file is
  // dropped before the previous parse completes (prevents stale results).
  const workerRef = useRef<Worker | null>(null);

  const parseFile = useCallback((file: File) => {
    // Terminate any in-flight parse
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;

      const worker = new DxfWorker();
      workerRef.current = worker;

      worker.onmessage = (
        event: MessageEvent<
          | { type: "result"; payload: DxfData }
          | { type: "error"; message: string }
        >
      ) => {
        workerRef.current = null;
        worker.terminate();

        if (event.data.type === "result") {
          setDxfData(event.data.payload);
        } else {
          setError(`Failed to parse DXF: ${event.data.message}`);
        }
        setLoading(false);
      };

      worker.onerror = (err) => {
        workerRef.current = null;
        worker.terminate();
        setError(`Worker error: ${err.message}`);
        setLoading(false);
      };

      worker.postMessage({ text, fileName: file.name });
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setDxfData(null);
    setError(null);
  }, []);

  return { dxfData, loading, error, parseFile, reset };
}

# vibe-dxf-viewer

> A browser-based AutoCAD DXF file viewer with a layer inspector — no installation, no server, no AutoCAD required.

![vibe-dxf-viewer screenshot](https://private-us-east-1.manuscdn.com/sessionFile/PQUysrquK7u87WTB3n71hM/sandbox/8qNAISGyx4tMj7kshQzGF2-img-1_1771801482000_na1fn_ZHhmLWNhbnZhcy1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUFFVeXNycXVLN3U4N1dUQjNuNzFoTS9zYW5kYm94LzhxTkFJU0d5eDR0TWo3a3NoUXpHRjItaW1nLTFfMTc3MTgwMTQ4MjAwMF9uYTFmbl9aSGhtTFdOaGJuWmhjeTFpWncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=TQZ~yejcTucxV7qclVGBvtM97BE5M0c8ODdfrpY7QNuOfkca72VfZUUS0CBu7DjS9dXkBVVJjNhDUCoM8TV5XpvPzsKaexxPfX02Oqu50vKGCLQJc4gXqTkZ0D4DHbXVqHbcEomJ~Yx2TypqTuRjxTizr7dyjca0S5NRyHKfLui1hC8wDcm~DKL1GCdFLv0Z-2NyYCjpALeOAVnQcfCiO3gVtxWM4p1GJ6BAWsVX7U~qVxr-dsZrYp5RJX7i26A9E7D2zvTzALh50vhi8zqsIkqykOQ~vej1~wLVSesLaUM3xM998ayoO5jpWjZmBfZunA11k5-IDgW6AydKsz3JRw__)

## Features

- **Drag-and-drop** or click-to-open `.dxf` files — everything runs in the browser
- **SVG canvas renderer** supporting LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE, POINT, and TEXT entities
- **Layer inspector** sidebar with per-layer visibility toggles and entity counts
- **Pan & zoom** — scroll to zoom, drag to pan, fit-to-view button
- **AutoCAD Color Index (ACI)** mapping — layers render in their original DXF colors
- **Status bar** showing entity count, layer count, and drawing dimensions
- Pitch-black engineering aesthetic with electric cyan accents

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| DXF Parsing | [dxf-parser](https://github.com/gdsestimating/dxf-parser) |
| Build | Vite 7 |
| Icons | lucide-react |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/vibe-dxf-viewer.git
cd vibe-dxf-viewer

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and drop any `.dxf` file onto the canvas.

## Supported DXF Entity Types

| Entity | Rendered |
|---|---|
| LINE | Yes |
| LWPOLYLINE | Yes |
| POLYLINE | Yes |
| CIRCLE | Yes |
| ARC | Yes |
| SPLINE | Yes (control points) |
| POINT | Yes |
| TEXT / MTEXT | Partial (position marker) |
| INSERT (blocks) | Not yet |
| HATCH | Not yet |

## Keyboard & Mouse Controls

| Action | Input |
|---|---|
| Zoom in / out | Scroll wheel |
| Pan | Click and drag |
| Fit to view | Click ⊡ button |
| Open file | Toolbar → Open, or drag-and-drop |
| Toggle layer | Click layer row in sidebar |

## License

MIT — free and open source.

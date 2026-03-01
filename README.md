# vibe-dxf-viewer

> A browser-based DXF file viewer with a layer inspector — no installation, no server required.

![vibe-dxf-viewer screenshot](https://files.manuscdn.com/user_upload_by_module/session_file/310519663217647812/oDYyGPQaNyPcPGMf.png)

## Features

- **Drag-and-drop** or click-to-open `.dxf` files — everything runs in the browser
- **SVG canvas renderer** supporting LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, SPLINE, POINT, and TEXT entities
- **Layer inspector** sidebar with per-layer visibility toggles and entity counts
- **Pan & zoom** — scroll to zoom, drag to pan, fit-to-view button
- **ACI color mapping** — layers render in their original DXF colors
- **Light / Dark mode toggle** with persisted preference
- **Theme-aware contrast handling** (white/black layer colors are remapped for visibility)
- **Status bar** showing entity count, layer count, and drawing dimensions
- Technical engineering aesthetic with electric cyan accents

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

## Versioning

This project follows semantic versioning.

- Current version: `1.1.0`
- See [CHANGELOG.md](./CHANGELOG.md) for release notes.

## License

MIT — free and open source.

# Changelog

## Upgrade Notes convention

For each release entry, include an **Upgrade Notes** line:
- `Upgrade Notes: None` if no migration/breaking changes are required
- otherwise include concrete migration/compatibility instructions


All notable changes to this project are documented in this file.

## [1.4.0] - 2026-05-31

### Changed
- **Renderer: SVG → HTML5 2D Canvas** (`DxfCanvas.tsx`). The SVG-based
  renderer has been replaced with a `<canvas>` + 2D Context API renderer.
  - Zero DOM nodes for geometry — one `beginPath`/`stroke` call per layer.
  - Eliminates browser layout thrashing on pan/zoom for large drawings.
  - All entity types supported: `LINE`, `LWPOLYLINE`, `POLYLINE`, `CIRCLE`,
    `ARC`, `ELLIPSE`, `SPLINE`, `POINT`.
  - ARC angles are correctly handled for DXF's counter-clockwise convention
    under a Y-flip coordinate system.
  - Measure overlay and snap indicator are drawn directly on the canvas.

### Added
- **Zoom-to-cursor** (`onWheel`): mouse-wheel zoom is now anchored to the
  exact cursor position. The world point under the cursor stays fixed as
  the scale changes — standard CAD/GIS behaviour.
- **Live snap indicator**: while hovering in `measure` or `inspect` mode,
  a cyan crosshair + circle is drawn on the canvas at the nearest snap
  point (endpoint, centre, vertex). The status bar shows `⊕ snap` when
  a snap is active.
- `snapIndicator` state drives a screen-space overlay drawn after the
  world transform is restored, so the indicator is always a fixed pixel
  size regardless of zoom level.

Upgrade Notes: None


## [1.3.0] - 2026-05-18

### Added
- **Web Worker for DXF parsing** (`src/workers/dxfParser.worker.ts`). The full parse pipeline (string parsing, layer extraction, bounds computation) now runs in a dedicated worker thread, keeping the main UI thread responsive for large files (50 MB+).
- Worker is automatically terminated if a new file is dropped before the previous parse completes, preventing stale results.
- `reset()` in `useDxfParser` now also terminates any in-flight worker.

### Changed
- `useDxfParser` hook refactored to use the new worker via Vite's `?worker` import syntax. The public API (`parseFile`, `reset`, `dxfData`, `loading`, `error`) is unchanged.

Upgrade Notes: None

## [1.2.1] - 2026-04-04

### Added
- Toolbar `Reset view` action to quickly fit the current drawing back into view.

### Changed
- Resetting the view now also clears active measurement points and entity inspection selection.

## [1.2.0] - 2026-03-23

### Added
- **Performance / rendering**
  - Layer-path batching to reduce SVG node count.
  - `Fast` mode toggle for heavy drawings.
  - Polyline sampling in fast mode for very dense geometries.
- **CAD UX tools**
  - Tool modes: `Pan`, `Inspect`, `Measure`.
  - Entity inspector panel (type, layer, handle, basic metadata).
  - 2-point distance measurement with endpoint snapping.
  - Saved views (3 slots: save/load).
- **Layer workflow improvements**
  - Layer search/filter.
  - Layer isolate action.
  - Layer lock/unlock state.
  - Clear isolation shortcut.

### Changed
- Toolbar extended with performance + CAD interaction controls.
- Status bar now reflects active tool / fast-mode state.

## [1.1.0] - 2026-03-02

### Added
- Light/Dark theme toggle in the toolbar.
- Persisted theme preference via local storage.
- Theme-aware contrast handling in DXF canvas (black/white line remap for readability).

### Documentation
- README updated with light mode + contrast behavior.

## [1.0.0] - 2026-03-02

### Initial
- Browser-based DXF viewer.
- Layer inspector with visibility controls.
- SVG rendering pipeline for core DXF entities.
- Pan/zoom and fit-to-view controls.

## [0.0.1] - 2026-03-01

### Added
- Documented GitHub Actions workflows in README.

### Changed
- Browser page title updated to `DFX Viewer`.
- Added SEO/social metadata in `client/index.html`:
  - standard meta description/keywords/robots/author
  - Open Graph tags
  - Twitter card tags

## [0.0.0] - 2026-02-22

### Initial
- Initial project bootstrap.
- First working DXF viewer foundation (pre-release baseline).

## 2026-04-29

- Added basic GitHub Actions CI workflow (`.github/workflows/basic-ci.yml`).
- Maintenance: closed stale dependency PR queue for cleaner triage (where applicable).

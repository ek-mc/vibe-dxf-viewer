# Changelog

## Upgrade Notes convention

For each release entry, include an **Upgrade Notes** line:
- `Upgrade Notes: None` if no migration/breaking changes are required
- otherwise include concrete migration/compatibility instructions


All notable changes to this project are documented in this file.

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

# DXF Viewer — Design Ideas

<response>
<idea>
**Design Movement:** Technical Brutalism meets Engineering Blueprint
**Core Principles:**
- Raw, precise, grid-aligned — inspired by drafting tables and engineering schematics
- High information density without clutter; every pixel earns its place
- Dark-mode-first with a monochromatic steel palette punctuated by a single electric accent

**Color Philosophy:**
- Background: near-black charcoal (#0d0f12) — evokes a dark CAD workspace
- Surface: dark steel (#161a1f) for panels and cards
- Accent: electric cyan (#00e5ff) — the classic AutoCAD cursor color
- Muted text: cool gray (#8a9bb0)
- Borders: thin 1px lines in #2a3040

**Layout Paradigm:**
- Asymmetric split: left sidebar (fixed 260px) for layer inspector, main canvas fills remaining space
- Top toolbar strip (48px) for file actions and view controls
- Status bar at the bottom (32px) showing entity count, zoom level, cursor coords

**Signature Elements:**
- Crosshair cursor on the canvas area
- Subtle dot-grid background on the canvas when no file is loaded
- Layer rows with colored swatch squares matching DXF layer colors

**Interaction Philosophy:**
- Hover states are instant, no delay — precision tools feel snappy
- Drag-and-drop file zone with a dashed border that glows cyan on hover
- Smooth canvas pan/zoom with momentum

**Animation:**
- File load: entities draw in progressively (stroke-dashoffset animation)
- Layer toggle: fade + slight scale on the canvas entities belonging to that layer
- Sidebar items: 150ms slide-in on mount

**Typography System:**
- Display / UI labels: "JetBrains Mono" — monospace, technical, precise
- Body / descriptions: "Inter" at 13px — clean and readable at small sizes
- Hierarchy: cyan accent for active states, white for primary labels, cool gray for secondary
</idea>
<probability>0.08</probability>
</response>

<response>
<idea>
**Design Movement:** Minimal Swiss Modernism — Bauhaus for Dev Tools
**Core Principles:**
- Strict typographic grid, no decorative elements
- Function dictates form: every element exists to communicate data
- Light background, heavy typographic contrast

**Color Philosophy:**
- Background: off-white (#f5f4f0) — warm paper tone
- Panels: pure white (#ffffff)
- Accent: deep cobalt (#1a3bcc)
- Text: near-black (#111111)
- Borders: light warm gray (#e0ddd8)

**Layout Paradigm:**
- Top navigation bar with file name and actions
- Two-column layout: narrow left panel (220px) for layers, wide right for canvas
- No rounded corners — strict rectangular geometry

**Signature Elements:**
- Bold uppercase section labels with a 2px cobalt underline
- Entity count badges in cobalt on white
- Thin horizontal rules as dividers

**Interaction Philosophy:**
- No animations except essential state changes
- Hover: background fill shift only
- Focus: 2px cobalt outline

**Animation:**
- Minimal: opacity transitions at 100ms only
- No entrance animations

**Typography System:**
- All text: "Space Grotesk" — geometric, modern
- Monospace data: "Space Mono" for coordinates and entity IDs
</idea>
<probability>0.07</probability>
</response>

<response>
<idea>
**Design Movement:** Dark Engineering Dashboard — Precision Noir
**Core Principles:**
- Deep dark surfaces with sharp contrast highlights
- Data-forward: the drawing canvas is the hero, UI chrome is minimal
- Glassy panel surfaces with subtle depth

**Color Philosophy:**
- Background: #0a0c10 deep navy-black
- Panel surfaces: rgba glass with backdrop-blur
- Accent: amber/gold (#f59e0b) — warm contrast against cold dark
- Text: white primary, slate-400 secondary
- Layer colors: use actual DXF layer colors as-is

**Layout Paradigm:**
- Full-bleed canvas background
- Floating glass panels: left panel for layers, top toolbar floats above canvas
- Panels can be collapsed to maximize canvas space

**Signature Elements:**
- Glassmorphism panels with 1px light border and backdrop-blur
- Amber accent glow on active/hover states
- Coordinate readout in monospace in the bottom-right corner

**Interaction Philosophy:**
- Panels slide in/out smoothly
- Canvas interactions feel fluid and direct
- Keyboard shortcuts displayed on hover

**Animation:**
- Panel open/close: 200ms ease-out slide + fade
- Entity highlight on layer hover: 300ms opacity transition
- File drop zone: pulsing amber border glow

**Typography System:**
- UI: "Geist" — clean, modern, developer-friendly
- Data/coords: "Geist Mono"
- Accent labels: uppercase tracking-widest at 11px
</idea>
<probability>0.09</probability>
</response>

## Selected Approach: **Technical Brutalism — Engineering Blueprint (Response 1)**

Dark CAD workspace aesthetic with electric cyan accent, JetBrains Mono typography, asymmetric sidebar layout, and dot-grid canvas. This feels native to the AutoCAD world and will look distinctive on GitHub.

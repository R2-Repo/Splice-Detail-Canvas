# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

**Splice Detail Canvas** — frontend PWA that imports Bentley OpenComms CSV splice reports, auto-generates splice detail diagrams on a React Flow canvas, allows drag-to-polish, and exports PDFs matching industry visual style.

**Full spec:** [`SCOPE.md`](./SCOPE.md)  
**Reference:** [`docs/reference/`](../reference/) (CSVs, PDFs, images)

## Current phase

**Canvas MVP rebuild** — composite cable nodes + placement for paired Examples #1–#3. Spec: [`splice-detail-canvas-project-summary.md`](../reference/examples/splice-detail-canvas-project-summary.md).

**Working:** import CSV → one canvas node per physical cable name; splice edges; Examples #1–#3 + 11400S + 300N_MAIN.

**Still to polish:** PNG parity (typography), PDF export.

## Active goals (next)

- Finer layout scoring vs reference PNGs (typography)
- PDF export (needs dep approval)

## Layout invariants (locked)

**Canonical rules:** [`LAYOUT_RULES.md`](./LAYOUT_RULES.md) — 21 rule IDs (FBR/TUB/CBL/ROW/DOM/EDGE).  
**Enforcement:** `src/features/diagram/layoutRules.ts` + `layoutRules.test.ts` (Examples #1–#3 contract).  
**Agent rule:** `.cursor/rules/layout-rules.mdc` — **alwaysApply** (every agent request).

When adding layout behavior: update rules doc + checker + contract test in the same change.

## Recent layout (2026-05-22)

- **Canvas styling refresh:** overview minimap removed, background switched to white, and toolbar/inspect text + cable-node labels/links now use darker colors so imported diagrams remain legible on the new background
- **Cable import simplification:** leg identity + canvas placement keyed by **cable name only** (remote Bentley `device` ignored); one visual node per physical cable; `computeCableCanvasSides` optimizes stack placement; edges/butt splices still use CSV From/To columns
- **11400S fix:** 6 unique cable names → 6 canvas nodes (was 12)
- **Fiber strand direction:** `buildReactFlowGraph` derives display side from node X (`displaySideFromCanvasX`) so strands always point toward diagram center (fixes stale `cableSides` vs saved position drift) and `WorkflowCanvas` watches drags so hybrid cables recalc fan direction instantly when crossing center
- **Adaptive spacing + column alignment:** layout now widens left/right offsets via `computeCableXBounds` when a side fills and keeps every cable on the same column (`cableXForSide` ignores tube offsets) so tall imports (Example #3, 300N_MAIN, I-215) start aligned.
- **Dynamic width layout:** the canvas stage now measures its rendered width via `ResizeObserver`, updates layout positions whenever that width changes, and feeds the latest width into `buildReactFlowGraph` so `computeCableXBounds` pushes left/right columns farther apart when the screen widens; the layout width now also grows with the number of cables (120 px per extra visual cable) so dense imports spread even on a narrow canvas, and width changes re-run the layout without reusing cached node positions so the new spacing takes effect immediately.
- **300N_MAIN:** butt-splice detection matches tubes by CSV From/To role, not canvas side
- Prior: 300N parse dedupe, TIA tube order, full butt splice collapse, layout rules contract

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| CSV import | Direct interpret + internal normalize | No cleaned.csv rewrite |
| Cable leg identity | **Cable name only** at splice | Remote `device` diagnostic only; `from`/`to` csvColumn for in/out legs |
| Canvas placement | One node per cable name | Side from weighted pair optimization |
| Edge routing | CSV From/To columns | Independent of canvas stack side |
| Canvas | `@xyflow/react` | Frozen until parse gap = 0 on user files |
| Architecture | Model-first | `tokenize → parse → normalize → SpliceReport` |
| Layout regressions | Rules doc + contract tests | Must pass before merge |
| Full butt splice | UI toggle, not auto on import | Layout always uses fiber-level rows; collapse is visual-only |
| Left/Right in CSV | Left = primary pairs; Right = mirror + extras | Dedupe by physical fiber identity; Right-only rows kept |
| New npm deps | User approval required | PDF lib TBD |
| Hosting | GitHub Pages via GitHub Actions | `deploy-github-pages.yml` builds with `GITHUB_PAGES=true` and uses official `upload-pages-artifact` + `deploy-pages` (no `gh-pages` branch). Pages source must be **GitHub Actions** in repo settings. |

## Blockers

_None for CSV on Examples #1–#3 or 11400S._

## Out of scope (until requested)

- Backend / auth / collaboration
- Bentley API integration
- PDF export library

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

## Recent layout (2026-05-21)

- **Cable import simplification:** leg identity + canvas placement keyed by **cable name only** (remote Bentley `device` ignored); one visual node per physical cable; `computeCableCanvasSides` optimizes stack placement; edges/butt splices still use CSV From/To columns
- **11400S fix:** 6 unique cable names → 6 canvas nodes (was 12)
- **Fiber strand direction:** `buildReactFlowGraph` derives display side from node X (`displaySideFromCanvasX`) so strands always point toward diagram center (fixes stale `cableSides` vs saved position drift) and `WorkflowCanvas` watches drags so hybrid cables recalc fan direction instantly when crossing center
- **Adaptive spacing + column alignment:** layout now widens left/right offsets via `computeCableXBounds` when a side fills and keeps every cable on the same column (`cableXForSide` ignores tube offsets) so tall imports (Example #3, 300N_MAIN, I-215) start aligned.
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
| Hosting | GitHub Pages via action | Build workflow sets `GITHUB_PAGES=true` so Vite uses `/<repo>/` base and `peaceiris/actions-gh-pages` publishes `dist/` to the `gh-pages` branch on every `main` push. |

## Blockers

_None for CSV on Examples #1–#3 or 11400S._

## Out of scope (until requested)

- Backend / auth / collaboration
- Bentley API integration
- PDF export library

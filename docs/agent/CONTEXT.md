# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

**Splice Detail Canvas** — frontend PWA that imports Bentley OpenComms CSV splice reports, auto-generates splice detail diagrams on a React Flow canvas, allows drag-to-polish, and exports PDFs matching industry visual style.

**Full spec:** [`SCOPE.md`](./SCOPE.md)  
**Reference:** [`docs/reference/`](../reference/) (CSVs, PDFs, images)

## Current phase

**Canvas MVP rebuild** — composite cable nodes + placement for paired Examples #1–#3. Spec: [`splice-detail-canvas-project-summary.md`](../reference/examples/splice-detail-canvas-project-summary.md).

**Working:** import CSV → composite cable nodes → splice edges with fusion dots; Example #1 = 3 cables / 4 edges; Example #2 = 4 cables / 6 edges.

**Still to polish:** PNG parity (typography), PDF export.

## Active goals (next)

- Finer layout scoring vs reference PNGs (typography)
- PDF export (needs dep approval)

## Recent layout (2026-05-20)

- **Row order:** through-cable fiber # (not CSV tail order) — fixes Ex #3 RD/BK CH 2101 sitting below OR tube
- Cable sheath height scales with buffer-tube vertical span + tube count
- Multi-tube cables pushed further outward (64px/tube) for longer buffer-tube reach
- Buffer tube endpoints vertically centered on their fiber groups (Ex #3 parity)

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| CSV import | Direct interpret + internal normalize | No cleaned.csv rewrite |
| Canvas | `@xyflow/react` | Frozen until parse gap = 0 on user files |
| Architecture | Model-first | `tokenize → parse → normalize → SpliceReport` |
| Left/Right in CSV | Left = pairs; Right = leg hints | Right may be partial (Ex #1) |
| New npm deps | User approval required | PDF lib TBD |

## Blockers

_None for CSV on Examples #1–#2._ Need more CSV types for leg heuristics beyond mirror pattern.

## Out of scope (until requested)

- Backend / auth / collaboration
- Bentley API integration
- PDF export library

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

## Layout invariants (locked)

**Canonical rules:** [`LAYOUT_RULES.md`](./LAYOUT_RULES.md) — 21 rule IDs (FBR/TUB/CBL/ROW/DOM/EDGE).  
**Enforcement:** `src/features/diagram/layoutRules.ts` + `layoutRules.test.ts` (Examples #1–#3 contract).  
**Agent rule:** `.cursor/rules/layout-rules.mdc` — **alwaysApply** (every agent request).

When adding layout behavior: update rules doc + checker + contract test in the same change.

## Recent layout (2026-05-21)

- **Layout rules contract:** `LAYOUT_RULES.md`, `layoutRules.ts`, 52 contract tests on reference CSVs
- **Edge routing init fix:** splice lane registry syncs on mount; fixes overlapping strands on Example #2 import
- **Tube invariants:** strands top→bottom by TIA fiber #; 24px pitch within each buffer tube
- **Dominant pair:** straight-across priority for largest left↔right cable group
- **Ring-cut splits (Ex #1):** extra splice-row gap between split visual cables
- Prior: through-cable row order; sheath/tube geometry parity

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| CSV import | Direct interpret + internal normalize | No cleaned.csv rewrite |
| Canvas | `@xyflow/react` | Frozen until parse gap = 0 on user files |
| Architecture | Model-first | `tokenize → parse → normalize → SpliceReport` |
| Layout regressions | Rules doc + contract tests | Must pass before merge |
| Left/Right in CSV | Left = pairs; Right = leg hints | Right may be partial (Ex #1) |
| New npm deps | User approval required | PDF lib TBD |

## Blockers

_None for CSV on Examples #1–#2._ Need more CSV types for leg heuristics beyond mirror pattern.

## Out of scope (until requested)

- Backend / auth / collaboration
- Bentley API integration
- PDF export library

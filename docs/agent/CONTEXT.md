# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

**Splice Detail Canvas** — frontend PWA that imports Bentley OpenComms CSV splice reports, auto-generates splice detail diagrams on a React Flow canvas, and allows drag-to-polish.

**Full spec:** [`SCOPE.md`](./SCOPE.md)  
**Reference:** [`docs/reference/`](../reference/) (CSVs, PDFs, images)

## Current phase

**Import layout overhaul** — adaptive row gaps, height-balanced side assignment, barycenter cable stacking, hardened center routing.

**Working:** CSV import → composite cable nodes; measured OS label spans; adaptive stub/split row gaps; barycenter stack order; runtime midX min-sep + EDGE-012 vertical deconfliction; drag rebalances `rowOffset`.

**Still to polish:** PNG parity; PDF export (needs dep approval).

## Layout invariants (locked)

**Canonical rules:** [`LAYOUT_RULES.md`](./LAYOUT_RULES.md) — 30 rule IDs (FBR/TUB/CBL/ROW/DOM/EDGE/STR).  
**Enforcement:** `src/features/diagram/layoutRules.ts` + `layoutRules.test.ts` (Examples #1–#3 + production CSVs incl. `SPI-215_I-80.csv`).  
**Agent rule:** `.cursor/rules/layout-rules.mdc` — **alwaysApply** (every agent request).

When adding layout behavior: update rules doc + checker + contract test in the same change.

## Recent (2026-05-24)

- **Adaptive row gaps:** stub/split boundaries use 24–48px (`adaptiveBoundaryRowGap`) instead of full cable height
- **Side scoring:** `heightImbalance` term balances left/right stack height
- **Stack order:** barycenter sort replaces hardcoded DROP/DK/2700/3175 heuristics
- **Routing:** measured OS tags; shrinkable inset floor; `enforceDistinctMidXLanes`; EDGE-012 vertical deconflict
- **Tubes:** per-tube horizontal length scales with fiber count
- **Drag:** cable drag end re-derives `rowOffset` from live handle Y
- **Cross-side bundle pack:** fixed 24px sep, anchored at the **median row-offset-proportional ideal midX** (with global maxRowOffset). Bundles spread along the full center span by global row position — low-row bundles near source, high-row bundles near target — instead of all clustering at the band midpoint
- **Bundle trunk:** `bundleJogXForMembers` anchors trunk at the source-side midX (least-inward), so per-strand fan-out flows in the same direction as the source H — collapses into a clean single elbow, no reverse-direction overshoot
- **Global deconfliction:** `assignSideHorizLaneYs` + `assignSideVertLaneXs` now share one occupied ledger across all routing zones — strands from different cable pairs no longer stack on the same H/V track
- **Width-stable toggle:** `importLayoutWidthForGraph` always sizes for the expanded graph; full-butt collapse never resizes the diagram
- **Wider center floor:** `minCenterGapForRowSpan` floor 200 → 320px so busy multi-cable diagrams have routing headroom
- **Import fitView:** CSV import waits for node measurement (`useNodesInitialized`) before `fitView`; cable nodes carry explicit width/height for reliable bounds

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| CSV import | Direct interpret + internal normalize | No cleaned.csv rewrite |
| Cable leg identity | **Cable name only** at splice | Remote `device` diagnostic only |
| Side assignment | Bend-first exhaustive + height balance | `compareSideAssignments` in `layoutScoring.ts` |
| Cable stack order | Barycenter (2-pass Sugiyama) | Dominant pair still first |
| Full butt splice | **Auto-enable on import** when detected | Toggle persists; row layout excludes collapsed fiber pairs |
| Canvas | `@xyflow/react` | LayoutOverrides v8 |
| Layout scope | Auto-layout on **import** + drag rowOffset refresh | No full resize re-layout |
| Same-side routing | Inward H–V–H detour | 60px jog after measured OS column |
| Center spacing | Packed midX lanes per zone | Min 24px; never collapse on infeasible inset |
| Horizontal stacking | Offset Y tracks in gap | `assignSideHorizLaneYs` |
| Vertical stacking | Offset midX when Y spans overlap | EDGE-012 / `assignSideVertLaneXs` |
| Layout regressions | Rules doc + contract tests | Must pass before merge |
| New npm deps | User approval required | PDF lib TBD |
| Hosting | GitHub Pages via GitHub Actions | `deploy-github-pages.yml` |

## Blockers

_None for CSV on Examples #1–#3 or production reference files (incl. SPI-215)._

## Out of scope (until requested)

- Backend / auth / collaboration
- Bentley API integration
- PDF export library
- Per-fiber / per-tube drag handles, inspector, undo/redo, SVG export

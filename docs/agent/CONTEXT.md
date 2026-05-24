# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

**Splice Detail Canvas** — frontend PWA that imports Bentley OpenComms CSV splice reports, auto-generates splice detail diagrams on a React Flow canvas, and allows drag-to-polish.

**Full spec:** [`SCOPE.md`](./SCOPE.md)  
**Reference:** [`docs/reference/`](../reference/) (CSVs, PDFs, images)

## Current phase

**Splice routing spacing** — vertical lanes at 24px in center; horizontal legs never stack on the same Y track.

**Working:** CSV import → composite cable nodes; aligned fiber label columns; OS-aware 60px jog; tube-bundle grouped trunks; EDGE-011 no same-track stacking (Examples #1–#3 green).

**Still to polish:** PNG parity; PDF export (needs dep approval).

## Layout invariants (locked)

**Canonical rules:** [`LAYOUT_RULES.md`](./LAYOUT_RULES.md) — 29 rule IDs (FBR/TUB/CBL/ROW/DOM/EDGE/STR).  
**Enforcement:** `src/features/diagram/layoutRules.ts` + `layoutRules.test.ts` (Examples #1–#3 + production CSVs incl. `SPI-215_I-80.csv`).  
**Agent rule:** `.cursor/rules/layout-rules.mdc` — **alwaysApply** (every agent request).

When adding layout behavior: update rules doc + checker + contract test in the same change.

## Recent (2026-05-23)

- **EDGE-011 side horizontal tracks:** `sourceHorizY` / `targetHorizY` per routing zone — 24px Y offsets when aligned-row horizontals would overlap (incl. cross-leg source vs target)
- **EDGE-010 tube bundles:** 24px-spaced `midX` lanes + shared `jogX` trunk (not one collapsed lane)
- **EDGE-009 OS-aware jog:** 60px inward after longest OS/circuit tag per side

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| CSV import | Direct interpret + internal normalize | No cleaned.csv rewrite |
| Cable leg identity | **Cable name only** at splice | Remote `device` diagnostic only |
| Side assignment | Bend-first exhaustive + scoring pick | `compareSideAssignments` in `layoutScoring.ts` |
| Full butt splice | **Auto-enable on import** when detected | Toggle persists; row layout excludes collapsed fiber pairs |
| Canvas | `@xyflow/react` | LayoutOverrides v8 |
| Layout scope | Auto-layout on **import only** | User drags final; no resize re-layout |
| Same-side routing | Inward H–V–H detour | 60px jog after OS column; lanes packed per column |
| Stem alignment | Shared `alignedStemX` per side | Fiber OS + color labels column-align; tubes stretch |
| Center spacing | Packed midX lanes per zone | Min 24px (`SPLICE_LANE_SEP`); upward/downward groups interleave |
| Horizontal stacking | Offset Y tracks in gap | `assignSideHorizLaneYs` — zone-wide occupancy |
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

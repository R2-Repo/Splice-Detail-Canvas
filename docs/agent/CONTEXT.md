# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

**Splice Detail Canvas** — frontend PWA that imports Bentley OpenComms CSV splice reports, auto-generates splice detail diagrams on a React Flow canvas, allows drag-to-polish, and exports PDFs matching industry visual style.

**Full spec:** [`SCOPE.md`](./SCOPE.md)  
**Reference:** [`docs/reference/`](../reference/) (CSVs, PDFs, images)

## Current phase

**CSV interpretation — Examples #1 & #2 pass (574/574, 4/4 Left rows).** Canvas/layout **frozen** until more example CSVs confirm leg rules on other splice types.

**Import pipeline:** Direct Bentley parse → per-row results + failure taxonomy → `SpliceReport` → inspect report UI. No user CSV cleanup step. See [`CSV_SEMANTICS.md`](./CSV_SEMANTICS.md).

## Active goals (next)

- User: add 2–3 more example CSVs (butt, ring, multi-drop) with expected counts in `CSV_SEMANTICS.md`
- After validation on real exports: resume canvas/layout (MVP-b)
- MVP-c: visual parity, PDF export (needs dep approval)

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

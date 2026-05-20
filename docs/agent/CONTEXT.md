# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

**Splice Detail Canvas** — frontend PWA that imports Bentley OpenComms CSV splice reports, auto-generates splice detail diagrams on a React Flow canvas, allows drag-to-polish, and exports PDFs matching industry visual style.

**Full spec:** [`SCOPE.md`](./SCOPE.md)  
**Reference:** [`docs/reference/`](../reference/) (CSVs, PDFs, images)

## Current phase

**Scope defined — begin MVP-a implementation.**

Bootstrap (Vite + React 19 + React Flow shell) is complete. Next: CSV parser → domain model → layout → custom splice nodes.

## Active goals (MVP-a)

- [ ] Bentley CSV parser + splice-pair graph (Example #2 first)
- [ ] Fiber color code library (12-color, striped `*-BK`)
- [ ] Auto-layout with CSV side hints (optimizer may override)
- [ ] Custom schematic nodes (cable circle, thick tube, thin strand, black-dot splice)
- [ ] CSV import UI on canvas
- [ ] `npm run dev` for live local preview

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| Canvas | `@xyflow/react` | Interaction layer; not generic workflow UI |
| Architecture | Model-first | CSV → graph → layout → canvas → export |
| CSV | Connected pairs only | Matches Bentley export setting |
| Left/Right in CSV | Soft hints | Layout optimizer may reassign sides |
| Full tube splice | Tube-to-tube collapse | All 12 fibers same-color tube → no fiber breakout |
| Dashed lines | Manual only | “Existing / protect in place”; not in CSV |
| PDF screenshots | Visual spec | Text in PDFs low priority |
| PDFs vs CSVs | Unrelated examples | No 1:1 mapping |
| Persistence | localStorage (MVP) | Layout overrides separate from CSV |
| New npm deps | User approval required | PDF lib TBD |
| Dev server | `npm run dev` | Vite, usually localhost:5173 |

## Blockers

_None._

## Out of scope (until requested)

- Backend / auth / collaboration
- Bentley API integration
- 6-count buffer tube rules

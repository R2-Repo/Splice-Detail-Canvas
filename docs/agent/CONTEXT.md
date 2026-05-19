# Context

> Agents: update this file when goals, scope, or decisions change.

## Product

Node workflow canvas PWA for splice/detail-style workflows. Frontend only.

**Product definition:** [`SCOPE.md`](./SCOPE.md) (awaiting user input).  
**Reference files:** [`docs/reference/`](../reference/) (examples, images, resources).

## Current phase

**Bootstrap complete** — Vite + React + React Flow shell. Scope doc + reference folder ready. Awaiting user scope.

## Active goals

- [ ] Define domain node types and edges (user input needed)
- [ ] Persist graph state (localStorage vs export — TBD)
- [ ] Custom node UI for “detail” panels

## Decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| Canvas | `@xyflow/react` | Standard for node editors |
| State | Local component state for now | Lift to store when complexity grows |
| Styling | Plain CSS in `src/styles/` | Add Tailwind only if user requests |

## Blockers

_None._

## Out of scope (until requested)

- Backend / auth
- Real-time collaboration

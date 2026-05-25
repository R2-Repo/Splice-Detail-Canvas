# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-25 — post-drag bundle order fix (3161.4 BL 1–12).

## Done

- **Post-drag ordering:** `recomputeRowOffsetsFromHandleYs` groups by `tubeBundleKey` (not routing zone); bundled fibers keep import `rowOffset` in `assignSpliceRoutingLanesFromLiveHandles`
- **Live drag:** `publishDragRoutingSnapshot` on drag start/move; `useRoutingLaneIndex` reads full-graph snapshot (no partial registry)
- **Drag stop:** `assignSpliceRoutingLanesFromLiveHandles` + fresh `diagramCenterX` when layout width expands
- **`visualQa3161.test.ts`** — simulated cable Y drag regression for BL 1–12 monotonic midX
- Prior: split-zone global pack, `~N` bundle key normalize, import-time BL bundle fix

## Next

- User re-test: load `?fixture=3161.4`, drag a cable node — BL 1–12 should stay nested parallel
- **Deferred:** BL/OR spur loop-back bends after drag (non-90° offshoot) — separate issue

## Commands verified

- `npm run verify`

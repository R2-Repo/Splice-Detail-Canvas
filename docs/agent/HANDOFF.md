# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-24 — EDGE-009 OS-aware horizontal-first routing (source + target legs).

## Done

- **Clear-X helpers:** `inwardClearXBeforeVertical` / `targetClearXBeforeVertical` delegate to `minClearMidXForHandle` with `sideSpans` + tag width; removed unused `sourceHorizClearX`.
- **Path builder:** `buildDemarcatedSplicePaths` always runs handle-row horizontal to `sourceClearX` before Y bends; target leg uses `targetClearX` before vertical to handle row (no vertical at `targetX`).
- **Render wiring:** `SpliceEdge` passes tag widths into `buildSplicePath`.
- **Segment sync:** `hvDemarcatedSegments` / `spliceRouteSegments` match renderer; EDGE-011 deconflict uses gap horizontals only (`sourceGapHorizSegments` / `targetGapHorizSegments`).
- **EDGE-009 enforcement:** `sameSideSplicesDetourTowardCenter` checks `splicePathsAvoidHandleColumnVertical` on packed lanes.
- **Tests + docs:** routing regressions; `LAYOUT_RULES.md` EDGE-009 wording; **`npm run verify`** passes.

## Try it

1. `npm run dev`
2. Re-import CSV (routing recomputed)
3. Strands should run horizontally past OS labels before any vertical bend — import and after cable drag

## Next

- Match PNG typography exactly
- PDF export (needs dep approval)

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci`
- `npm run build`

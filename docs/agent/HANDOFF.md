# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-23 — Horizontal + vertical strand spacing (EDGE-011 fix).

## Done

- **EDGE-011 no same-track stacking:** `parallelSpliceSegmentsOverlap` flags collinear overlap only; zone-wide `assignSideHorizLaneYs` assigns `sourceHorizY` / `targetHorizY` (24px apart) when horizontal legs would stack — including aligned-row source vs target legs (Example #3)
- **Path builders** use side offsets: short V jog at handle, horizontal at offset Y, final V into handle on target side
- **EDGE-010 retained:** tube bundles get spaced `midX` lanes + shared `jogX` trunk (not collapsed to one vertical)
- **`maxSpliceBendsForLane`** raises bend budget when jog + side offsets apply

## Try it

```bash
npm run verify
npm run dev
```

Re-import Example #3 / busy splice — no fibers drawn on top of each other on horizontal or vertical tracks; tube fibers to same target stay grouped via shared `jogX` then fan to 24px vertical lanes.

## Next

- User visual check on production CSVs
- fitView zoom cap
- Match PNG typography exactly

## Commands verified

- `npm run test:layout` ✓
- `npm run check` (after unused fn removal)
- `npm run test:ci`
- `npm run build`

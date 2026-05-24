# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-24 — Import fitView after CSV load.

## Done

- **Import fitView:** `WorkflowCanvas` defers `fitView` until `useNodesInitialized`; cable nodes get explicit `width`/`height` in `buildReactFlowGraph` so bounds are correct on first frame
- **Phase 2:** `heightImbalance` in side scoring; barycenter cable stack order in `canvasPlacement.ts`
- **Phase 3:** Measured OS labels (`canvas.measureText`); shrinkable inset + `enforceDistinctMidXLanes`; EDGE-012 vertical deconflict; drag `rowOffset` rebalance
- **Phase 4:** Per-tube horizontal length scales with fiber count in `cableBreakoutGeometry.ts`
- **Phase 5:** Removed dead code (`csvSideHint`, `parseDataRow`, `generateSideAssignmentCandidates`, `minHorizontalInsetBounds`, `pairEndpointsForDetection`)
- **Phase 6:** Updated `LAYOUT_RULES.md`, `CONTEXT.md`, `HANDOFF.md`
- **Cross-side bundle:** `packMidXLanes` cross-side branch uses fixed 24px sep, anchored at the **median row-offset-proportional ideal midX**. `assignSpliceMidXLanes` threads global maxRowOffset into per-zone packing so bundles spread by global row position — bundles whose strands sit near the top of the row order anchor near source; bundles near the bottom anchor near target. The full center span of the canvas gets used instead of one narrow column at the band midpoint
- **V-deconflict clamp:** `assignSideVertLaneXs` will not shift midX past the strand's own targetX — fallback to original lane on infeasible push. Kills the aqua-strand loop-back regression that the previous global pass introduced
- **Bundle trunk position:** `bundleJogXForMembers` flipped to least-inward midX (closest to source). Source-H and per-strand fan-out now flow in one direction → clean source-side elbow per strand, no overshoot/loop-back
- **Cross-zone deconfliction:** EDGE-011/012 globalized — `assignSideHorizLaneYs` + `assignSideVertLaneXs` use one occupied ledger across the whole diagram. Strands from different cable pairs are guaranteed 24px apart on shared tracks
- **Width-stable on butt-splice toggle:** `importLayoutWidthForGraph` ignores `collapse` for sizing — toggle no longer reflows column X
- **Center floor:** `minCenterGapForRowSpan` minimum bumped 200 → 320px (gives global vertical-lane pass room to spread without forcing midX past the inset bounds)

## Try it

```bash
npm run verify
npm run dev
```

Re-import SPI-215 / 11400S — shorter diagram height, balanced sides, no vertical strand stacking in center.

## Next

- User visual check on production CSVs (confirm import fitView frames full diagram)
- Match PNG typography exactly

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci`
- `npm run build`

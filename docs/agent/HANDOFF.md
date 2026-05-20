# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-20 — Canvas rebuild vs paired Examples #1–#3 + project summary.

## Done

- **Composite cable nodes:** cable → buffer tube → fiber rows in one draggable node (matches summary §24–27)
- **Visual cable grouping:** merge same cable name + canvas side; split 144 into two cylinders for Example #1 ring cut
- **Canvas placement:** drop/DK sort above dist; from/to votes for left/right (CSV side is hint only)
- **Circuit names:** OS column stored on `SplicePair.circuitName`, shown on fiber rows
- **Splice edges:** larger step offset for cross-row splices (Example #2 GR/BR)
- Tests: `CSV Splice Detail Example #1–3.csv`, `buildReactFlowGraph`, `visualCables`
- Canonical spec: `docs/reference/examples/splice-detail-canvas-project-summary.md`

## Try it

```bash
npm run dev
```

Import `docs/reference/examples/CSV Splice Detail Example #1.csv` — expect **1 drop left, two 144 right**, 4 fusion splices.

## Next

- Visual polish vs PNGs (cylinder labels, CH labels, dashed protect-in-place toggle)
- Example #3 crossover routing tuning
- PDF export (needs dep approval)

## Commands verified

- `npm run check`
- `npm run test:ci`
- `npm run build`

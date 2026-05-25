# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-25 — merged reset to `main`; programmatic QA complete.

## Done

- **Merged** `chore/repo-reset-v1` → `main` (fast-forward)
- **Programmatic QA:** `npm run verify` — 268 tests, all 31 layout rules pass Examples #1–#3 + SPI-215 / 300N_MAIN / production CSVs
- **Baseline tag:** `layout-baseline-v1` on `main`
- **Dev server:** app loads at http://localhost:5174/

## User visual QA (still needed)

1. Hard refresh → import Example #1, #2, #3
2. Import `SPI-215_I-80.csv`
3. Compare to PNGs in `docs/reference/examples/`
4. Report any visual issues with example # + screenshot

## Next scoped fix (if visual QA finds overlap)

```
Baseline: layout-baseline-v1
Task: EDGE-011 horizontal deconflict via midX only (no Y-track bends)
Example: [user reports which]
Rule ID: EDGE-011
Files allowed: spliceEdgeRouting.ts only if approved
Must pass: npm run verify
```

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci`
- `npm run build`

# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-20 — Example #3 crossover row-order fix.

## Done

- **Bug:** RD/BK (CH 2101) on 24 DIST blue buffer tube rendered below orange tube
- **Cause:** Row index followed Left CSV parse order; DK6↔24 DIST pairs at file end got rows 24–25
- **Fix:** `connectionsInRowLayoutOrder()` sorts by through-cable fiber #; stub DK6/DK-6 pairs sort after through rows
- **Files:** `connectionRowOrder.ts`, `throughCable.ts`, `visualCables.ts`, `spliceRowLayout.ts`, test in `connectionRowOrder.test.ts`

## Try it

```bash
npm run dev
```

Import Example #3 — RD/BK on 24 DIST BL tube should sit between WH and YL (not under OR).

## Next

- Match PNG typography exactly
- PDF export (needs dep approval)

## Commands verified

- `npm run check`
- `npm run test:ci`
- `npm run build`

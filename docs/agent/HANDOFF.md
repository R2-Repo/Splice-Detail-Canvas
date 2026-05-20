# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-20 — Restored Example #1 ring-cut split (3 cable nodes).

## Done

- **Example #1 regression:** re-enabled `buildVisualCables` split for through 144 vs one drop leg → 1 drop + **2× 144** right (not one merged 144); equal 40px row/lane spacing kept
- **Aligned splice rows:** each connection shares one horizontal Y on left and right (fixes crossover/straight routing)
- **Cable placement:** Example #2 order (drop top-left, dist 2700 bottom-left, dist 3175 top-right, DK-6 bottom-right)
- **Protect-in-place:** click any splice edge to toggle dashed gray line (no fusion dot); saved in `localStorage`
- **Labels:** `006 SMFO (R2)` + cable name; circuit `(CH 2090)` on fiber rows
- **Handles:** per fiber row (fixes misaligned edges)
- **Wider canvas** (1400px layout width)

## Try it

```bash
npm run dev
```

Import `CSV Splice Detail Example #2.csv` — click splice lines to mark existing/protect-in-place.

## Next

- Match PNG typography/spacing exactly
- Example #3 dense crossover tuning
- PDF export (needs dep approval)

## Commands verified

- `npm run check`
- `npm run test:ci`
- `npm run build`

# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-25 — collapsed buffer tube sheath attachment fix.

## Done

- **Collapsed tube fix:** buffer tube line starts at `tube.origin` (sheath face) and runs to stem handle Y — no longer floats beside the node when collapsed
- **Prior:** hybrid TUB-001 (horizontal on-sheath / fan from center for multi-tube); expanded ignores `visualShiftY`
- **`npm run verify`** passes

## Try it

1. Hard refresh + re-import
2. Multi-tube cables (24-fiber BL+OR, Example #3, production CSVs) should show sheath-connected fan-outs again
3. Single-tube pairs should still have horizontal buffer tubes and even fan angles

## Next

- Revisit EDGE-011 deconflict without breaking EDGE-004
- PNG typography; PDF export (dep approval)

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci`
- `npm run build`

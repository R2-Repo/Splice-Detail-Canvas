# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-20 — CSV import plan (Phase 1): failure taxonomy + Example #1 parse gap closed.

## Done

- Per-row `ParseRowResult` with reason codes; `leftRowResults` on `SpliceReport`
- Inspect report: failure breakdown + sample lines (`inspectBentleyCsv` / UI)
- To-side parser: fixed tail (fiber#, tube, fiber, device [, OS]); `EL-###` OS; trailing comma trim
- Example #1: **574/574** Left rows parse; Example #2: **4/4** unchanged
- `tokenizeBentleyRow` intermediate step in `bentleyRow.ts`
- `CSV_SEMANTICS.md` updated with confirmed rules + example matrix

## Try it

```bash
npm run dev
```

Import `docs/reference/examples/Bentley OpenComms Output Example #1.csv` → **Show CSV parse report** (gap should be 0).

## Next

1. User supplies 2–3 more example CSVs (see `CSV_SEMANTICS.md` matrix A–C)
2. Confirm open questions (fiber # scope, partial Right section)
3. **Then** resume canvas: Example #1 scale, dashed-line toggle, layout polish

## Commands verified

- `npm run check`
- `npm run test:ci`
- `npm run build`

## Warnings

- Do not add npm packages without user approval.
- Do not assume Right `---` mirrors Left on large exports.

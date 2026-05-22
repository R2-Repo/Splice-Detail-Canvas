# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-22 — canvas stage now measures its width so imports stretch across the screen, while the white background/contrast refresh remains in place.

## Done

- **Canvas visuals refresh** — overview minimap removed, global styles switched to a white background, and toolbar/inspect/cable-node text + borders now use darker colors for clarity on the lighter canvas
- **Dynamic width layout** — `WorkflowCanvas` wraps `ReactFlow` in a measurable stage, tracks its rendered width via `ResizeObserver`, and re-applies the layout whenever that width changes so thicker imports always spread the left/right columns across the available canvas.
- **`buildReactFlowGraph.ts`** — after layout + position overrides, `displaySideFromCanvasX` sets each cable's display side so breakout/handles point toward center
- **`WorkflowCanvas.tsx`** — `onNodeDrag` flips a cable's display side while dragging so fiber strands and tubes reroute toward center immediately
- **`buildReactFlowGraph.test.ts`** — saved position wins over stale `cableSides` override
- **`cableBreakoutGeometry.test.ts`** — strands fan inward for left/right sides
- **`spliceRowLayout.ts`** — `computeCableXBounds` expands left/right offsets when one side fills with cables and column Xs ignore tube count so nodes stay vertically aligned
- **`spliceRowLayout.test.ts`** — validates spacing grows as a side fills with cables
- **GitHub Pages deployment** — new `deploy-github-pages.yml`, Vite base toggle, and README instructions so `main` pushes publish `dist/` to the `gh-pages` branch automatically.
- Prior: cable-name-only import; one canvas node per physical cable; edge wiring fix

## Try it

```bash
npm run test:layout   # required before finishing
npm run verify
npm run dev
```

Import `docs/reference/examples/SP-I-15_11400S.csv` → **6** cable nodes (not 12).

Examples #1–#3 unchanged (3 / 4 / 4 nodes). 300N_MAIN butt-splice collapse still works.

## Next

- Match PNG typography exactly
- PDF export (needs dep approval)

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci` (135 tests)
- `npm run build`

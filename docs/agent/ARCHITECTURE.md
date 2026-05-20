# Architecture

## Layout

```
src/
  components/        # Shared UI (AppShell, import button, etc.)
  features/
    canvas/          # React Flow host (WorkflowCanvas.tsx)
    import/          # CSV parser, file upload (add)
    diagram/         # Domain model, layout, color code, custom nodes/edges (add)
    export/          # PDF/SVG export (add, later)
  hooks/
  lib/               # Pure utilities
  types/             # Shared TS types (SplicePair, endpoints, etc.)
  styles/
docs/agent/          # SCOPE, CONTEXT, HANDOFF
docs/reference/      # User examples, images (not shipped)
```

## Data flow

```
Bentley CSV
  → parse (SplicePair graph, dedupe mirrors)
  → layout (side hints, ordering, coordinates)
  → React Flow (edit + persist overrides)
  → export (model + layout → PDF/SVG)
```

## Canvas feature (current)

- `features/canvas/WorkflowCanvas.tsx` — React Flow host
- `features/canvas/initialGraph.ts` — placeholder seed (replace with import-driven graph)
- `features/canvas/nodes/` — custom splice node components (add)

## Conventions

- Functional components; `@/` imports
- Domain types in `src/types/`; parser/layout pure functions testable without React
- Tests next to source or in feature folder

## Extension checklist

1. Types: `SplicePair`, `FiberEndpoint`, `CableLeg`, layout overrides
2. Parser: `features/import/parseBentleyCsv.ts`
3. Color code: `features/diagram/colorCode.ts`
4. Layout: `features/diagram/layoutSpliceDiagram.ts`
5. Nodes/edges: register in `nodeTypes` / `edgeTypes`
6. Import UI → build graph → render on canvas
7. localStorage for layout overrides

## PWA

Configured in `vite.config.ts` via `vite-plugin-pwa`.

## Local dev

```bash
npm run dev
```

Vite dev server — typically http://localhost:5173

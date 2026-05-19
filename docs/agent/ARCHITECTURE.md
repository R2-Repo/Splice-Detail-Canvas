# Architecture

## Layout

```
src/
  components/     # Shared UI (layout, primitives)
  features/       # Feature modules (canvas, etc.)
  hooks/          # Reusable hooks
  lib/            # Pure utilities
  types/          # Shared TS types
  styles/         # Global CSS
  test/           # Test setup
docs/agent/       # SCOPE, CONTEXT, HANDOFF (not shipped)
docs/reference/   # User examples, images, resources (not shipped)
.cursor/rules/    # Cursor agent rules
```

## Canvas feature

- `features/canvas/WorkflowCanvas.tsx` — React Flow host
- `features/canvas/initialGraph.ts` — seed nodes/edges
- `features/canvas/nodes/` — custom node types (add here)

## Conventions

- Functional components, named exports for non-page components
- Colocate feature code under `features/<name>/`
- Types: prefer `type` for props; domain types in `src/types/`
- Tests: `*.test.tsx` next to source or under feature folder

## PWA

Configured in `vite.config.ts` via `vite-plugin-pwa`. Service worker auto-updates in production builds.

## Extension checklist

1. Add node component + register in `nodeTypes`
2. Extend graph types in `src/types/`
3. Update `initialGraph` or load from persistence layer in `lib/`

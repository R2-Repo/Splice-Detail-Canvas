# Agent guide — Splice Detail Canvas

Frontend-only React PWA: node/workflow canvas (React Flow). No backend unless the user adds one.

## Read first

| File | Purpose |
|------|---------|
| `docs/agent/SCOPE.md` | Product vision, MVP, features, non-goals |
| `docs/agent/CONTEXT.md` | Current focus, decisions, blockers |
| `docs/agent/HANDOFF.md` | Last session summary for the next agent |
| `docs/agent/ARCHITECTURE.md` | Folders, patterns, extension points |
| `docs/reference/` | User-provided examples, images, resources (when cited) |

## Workflow

1. Read SCOPE, then CONTEXT + HANDOFF before coding.
2. Plan in bullets; ask if requirements are unclear.
3. Implement in `src/` using existing patterns.
4. Run `npm run check`, `npm run test:ci`, `npm run build`.
5. Update CONTEXT + HANDOFF before ending the session.

## Constraints

- Do not add npm packages without user approval (except this bootstrap stack).
- Do not invent APIs, env vars, or backends.
- Keep changes scoped to the task.
- Prefer `@/` imports from `src/`.

## Stack

- Vite 6, React 19, TypeScript (strict)
- `@xyflow/react` for the canvas
- Vitest + Testing Library
- `vite-plugin-pwa` for installable PWA

## Commands

```bash
npm run dev      # local dev server
npm run check    # typecheck
npm run test:ci  # unit tests
npm run build    # production build
```

## Response style

Short bullets; no long recaps. User can type **expand** for detail.

# Splice Detail Canvas

Modern **frontend-only** React PWA: a node/workflow canvas app built for agentic development in Cursor.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript check |
| `npm run test` | Vitest (watch) |
| `npm run test:ci` | Vitest (CI) |
| `npm run lint` | ESLint |

## For Cursor agents

See **[AGENTS.md](./AGENTS.md)** — workflow, constraints, and handoff files in `docs/agent/`.

## Stack

- Vite + React 19 + TypeScript
- [@xyflow/react](https://reactflow.dev/) for the canvas
- Vitest + Testing Library
- PWA via `vite-plugin-pwa`

## Project layout

```
src/features/canvas/   # Workflow canvas (React Flow)
src/components/        # Shared UI
docs/agent/            # SCOPE, CONTEXT, HANDOFF for agents
docs/reference/        # Your examples, images, resources
.cursor/rules/         # Cursor rules
```

## Reference materials

Add screenshots, specs, and sample files under [`docs/reference/`](./docs/reference/) when ready. See that folder’s README for subfolder layout.

## Vision

Agent-maintained context files, minimal token chatter, and production-ready features — see original goals in git history or ask the agent to **expand** `docs/agent/CONTEXT.md`.

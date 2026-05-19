# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-19 — Scope template + reference folder.

## Done

- Vite + React 19 + TypeScript + PWA plugin
- React Flow canvas with two starter nodes
- Agent docs, `AGENTS.md`, Cursor rules
- Vitest smoke test, CI workflow
- `docs/agent/SCOPE.md` (template, user to fill)
- `docs/reference/` (`examples/`, `images/`, `resources/`)

## Next

- User defines product in `SCOPE.md` (or via chat → agent transcribes)
- User drops reference files into `docs/reference/` as needed
- Confirm domain model (node types, data shape)
- Add custom node components under `src/features/canvas/nodes/`
- Decide persistence (JSON export, localStorage, etc.)

## Commands verified

- `npm run check`
- `npm run test:ci`
- `npm run build`

## Warnings

- `.git/config` still has a `[submodule]` section from an old copy; safe to remove manually if git acts odd.

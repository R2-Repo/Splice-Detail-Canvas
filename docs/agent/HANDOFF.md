# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-21 — Layout rules always-on for agents + `test:layout` gate.

## Done

- **`docs/agent/LAYOUT_RULES.md`** — 21 must-keep rule IDs for cables, tubes, fibers, rows, dominant pair, edges
- **`src/features/diagram/layoutRules.ts`** — programmatic invariant checks (`checkLayoutRule`, `checkAllLayoutRules`)
- **`src/features/diagram/layoutRules.test.ts`** — contract suite: every rule × Examples #1–#3 reference CSVs
- **`.cursor/rules/layout-rules.mdc`** — agents must read rules + run tests on diagram/canvas changes
- **`AGENTS.md`** updated to reference LAYOUT_RULES.md
- **`layout-rules.mdc`** now `alwaysApply: true` — agents see rules every request
- **`npm run test:layout`** + **`npm run verify`** — explicit layout contract gate

## Maintenance protocol

New layout feature → add rule ID in `LAYOUT_RULES.md` → implement check in `layoutRules.ts` → extend `layoutRules.test.ts` → `npm run test:ci`.

## Try it

```bash
npm run test:layout   # required before finishing
npm run verify        # full gate
npm run dev
```

## Next

- Match PNG typography exactly
- PDF export (needs dep approval)

## Commands verified

- `npm run check`
- `npm run test:ci`
- `npm run build`

# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-25 — repo reset & stabilization baseline.

## Done

- **Doc reset:** `CONTEXT.md` trimmed to current-only; `RULE_PRIORITY.md`, `CHANGELOG.md`, `docs/archive/` created
- **Stale docs fixed:** `ARCHITECTURE.md`, `AGENTS.md`, `.cursor/rules/project-core.mdc`, `SCOPE.md` stabilization gate
- **Archived:** `splice-detail-canvas-project-summary.md` → `docs/archive/`
- **Dead code removed:** `initialGraph.ts`; `MAX_SPLICE_BENDS_WITH_BUNDLE_JOG` alias removed (`spliceLaneYTrackHelpers` kept — EDGE-011 dead code under EDGE-004, satisfies TS)
- **Baseline:** branch `chore/repo-reset-v1`, tag `layout-baseline-v1`
- **`npm run verify`** passes

## User must do (visual QA)

1. Hard refresh, import Example #1, #2, #3 CSVs
2. Import `SPI-215_I-80.csv`
3. Screenshot each; compare to PNGs in `docs/reference/examples/`
4. Report visual regressions → revert to tag `layout-baseline-v1`

## Next agent session template

```
Baseline: layout-baseline-v1
Task: [one specific bug]
Example: [#2 only]
Rule ID: [e.g. TUB-001]
Files allowed: [max 2 paths]
Must pass: npm run verify
Do not touch: spliceEdgeRouting.ts (unless listed)
Plan in Ask mode first; implement only approved file list.
```

## Next

- User visual QA on Examples #1–#3
- Then: one scoped layout bug per session (EDGE-011 vs EDGE-004 if still visible)

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci`
- `npm run build`

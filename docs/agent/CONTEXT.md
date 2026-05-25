# Context

> Agents: keep this file current-only. History lives in git log and [`CHANGELOG.md`](./CHANGELOG.md).

## Baseline

- Branch/tag: `layout-baseline-v1` (created repo-reset session)
- Verified: `npm run verify` + Examples #1–#3 CSV import

## Current phase

**Layout stabilization** — no new features until baseline holds across sessions.

## In scope NOW

- Bug fixes: one example, one rule ID, max 2 source files per session
- Doc/code hygiene (repo reset complete)

## Out of scope until stabilization complete

- PDF export, PNG typography polish, new layout rule IDs
- Refactors of `spliceEdgeRouting.ts` (split deferred)
- New npm dependencies

## Rule priority (conflicts)

See [`RULE_PRIORITY.md`](./RULE_PRIORITY.md).

## Active decisions

| Topic | Choice | Notes |
|-------|--------|-------|
| CSV import | Direct interpret + internal normalize | No cleaned.csv rewrite |
| Cable leg identity | **Cable name only** at splice | Remote `device` diagnostic only |
| Side assignment | Bend-first exhaustive + height balance | `compareSideAssignments` in `layoutScoring.ts` |
| Cable stack order | Barycenter (2-pass Sugiyama) | Dominant pair still first |
| Full butt splice | **Auto-enable on import** when detected | Toggle persists; row layout excludes collapsed fiber pairs |
| Canvas | `@xyflow/react` | LayoutOverrides v8 |
| Layout scope | Auto-layout on **import** + drag rowOffset/routing refresh for **moved cable only** | No full-diagram re-route after import |
| Same-side routing | Inward H–V–H detour | 60px jog after measured OS column |
| Center spacing | Packed midX lanes per zone | Min 24px; never collapse on infeasible inset |
| Layout regressions | Rules doc + contract tests | Must pass before merge |
| New npm deps | User approval required | PDF lib TBD |

## Known issues (ordered)

1. EDGE-011 deconflict vs EDGE-004 two-bend limit — EDGE-004 wins (see `RULE_PRIORITY.md`)
2. PNG visual parity incomplete
3. PDF export blocked on dep approval

## Blockers

None for Examples #1–#3 contract tests.

## Canonical docs (read order)

1. [`SCOPE.md`](./SCOPE.md) — product requirements
2. [`RULE_PRIORITY.md`](./RULE_PRIORITY.md) — conflict resolution
3. [`LAYOUT_RULES.md`](./LAYOUT_RULES.md) — layout contract (31 rules)
4. [`CSV_SEMANTICS.md`](./CSV_SEMANTICS.md) — parser/import semantics
5. [`HANDOFF.md`](./HANDOFF.md) — last session only

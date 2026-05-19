# Testing

## Commands

| Command | Purpose |
|--------|---------|
| `npm test` | Unit tests (Vitest). |
| `npm run test:e2e` | Browser smoke tests (Playwright); starts `npm run dev` automatically. |
| `npm run test:ci` | Runs both; use locally before pushing and in CI. |

## Rules for agents

1. **When you add or change behavior**, add or update tests in the same change set whenever reasonable.
2. **Prefer unit tests** for pure logic (modules with no DOM).
3. **Use Playwright** for user-visible flows once the UI exists. Extend `e2e/` with specs that match real user journeys.
4. **Do not merge** without `npm run test:ci` passing unless the PR **Notes** explain an agreed exception (see `docs/DEFINITION_OF_DONE.md`).

## Milestones and demos

Some goals are hard to encode only as assertions. For those:

1. Run `npm run dev` and verify the milestone in a real browser session.
2. Use **Cursor screen recording** to capture the flow for the user, or list numbered verification steps in the PR description.

## CI

Pull requests run `npm run test:ci` after install. Playwright downloads browsers in the workflow; do not commit browser binaries.

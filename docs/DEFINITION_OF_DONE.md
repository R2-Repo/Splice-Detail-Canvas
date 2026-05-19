# Definition of done (per change)

Use this checklist before marking work complete or opening a PR for review.

## Every change

- [ ] `npm run check` passes.
- [ ] `npm run build` passes.
- [ ] `npm run test:ci` passes (or document why a category of test is not applicable in the PR **Notes**).

## Behavior or UI changes

- [ ] Tests updated or added (`tests/` and/or `e2e/`) when automation is practical.
- [ ] `TASK_HISTORY.md` updated if the change is **substantive** for future agents.
- [ ] `PROJECT_OVERVIEW.md` or `docs/plans/` updated if scope, architecture, or workflow changed.

## User-visible milestones

- [ ] Verified with `npm run dev` in a browser where relevant.
- [ ] **Screen recording** attached or **numbered manual steps** in the PR (see `docs/TESTING.md`).

## Handoff or pause

- [ ] If another agent continues the work, `docs/HANDOFF.md` satisfied (handoff block or `docs/memory/` file).

## Quality (when UI exists)

- [ ] `docs/QUALITY.md` considered for layout, keyboard, and contrast impact.

## Security

- [ ] No secrets in repo or PR text; follow `docs/SECURITY.md`.

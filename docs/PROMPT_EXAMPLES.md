# Prompt Examples for Cursor Cloud Agents

See `docs/START_HERE.md` for the short path into this framework.

## Kickoff: onboarding (fresh duplicate)

```text
Read docs/ONBOARDING.md, docs/MEMORY.md, docs/HANDOFF.md, docs/DEFINITION_OF_DONE.md, and AGENTS.md. Run the full onboarding interview with me. When we agree on answers, update PROJECT_OVERVIEW.md, README.md, package.json, index.html as appropriate, and add docs/plans/00-bootstrap.md if useful. Run npm run check, npm run build, and npm run test:ci before you finish.
```

## Kickoff: review and first milestone (already onboarded)

```text
/review
Read AGENTS.md, docs/MEMORY.md, docs/DEFINITION_OF_DONE.md, PROJECT_OVERVIEW.md, and docs/TESTING.md. Propose the smallest next milestone for: [what you want]. List 2-4 file-level steps, then either stop for my approval or apply them in one focused PR. Run npm run check, npm run build, and npm run test:ci if you change code.
```

## Small feature prompt

```text
Implement [feature] for this frontend app.

Requirements:
- Keep the app frontend-only unless PROJECT_OVERVIEW.md says otherwise.
- Add or update automated tests in the same PR.
- Run npm run check, npm run build, and npm run test:ci before finishing.
- Satisfy docs/DEFINITION_OF_DONE.md.
- For anything visual, verify with npm run dev; attach a screen recording or numbered demo steps.
- Keep the final response short using Done / Tested / Notes.
- Open a PR and do not merge it.
```

## Bug fix prompt

```text
Fix: [describe the issue].

Rules:
- Smallest reasonable change.
- Add or adjust tests if they would have caught this.
- Run npm run check, npm run build, and npm run test:ci.
- Open a PR.
```

## Planning prompt

```text
Create an implementation plan for [feature name].

Do not write code yet.
Save the plan in `docs/plans/[feature-name].md`.
Keep the plan practical and broken into small PR-sized steps.
```

## PR cleanup prompt

```text
Review this branch before merge.

Check:
- Broken imports
- Large unrelated changes
- Tests and npm run test:ci
- Missing TASK_HISTORY.md update if the change was substantial
- docs/DEFINITION_OF_DONE.md checklist satisfied

Keep the final response short.
```

## Handoff to another agent (before you stop)

```text
Follow docs/HANDOFF.md. Write a handoff block (branch, PR, done, not done, commands run, next steps, open questions). Update TASK_HISTORY.md if this chunk of work is complete. Save any long context to docs/memory/YYYY-MM-DD-<topic>.md if needed.
```

## Resume after a pause

```text
Read docs/HANDOFF.md (section: after a long pause), docs/README.md, docs/MEMORY.md, PROJECT_OVERVIEW.md, and recent TASK_HISTORY.md. Run npm install if needed, then npm run check, npm run build, and npm run test:ci. Summarize current state in ~10 lines and ask what I want next.
```

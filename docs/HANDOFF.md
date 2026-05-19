# Agent handoff (sub-agents, multi-agent, and pauses)

Use this when **more than one agent** touches the repo, when a **sub-agent** (explore, review, or delegated task) returns work to a **parent** agent, or when the user **pauses** for days or weeks and a new session must resume safely.

## Principles

1. **Single writer per branch** when possible: avoid two agents pushing unrelated commits to the same branch without coordination.
2. **State lives in files**: handoff is not complete until the next agent can rely on `PROJECT_OVERVIEW.md`, `TASK_HISTORY.md`, plans, and optional `docs/memory/` without re-reading the entire chat.
3. **Small PRs**: sub-agents should return **focused** diffs or written reports, not silent mega-changes.

## Handoff to another agent or sub-agent

Before spawning a sub-agent or handing off:

1. **Write a short handoff block** (in the PR description, a new `docs/memory/YYYY-MM-DD-handoff-<topic>.md`, or a comment the user can paste). Include:
   - **Goal** of the task and **definition of done** (see `docs/DEFINITION_OF_DONE.md`).
   - **Current branch** and whether there is an open PR / URL.
   - **Files touched** or to touch; **files to avoid**.
   - **Commands already run** (`npm run test:ci`, etc.) and results.
   - **Open questions** for the user or the next agent.
2. **Update `TASK_HISTORY.md`** if this handoff concludes a meaningful chunk of work (even if the code lands in a follow-up PR).

## When a sub-agent returns

The **parent** or **next** agent should:

1. Read the handoff artifact and `TASK_HISTORY.md`.
2. Re-run `npm run check` (and `npm run test:ci` if behavior changed) on the integrated branch.
3. Resolve conflicts in favor of **`PROJECT_OVERVIEW.md`** and agreed plans unless the user says otherwise.

## Multi-agent parallelism

- **Explore / read-only agents:** Safe in parallel; they should **not** commit. Output should be a **report** (findings, file paths, suggestions) pasted or saved under `docs/memory/`.
- **Implementing agents:** Prefer **one branch per task**; merge via PR so `main` stays linear and reviewable.
- If two agents must work in parallel, **split by directory or feature** and document the split in `PROJECT_OVERVIEW.md` or `docs/memory/` to reduce duplicate or conflicting edits.

## After a long pause (user away from the project)

On the **first session back**, the agent should:

1. Read `PROJECT_OVERVIEW.md` and the **last 3–5** entries in `TASK_HISTORY.md`.
2. Skim `docs/README.md` for any governance doc you may have missed.
3. List **open PRs** (if the user provides links) and **open plans** in `docs/plans/`.
4. Run `npm install` if needed, then `npm run check`, `npm run build`, and `npm run test:ci`.
5. **Summarize** current state in 5–10 lines and ask the user what to do next (resume milestone, close tech debt, etc.).

Optional: the user can say *“read docs/HANDOFF.md and resume”* to force this path.

## Optional handoff snippet (copy-paste)

```text
Handoff:
- Branch:
- PR (if any):
- Done:
- Not done:
- Commands run (with pass/fail):
- Next agent should:
- Open questions for the user:
```

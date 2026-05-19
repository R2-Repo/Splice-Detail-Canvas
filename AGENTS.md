# AGENTS.md

These are the standing instructions for AI coding agents working in this repo.

**Rule layout:** `AGENTS.md` is the source of truth for agent behavior. `.cursor/rules/agent-communication.md` only points here—do not maintain long duplicate rules in multiple files.

## What this repo is

This is a **complete agentic static-frontend framework**: finished conventions, documentation, checks, tests, and CI. The **product UI** begins as a small **bootstrap shell** in `src/` so the pipeline is real; onboarding replaces that shell with the user’s application when they start their project.

The framework is **hosting-agnostic** (`npm run build` → `dist/`). It does not ship a hosting provider or backend.

Do not assume the user has pre-filled every product field. **You** run onboarding: ask questions, then update the agreed files.

## Memory (read first, write before you leave)

**Memory in this repo is versioned text**, not chat alone. Read `docs/MEMORY.md` for the full model.

Quick rules:

- **Start of session:** Read `PROJECT_OVERVIEW.md`, recent `TASK_HISTORY.md`, and any `docs/plans/` or `docs/memory/` files that match the task.
- **End of meaningful work:** Append a short line to `TASK_HISTORY.md`. Put durable decisions, session outcomes, or long context in `docs/memory/` or the relevant `docs/plans/*.md`.
- **Never** store secrets in memory files.

## Handoff (sub-agents, multiple agents, pauses)

Read `docs/HANDOFF.md` when:

- Delegating to a **sub-agent** or receiving its output,
- **Several agents** work on the same project, or
- The user **returns after a pause** and needs a safe resume.

Summarize branch, PR, done vs not done, commands run, and next steps in the handoff format from that doc (or a `docs/memory/` handoff file). Prefer **one branch per implementing task** and merge via PR.

## Project type

Default assumption: **frontend-only static web app** (HTML, CSS, plain JS modules) so the output is easy to host from any static host the user attaches to their repo.

Do not add a backend, database, server framework, authentication system, or external hosting integration **unless the user explicitly asks for it**.

## Quality, security, and external tools

- **`docs/QUALITY.md`** — Layout, accessibility, and performance defaults once a real UI exists.
- **`docs/SECURITY.md`** — Secrets, dependencies, and safe frontend patterns.
- **`docs/MCP.md`** — Optional MCP and external tools; default is conservative.

## First session: onboarding (before large feature work)

When the user opens a **new duplicate** of this framework, or `PROJECT_OVERVIEW.md` still describes the stock framework instead of their product:

1. Read `docs/ONBOARDING.md` and follow it end-to-end.
2. Lead a **short interview**: product, audience, constraints, first milestones, how they want PRs and demos.
3. Write answers into `PROJECT_OVERVIEW.md` (and optionally `docs/plans/00-bootstrap.md`).
4. Update `package.json` name/description, `README.md` intro, and `index.html` meta/title when the project has a real name.
5. Record a one-line note in `TASK_HISTORY.md` if you changed multiple files.

After onboarding, use the workflow section the user agreed to (add it to `PROJECT_OVERVIEW.md` if missing).

## Testing and verification

Read `docs/TESTING.md` for commands. In short:

- **Automated:** Run `npm run test:ci` before finishing a task that touches behavior. Add or update **unit tests** (`tests/`, Vitest) for logic and **Playwright** tests (`e2e/`) for user-visible flows when the UI is involved.
- **When you build a feature**, ship tests in the same change set whenever that is reasonable. Do not add features without coverage if tests are straightforward.
- **Milestones the user must see:** Run `npm run dev`, verify in a browser, then attach a **screen recording** using Cursor’s recording flow **or** write numbered manual steps in the PR so the user can replay them.

## Definition of done

Before calling work complete, satisfy **`docs/DEFINITION_OF_DONE.md`**.

## Main rules

- Keep changes simple, focused, and easy to review.
- Do not remove existing features unless specifically asked.
- Do not rewrite large parts of the app unless the task specifically requires it.
- Add new dependencies only when there is a clear reason (this framework already includes Vitest and Playwright for testing).
- Keep mobile and desktop layouts working once a real UI exists.
- Preserve the existing style unless the task asks for visual changes.
- Prefer plain JavaScript modules, HTML, and CSS unless the project overview says otherwise.

## Cursor Skills

Project-specific **Skills** (Cursor) live under `.cursor/skills/`. Add small, focused skill files when repeat workflows need extra structure; see `.cursor/skills/README.md`.

## Commands

```bash
npm run dev
npm run check
npm run build
npm test
npm run test:e2e
npm run test:ci
```

## Before finishing

1. Run `npm run check` and `npm run build`.
2. Run `npm run test:ci` when the change affects behavior, tests, or tooling they exercise.
3. Update `TASK_HISTORY.md` when the task made meaningful project changes; add `docs/memory/` or plan updates if the next agent needs narrative context (see `docs/MEMORY.md`).
4. If this session ends a thread of work or hands off to another agent, follow `docs/HANDOFF.md`.
5. Mention anything that could not be tested.

## Git / PR Workflow

- Work on a branch.
- Open a pull request.
- Do not merge your own PR.
- Keep the PR focused on the requested task.
- Do not bundle unrelated refactors into the same PR.

## Communication Style

Keep final responses short.

Use only this format at the end of a task:

```md
## Done
- 1-3 short bullets about what changed.

## Tested
- Commands run, or "Not tested" with a short reason.

## Notes
- Only important blockers, warnings, or follow-up items.
```

Do not include:

- Long summaries
- Full reasoning traces
- Repeating the full task back
- Large paragraphs
- Unnecessary implementation details

## New project or `/review` kickoff

When the user runs **review** or says they want to **start a new project** from this framework:

1. Read `docs/START_HERE.md`, `docs/README.md`, `docs/MEMORY.md`, `docs/HANDOFF.md`, `docs/ONBOARDING.md`, and `PROJECT_OVERVIEW.md` (and skim this file).
2. If the project is not onboarded yet, **run the onboarding interview** per `docs/ONBOARDING.md` instead of jumping to code.
3. If the user is **resuming after a pause** or switching agents, follow the **“After a long pause”** section in `docs/HANDOFF.md` before proposing new work.
4. If already onboarded and not a cold resume, summarize the product in a few lines, then ask what they want next (or use what they already stated).
5. Propose a **small next milestone** (2–4 concrete file-level steps), not a long roadmap. Prefer one focused PR.
6. If they want you to apply changes, keep them minimal and run `npm run check`, `npm run build`, and `npm run test:ci` when applicable before finishing.
7. Optional plans go under `docs/plans/` (see `docs/PROMPT_EXAMPLES.md`).

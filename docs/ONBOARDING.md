# Project onboarding (agent-led)

This repository is a **complete agentic static-frontend framework**. Cursor Cloud Agents use it for scope, workflow, quality, memory, and handoffs. The **bootstrap shell** in `src/` is intentional until your product UI replaces it.

## When to run this

Run onboarding when:

- The repo was just duplicated from the framework, or
- `PROJECT_OVERVIEW.md` still describes the stock framework instead of your product.

## Agent responsibilities

1. **State the mode**  
   Say clearly that this is **product onboarding** (scope and files), not a request to ship a large feature in one pass.

2. **Interview the user** (adapt wording to their answers). Capture answers in `PROJECT_OVERVIEW.md` and, if useful, `docs/plans/00-bootstrap.md`.

   Suggested topics:

   - **Product**: What are we building? Who is it for?
   - **Constraints**: Frontend-only vs other boundaries, browsers, accessibility level, performance expectations (see `docs/QUALITY.md` for defaults).
   - **Hosting**: The repo stays hosting-agnostic; only note constraints (static export, SPA, base path) that affect build output.
   - **Milestones**: 2–4 concrete outcomes for the first phase (each should be testable).
   - **Workflow**: Default branch name, PR expectations, who merges, how they want demos (local server, screen recording, Playwright artifacts).
   - **Memory and handoff**: How they want `TASK_HISTORY.md`, `docs/memory/`, and handoffs between agents or after pauses to work (see `docs/MEMORY.md`, `docs/HANDOFF.md`).
   - **MCP / external tools**: Whether any MCP servers are allowed; if yes, document in `PROJECT_OVERVIEW.md` per `docs/MCP.md`.

3. **Customize the repo** (minimal, focused edits)

   - Rewrite `PROJECT_OVERVIEW.md` with the real product summary, milestones, and file map as it grows.
   - Update `package.json` `name` and `description` if the project has a real name.
   - Update `README.md` title and one-paragraph description for humans skimming the repo.
   - Update `index.html` `<title>` and meta description to match the product.
   - Replace the **bootstrap shell** in `src/main.js` (and adjust `src/styles.css`) when the first real UI milestone ships; update `e2e/` so smoke tests match the new UI.
   - If the team wants extra agent rules for *this* product only, add short bullets to `AGENTS.md` or a linked doc under `docs/` and reference it from `AGENTS.md`.

4. **Define the agentic workflow for this project**

   Write a short subsection in `PROJECT_OVERVIEW.md` (or `docs/plans/00-bootstrap.md`) that covers:

   - How tasks are sized (one PR per task, etc.).
   - **Testing**: Every feature change adds or updates automated tests (`npm test`, `npm run test:e2e` when the UI is involved). See `docs/TESTING.md`.
   - **Definition of done**: Team agrees to follow `docs/DEFINITION_OF_DONE.md` unless they document exceptions in `PROJECT_OVERVIEW.md`.
   - **Manual verification**: For milestones that need human-visible proof, run `npm run dev`, verify in the browser, and attach a **screen recording** (Cursor’s recording flow) or describe the exact steps so the user can replay them.

5. **Log the bootstrap**

   Append one line to `TASK_HISTORY.md` when onboarding produced meaningful repo changes. If the team uses sub-agents or parallel agents, add a one-paragraph **workflow + memory** note to `PROJECT_OVERVIEW.md` pointing at `docs/MEMORY.md` and `docs/HANDOFF.md`.

## After onboarding

Use `docs/PROMPT_EXAMPLES.md` for day-to-day tasks. Prefer small PRs: implement, test, satisfy `docs/DEFINITION_OF_DONE.md`, open PR, stop.

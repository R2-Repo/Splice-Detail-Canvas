# Cursor agentic static frontend framework

A **complete** conventions package for **Cursor Cloud Agents** and humans: rules, onboarding, **versioned memory**, handoffs, automated tests, CI, quality and security defaults, and a minimal **bootstrap shell** in `src/` until your product UI ships. **Hosting-agnostic:** `npm run build` outputs `dist/` for any static host you attach to your repo.

## What is included

```text
.
├── AGENTS.md
├── CONTRIBUTING.md
├── PROJECT_OVERVIEW.md
├── TASK_HISTORY.md
├── README.md
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── playwright.config.js
├── vitest.config.js
├── src/
├── tests/              (Vitest)
├── e2e/                (Playwright)
├── scripts/
├── docs/
│   ├── README.md       (documentation index)
│   ├── START_HERE.md
│   ├── ONBOARDING.md
│   ├── MEMORY.md
│   ├── HANDOFF.md
│   ├── TESTING.md
│   ├── DEFINITION_OF_DONE.md
│   ├── QUALITY.md
│   ├── SECURITY.md
│   ├── MCP.md
│   ├── memory/
│   └── …
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── .cursor/
│   ├── rules/
│   └── skills/
```

**New here?** Open `docs/START_HERE.md`, then `docs/ONBOARDING.md` with your agent.

**Agent rules:** `AGENTS.md` is the main instruction file; `.cursor/rules/agent-communication.md` points to it.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # required files and folders
npm run build        # static output to dist/
npm test             # unit tests
npm run test:e2e     # browser tests (starts dev server)
npm run test:ci      # unit + e2e (used in CI)
```

## Contributing

See `CONTRIBUTING.md` and `docs/DEFINITION_OF_DONE.md`.

## Recommended agent workflow

1. Start from the latest default branch (usually `main`).
2. One focused task per agent run.
3. Run `npm run check`, `npm run build`, and `npm run test:ci` before finishing when behavior or tests change.
4. Open a PR; do not merge until you review.
5. For milestones that need human-visible proof, verify with `npm run dev` and attach a **screen recording** or clear replay steps (see `docs/TESTING.md`).

**Prompts:** `docs/PROMPT_EXAMPLES.md`.

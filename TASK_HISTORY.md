# Task History

Use this file as lightweight project memory for future agents.

Keep entries short.

## 2026-05-01

- Completed framework documentation pass: `CONTRIBUTING.md`, `docs/README.md`, `docs/DEFINITION_OF_DONE.md`, `docs/QUALITY.md`, `docs/SECURITY.md`, `docs/MCP.md`, GitHub issue and PR templates, bootstrap shell naming in `src/` and e2e, expanded `check-project.js`, aligned `AGENTS.md` and `PROJECT_OVERVIEW.md` with “finished framework + product onboarding” model.
- Documented project memory (`docs/MEMORY.md`), agent handoff for sub-agents / multi-agent / pauses (`docs/HANDOFF.md`), optional `docs/memory/` notes; wired into AGENTS.md, onboarding, prompts, and check-project.
- Repositioned repo as agentic static-frontend framework: removed GitHub Pages deploy workflow and hosting-specific docs; added onboarding, testing docs, Vitest + Playwright, `.cursor/skills/`, bootstrap shell instead of demo app; build copies `docs/` into `dist/`; CI runs full test suite.

## Framework baseline

- Hardened the repo for Cloud Agents: `.gitignore`, `.env.example`, `.cursor/rules` pointer, `docs/START_HERE.md`, `docs/plans/`, CI workflow, and `check-project` path checks.

## 2026-04-29

- Added `ignore/snapshot/` as a local full-file backup (not committed) plus `ignore/README.md` with refresh instructions; root `.gitignore` lists `ignore/snapshot/`.

## Initial import

- Added basic frontend-only static app.
- Added Cursor agent instructions.
- Added GitHub Actions workflow for check and build.

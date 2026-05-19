# Project Overview

This repository is a **complete agentic static-frontend framework** for Cursor Cloud Agents and humans: rules, onboarding, versioned memory, handoffs, tests, CI, quality and security defaults, and GitHub templates. The **product UI** starts as a **bootstrap shell** in `src/`; onboarding captures your real product and the shell is replaced when you build the app.

## Purpose

- **Single source of truth** for agent behavior: `AGENTS.md`.
- **Onboarding** (`docs/ONBOARDING.md`) so the first session defines product scope, milestones, and workflow.
- **Memory in git** (`docs/MEMORY.md`, `TASK_HISTORY.md`, `docs/memory/`, `docs/plans/`) so future agents and pauses do not lose context.
- **Handoffs** (`docs/HANDOFF.md`) for sub-agents, parallel work, and resume-after-break.
- **Automated tests** (Vitest + Playwright) and **definition of done** (`docs/DEFINITION_OF_DONE.md`, `docs/TESTING.md`).
- **Portable static build** (`dist/` via `npm run build`); no prescribed host or backend.

## Important files

| Path | Role |
|------|------|
| `AGENTS.md` | Main agent instructions (read first). |
| `CONTRIBUTING.md` | How humans and agents contribute; links to definition of done. |
| `docs/README.md` | Documentation index and read order. |
| `docs/ONBOARDING.md` | First-session interview and file updates. |
| `docs/START_HERE.md` | Short human entry point. |
| `docs/TESTING.md` | Test commands and verification expectations. |
| `docs/DEFINITION_OF_DONE.md` | PR-ready checklist. |
| `docs/QUALITY.md` | UI, accessibility, performance defaults. |
| `docs/SECURITY.md` | Secrets and frontend safety. |
| `docs/MCP.md` | Optional MCP and external tools policy. |
| `docs/MEMORY.md` | What “memory” means and which files agents maintain. |
| `docs/HANDOFF.md` | Sub-agents, parallel agents, resume after pause. |
| `docs/PROMPT_EXAMPLES.md` | Copy-paste prompts. |
| `docs/plans/` | Implementation plans. |
| `docs/memory/` | Long-form session or decision notes. |
| `docs/REPO_SETUP_CHECKLIST.md` | After duplicating on GitHub. |
| `.cursor/rules/agent-communication.md` | Points agents at `AGENTS.md`. |
| `.cursor/skills/` | Cursor Skills for repeatable workflows. |
| `index.html` / `src/main.js` | Entry points; **bootstrap shell** until the product UI replaces it. |
| `scripts/dev-server.js` | Local static server. |
| `scripts/build-static.js` | Copies static assets to `dist/` (includes `docs/`). |
| `scripts/check-project.js` | Verifies required paths exist. |
| `.github/workflows/ci.yml` | CI on `main` and PRs. |
| `.github/pull_request_template.md` | PR checklist. |
| `.github/ISSUE_TEMPLATE/` | Bug report form. |
| `TASK_HISTORY.md` | Chronological memory of meaningful changes. |
| `.env.example` | Future env vars; no secrets in the repo. |

## After you duplicate this framework

Run **`docs/ONBOARDING.md`** with your agent. The agent should capture your product and milestones in this file and related docs so the next session is never guessing.

## Design goals

- **Hosting-agnostic** static output.
- **Small, reviewable PRs.**
- **Plain JS + HTML + CSS** unless the team chooses otherwise during onboarding.

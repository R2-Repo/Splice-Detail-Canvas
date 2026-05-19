# Project memory (for agents)

This repo treats **memory as files in git**, not as hidden state. Any agent (or sub-agent) that can read the workspace should **read these before writing code** so decisions, scope, and recent work stay consistent.

## What counts as memory

| Location | Purpose | Who updates it |
|----------|---------|------------------|
| `PROJECT_OVERVIEW.md` | **Living product brief**: goals, constraints, milestones, file map, agreed workflow. The primary context after onboarding. | Any agent when scope or workflow changes; user approves major edits. |
| `TASK_HISTORY.md` | **Chronological log** of meaningful merged or completed work (one line or short bullet per entry). | Any agent after a substantive task; keep it short. |
| `docs/plans/` | **Plans and specs** for features or refactors (`docs/plans/<topic>.md`). | Agent when planning; trim or archive when obsolete. |
| `docs/memory/` | **Optional deep notes**: session summaries, decision records, research that is too long for `TASK_HISTORY.md`. Use dated or topic filenames (e.g. `2026-05-02-auth-spike.md`). | Any agent when the team needs durable narrative context. |
| `AGENTS.md` | **Standing behavior** for all agents (tests, PRs, handoff format). | User or lead agent when team rules change. |
| `.cursor/skills/` | **Repeatable workflows** as Cursor Skills. | User or agent when a pattern stabilizes. |

Do **not** rely on chat history alone. If something must survive the next agent or a pause of weeks, **put it in one of the files above**.

## What agents should do

1. **Start of a session:** Read `PROJECT_OVERVIEW.md`, skim the latest section of `TASK_HISTORY.md`, and check `docs/plans/` and `docs/memory/` for anything matching the current task.
2. **End of a session:** Append to `TASK_HISTORY.md` if you changed behavior, contracts, or agreed direction. If you made a non-obvious decision, add a short note under `docs/memory/` or the relevant plan file.
3. **Secrets:** Never commit secrets. Memory files describe *what* was decided, not API keys.

## Relationship to Cursor product features

Cursor may also retain **conversation** or **project** memory in the product UI. This repo’s files are the **portable, versioned** source of truth for anyone cloning the repo or using a fresh agent. Prefer updating repo files when the whole team (or future you) needs the fact in git.

# Start here

This repo is an **agentic static-frontend framework** for **Cursor Cloud Agents** and humans: finished rules, memory, handoffs, tests, and CI. Your **product** is captured during onboarding; the **bootstrap shell** in `src/` exists until you replace it with real UI.

## You (in Cursor)

1. **Skim** `AGENTS.md`, `docs/README.md`, and `PROJECT_OVERVIEW.md`.
2. Start **onboarding**—either tell your agent to follow `docs/ONBOARDING.md`, or run:

   ```text
   /review
   Read docs/ONBOARDING.md and PROJECT_OVERVIEW.md. Run the onboarding interview: ask the questions there, then update PROJECT_OVERVIEW.md and related files with my answers. Do not build unrelated features until onboarding is done.
   ```

3. **Iterate**: one milestone per agent task; satisfy `docs/DEFINITION_OF_DONE.md`; see `docs/TESTING.md`.

**Plans:** `docs/plans/` (see `docs/PROMPT_EXAMPLES.md`).

## Documentation map

| Doc | Use |
|-----|-----|
| `docs/README.md` | Full index and suggested read order. |
| `CONTRIBUTING.md` | Contribution flow and PR expectations. |
| `docs/DEFINITION_OF_DONE.md` | Checklist before “done.” |
| `docs/QUALITY.md` | UI and accessibility defaults. |
| `docs/SECURITY.md` | Secrets and safe patterns. |
| `docs/MCP.md` | External tools policy. |

## Security

Do not commit real API keys or secrets. See `docs/SECURITY.md` and `.env.example`.

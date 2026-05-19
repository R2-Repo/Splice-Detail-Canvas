# MCP and external tools

**Model Context Protocol (MCP)** servers and other external integrations are **optional**. This repo stays **frontend-only and static** unless the user changes that in `PROJECT_OVERVIEW.md`.

## Defaults for agents

1. **Do not** add MCP servers, API keys, or cloud credentials to the repo to “make things easier.”
2. If the user **explicitly** asks to use an MCP tool (database, browser, ticketing, etc.), follow their instructions and document **which server** and **what data** touches it in the PR or `docs/memory/` if the pattern repeats.
3. Prefer **read-only** exploration when a sub-agent connects to external systems; write access only when the user confirms.

## Project-specific policy

During onboarding, if the team uses MCP regularly, add a short subsection to `PROJECT_OVERVIEW.md`:

- Allowed MCP servers (by name).
- Forbidden categories (e.g. production deploy, payment APIs).
- Where to log decisions (`docs/memory/`).

If there is no subsection, assume **no MCP** beyond what Cursor provides by default in the user’s workspace.

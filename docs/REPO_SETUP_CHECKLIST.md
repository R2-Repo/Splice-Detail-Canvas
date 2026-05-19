# Repo setup checklist

Use this after duplicating the framework into a new GitHub repository. **Either you or your agent** can complete it; prefer driving it from `docs/ONBOARDING.md` so questions and file edits happen in one session.

## Required

- [ ] Run onboarding (`docs/ONBOARDING.md`) and replace boilerplate in `PROJECT_OVERVIEW.md`.
- [ ] Set `package.json` `name` and `description` to the real project (agent can do this during onboarding).
- [ ] Update `README.md` title and opening paragraph for humans.
- [ ] Update `index.html` `<title>` and meta description.
- [ ] Push to GitHub (or your remote) and confirm CI passes on the default branch.
- [ ] Skim `docs/MEMORY.md`, `docs/HANDOFF.md`, `docs/DEFINITION_OF_DONE.md`, and `CONTRIBUTING.md`.
- [ ] Run `npm install` locally once; confirm `npm run check`, `npm run build`, and `npm run test:ci`.

## Recommended

- [ ] Add Cursor **Skills** under `.cursor/skills/` for workflows you repeat.
- [ ] Keep `AGENTS.md` accurate when team rules change.
- [ ] One Cursor agent task per focused change; review every PR before merge.

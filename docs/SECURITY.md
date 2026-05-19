# Security expectations

## Secrets

- **Never** commit API keys, tokens, passwords, or private URLs. Use `.env` locally only; it is gitignored. See `.env.example`.
- Do not paste production secrets into `docs/memory/`, issues, or PR descriptions.

## Dependencies

- Prefer **minimal dependencies**. When adding a package, use a known version range and run `npm run test:ci` after `npm install`.
- Review lockfile changes in PRs like any other code.

## Frontend safety

- Avoid `innerHTML` (or `dangerouslySetInnerHTML` in other stacks) with **untrusted** or **user-controlled** strings; prefer `textContent` or explicit escaping.
- Do not disable security headers or CSP in this framework unless the product team documents why in `PROJECT_OVERVIEW.md` or `docs/memory/`.

## Supply chain

- CI uses pinned major versions of GitHub Actions (`@v4`). Bump only with intent and a green CI run.

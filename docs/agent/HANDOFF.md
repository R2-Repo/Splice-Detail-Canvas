# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-25 — rule + canvas glossaries with live app screenshots.

## Done

- **`RULE_DICTIONARY.md`** — plain-English lookup for all 31 rule IDs (“Say this when…”)
- **`CANVAS_GLOSSARY.md`** — diagram component names + 4 screenshots from live app (Example #2)
- **Screenshots:** `docs/reference/images/glossary/00–03*.png`
- **Dev fixture loader:** `?fixture=example-2` + `public/fixtures/example-2.csv`
- **`npm run verify`** passes

## How to talk to agents now

```
Rule ID: TUB-001
Example: #2
Component: fusion splice dot (see CANVAS_GLOSSARY §4)
```

## Browser / testing

Agent can: open dev app, auto-import fixtures, Fit View, screenshot regions, run `npm run verify`. File-upload UI still manual for non-fixture CSVs.

## Next

- User visual QA vs reference PNGs
- Scoped layout fixes using Rule ID + component name from glossaries

## Commands verified

- `npm run test:layout`
- `npm run check`
- `npm run test:ci`
- `npm run build`

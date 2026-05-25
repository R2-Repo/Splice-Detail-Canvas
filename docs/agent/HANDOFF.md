# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-05-25 — BL/OR bundle loop-back bend fix.

## Done

- **Loop-back spurs:** `reconcileBundleJogXForRender` drops `jogX` when clamped `midX` would backtrack; `sourceHorizWaypoints` enforces monotonic inward horizontals
- **Global bundle trunk:** `jogX` assigned once per `tubeBundleKey` after vertical deconflict (not per routing zone)
- **Render path:** `useRoutingLaneIndex` reconciles stored `jogX` with render-time `midX`
- **Tests:** loop-back unit tests + 3161.4 BL 1–2 no-backtrack regression
- Prior: post-drag bundle order, split-zone midX pack, import BL fix

## Next

- User re-test 3161.4 BL/OR bends after cable drag (`?fixture=3161.4`)

## Commands verified

- `npm run verify`

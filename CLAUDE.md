# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` then `vite build` (typecheck is part of the build; there's no separate typecheck script)
- `npm run lint` — oxlint
- `npm test` — vitest run (single file: `npx vitest run src/game/runReducer.test.ts`, single case: add `-t "name"`)

## Architecture

React + TypeScript + Vite SPA, client-side only — no server, no accounts. Deployed to GitHub Pages by `.github/workflows/deploy.yml`; `vite.config.ts` sets `base: '/ChessChallenge/'` only under `GITHUB_ACTIONS`, so any asset URL must go through `import.meta.env.BASE_URL`.

Domain vocabulary (Run, Game, Difficulty Tier, Score, Best Score, Run State, Bot) is defined in `CONTEXT.md` — use those terms, and read `docs/adr/` before changing the areas they cover.

**All game logic lives in two pure reducers; `App.tsx` is the only stateful piece.**

- `src/game/gameReducer.ts` — one Game: `MOVE` / `TICK` over a `GameState` whose board is a FEN string. `chess.js` is instantiated per call from the FEN and thrown away, never held as mutable state. Only the player's (White's) clock ticks.
- `src/game/runReducer.ts` — wraps `gameReducer` and adds ladder progression: a finished Game either advances `tierIndex` with a fresh board, or ends the Run (`lost` / `drawn` / `ladder-complete`). `DIFFICULTY_TIERS` maps each rung to a Stockfish skill level.
- `src/App.tsx` — `useReducer(runReducer)` plus effects for: driving the bot when it's Black's turn, the 1s clock interval, and persistence. Illegal drops are rejected by dry-running `runReducer` before dispatching.

Both reducers ship an `isGameState` / `isRunState` type guard. These are the validators for untrusted `localStorage` JSON — extend them whenever state shape changes, or old saves will deserialize into invalid state.

**Boundaries are hand-rolled adapters** (both trivially fakeable in tests):

- `src/bot/stockfishBotAdapter.ts` implements `BotAdapter` over a Web Worker running the vendored `public/stockfish/stockfish.js` (WASM). UCI request/response correlation is by a monotonic `requestId`, with a timeout, so a superseded move never resolves a stale promise.
- `src/persistence/persistenceAdapter.ts` — generic validated `localStorage` get/set, deliberately best-effort (swallows quota/private-browsing errors). Two keys: `chesschallenge:best-score:v1` and `chesschallenge:run-state:v1`, versioned in the key name.

Run State is snapshotted after moves and run transitions but **not** every clock tick (see ADR 0003) — `App.tsx` guards on a derived key to skip TICK-only writes. The clock therefore freezes while the tab is closed.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues; uses the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.

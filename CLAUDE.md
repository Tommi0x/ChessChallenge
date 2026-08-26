# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` then `vite build` (typecheck is part of the build; there's no separate typecheck script)
- `npm run lint` — oxlint
- `npm test` — vitest run (single file: `npx vitest run src/game/runReducer.test.ts`, single case: add `-t "name"`)

## Architecture

React + TypeScript + Vite SPA, client-side only — no server, no accounts. Deployed to GitHub Pages by `.github/workflows/deploy.yml`; `vite.config.ts` sets `base: '/ChessChallenge/'` only under `GITHUB_ACTIONS`, so any asset URL must go through `import.meta.env.BASE_URL`.

Domain vocabulary (Run, Game, Ladder, Difficulty Tier, Score, Best Score, Run State, Bot) is defined in `CONTEXT.md` — use those terms, and read `docs/adr/` before changing the areas they cover.

**All game logic lives in two pure reducers; `useRun.ts` is the only stateful piece.**

- `src/game/gameReducer.ts` — one Game: `MOVE` / `TICK` over a `GameState` whose board is a FEN string. `chess.js` is instantiated per call from the FEN and thrown away, never held as mutable state. Only the player's (White's) clock ticks. `TICK` carries `now`, not a delta: the reducer owns elapsed time via `lastTickAt`, and a `null` anchor bills nothing, which is what freezes the clock while the tab is away.
- `src/game/runReducer.ts` — wraps `gameReducer` and adds ladder progression: a finished Game either advances `tierIndex` with a fresh board, or ends the Run (`lost` / `drawn` / `ladder-complete`).
- `src/game/ladder.ts` — the Ladder: `DIFFICULTY_TIERS` and the tagged `DifficultyTier` (`starved` below the engine's `UCI_Elo` floor, `calibrated` above it). Retune rungs here; nothing else interprets the tier's fields.
- `src/useRun.ts` — the Run orchestration: `useReducer(runReducer)` plus effects for driving the Bot on Black's turn, the 1s clock interval, and persistence. Takes the `BotAdapter` and `RunStore` as arguments, so tests drive a whole Run with fakes and no DOM. Illegal drops are rejected by dry-running `runReducer` before dispatching.
- `src/App.tsx` — render only: board, stat pills, and the one `RUN_END` table mapping each `RunStatus` to its end-of-run screen.

Both reducers ship an `isGameState` / `isRunState` type guard. These are the validators for untrusted `localStorage` JSON — extend them whenever state shape changes, or old saves will deserialize into invalid state.

**Boundaries are hand-rolled adapters** (both trivially fakeable in tests):

- `src/bot/stockfishBotAdapter.ts` implements `BotAdapter` over a Web Worker running the vendored `public/stockfish/stockfish.js` (WASM). UCI request/response correlation is by a monotonic `requestId`, with a timeout, so a superseded move never resolves a stale promise.
- `src/persistence/persistenceAdapter.ts` — generic validated `localStorage` get/set, deliberately best-effort (swallows quota/private-browsing errors).
- `src/persistence/runStore.ts` — the only owner of Run State on disk. Holds both versioned keys (`chesschallenge:best-score:v1`, `chesschallenge:run-state:v1`), reconciles a resumed Run's `bestScore` against the standalone key, and decides which writes are worth making.

Run State is snapshotted after moves and run transitions but **not** every clock tick (see ADR 0003) — `runStore.save` guards on a derived key to skip TICK-only writes, and strips `lastTickAt` so a reopened tab is never billed for time away.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues; uses the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.

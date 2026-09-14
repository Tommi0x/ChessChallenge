# ChessChallenge

A browser chess gauntlet: play White against ten increasingly strong bots. A win advances the Run; a loss or draw ends it. Each Game has a five-minute player clock. Scores reward both progress and time remaining.

## Develop and verify

Use Node.js 24 (`.nvmrc`; Node 22.13+ is also supported).

```sh
npm ci
npm run dev
npm run check
```

`check` runs lint, all tests, strict TypeScript checking, and the production build. Individual commands are `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build`. Use `npm run preview` to serve the built `dist/` directory. `PORT` optionally sets the development server port.

## Architecture

- `src/game/`: pure Game and Run reducers, validation, ladder configuration, and scoring. Positions remain serializable; repetition history survives reloads.
- `src/useRun.ts`: application orchestration. Drives the player clock, cancellable bot turns, retries, and persistence through injected adapters.
- `src/bot/`: the bot contract and Stockfish worker adapter. Construction has no side effects. The engine loads on demand; cancellation, errors, and timeouts release the worker.
- `src/persistence/`: validated, best-effort browser storage. Existing versioned keys remain compatible. Old snapshots without repetition history resume from their saved position.
- `src/components/`: start screen, interactive board, opponent portraits, score celebration, and shareable end screen. The board is isolated from clock renders; image export loads on demand.
- `src/App.tsx`: creates adapters and coordinates screens and celebrations.
- `src/dev/`: development-only screen previews and controls. Preview runs never overwrite real Run State or Best Score; production ignores preview query parameters.

Tests live beside the code they exercise.

## Persistence and clock

Run State is saved after moves and run transitions, not on every clock tick. Reloading resumes the last snapshot without charging time away. The clock starts when the player enters the Game and pauses during celebrations and while the document is hidden. Player moves charge partial seconds before applying the move. Best Score updates after each win, including during an unfinished Run. The score-card name has its own storage key.

There is no backend, account, analytics service, or remote API. Browser storage is local to this device and origin. Player promotions currently default to a queen.

## GitHub Pages

`.github/workflows/deploy.yml` checks pull requests and deploys successful builds from `master`. Configure the repository's Pages source as **GitHub Actions**. Deployment permissions are limited to the deployment job.

Vite emits relative asset URLs, so the same artifact works at `/ChessChallenge/`, a renamed repository path, or a local preview. There is no client-side router or server fallback requirement. Keep `public/stockfish/stockfish.js` and `stockfish.wasm` together: they are the vendored runtime, not build output. The npm `stockfish` package is unnecessary for building or running this copy. When upgrading the engine, replace the matching JS/WASM pair and verify a real browser move.

The piece SVGs and favicon are under `public/`; the display font is bundled under `src/fonts/`. All are used. Preserve upstream license notices when updating assets.

See `PRODUCT.md` for product constraints and `docs/adr/` for architecture decisions.

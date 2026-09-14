# Repository guidance

Read [README.md](README.md) for commands, current architecture, and deployment. Read [CONTEXT.md](CONTEXT.md) for domain vocabulary and the relevant [architecture decisions](docs/adr/) before changing game rules, storage, or the bot.

Keep domain logic in the pure reducers under `src/game/`; browser effects belong in `src/useRun.ts` or the bot/persistence adapters. UI components own presentation and interaction state. Keep factories free of side effects, cancel asynchronous work on cleanup, and maintain compatibility with existing localStorage snapshots when changing state shape.

Run `npm run check` before completing code changes. Tests belong beside application code under `src/`; installed agent skills are not application dependencies. Asset URLs must support the relative Vite base used by GitHub Pages.

GitHub issue conventions: [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md). Domain documentation conventions: [docs/agents/domain.md](docs/agents/domain.md).

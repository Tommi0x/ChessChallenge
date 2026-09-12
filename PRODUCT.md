# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who knows how chess moves work — the ladder is deliberately wide (200–2000 Elo in 200-point steps) so a near-beginner and a club player both find their ceiling somewhere on it. There is no onboarding tier, no account, and no profile: a player arrives, plays, and their device remembers their Best Score.

## Product Purpose

ChessChallenge is a browser gauntlet against a sequence of chess bots of increasing difficulty. A Run starts at the lowest Difficulty Tier and climbs one Game per tier, advancing only on a win; a loss or a draw ends it. How far the player got, and how fast, is their Score. Success is a player opening the tab again to beat their own Best Score.

## Positioning

An arcade toy, not a training tool. Playing bots on Chess.com or Lichess is unlimited and consequence-free; here the climb is a single unbroken thread with a score attached, and the only opponent that matters is the player's own previous best. Zero friction to start (no sign-up, no server, nothing to install), and the whole engine runs client-side in the tab.

## Operating Context

Opened in a browser tab, desktop or phone, in short sittings. A Run may span a page reload or a closed tab — Run State is restored and the clock freezes while away, so a player can put it down mid-Game and come back. Deployed as a static site to GitHub Pages.

## Capabilities and Constraints

- The player is always White; the Bot is Stockfish (WASM, client-side) at the tier's configured strength.
- Each Game gives the player a 5-minute clock; only the player's clock ticks.
- Ten Difficulty Tiers, 200–2000 Elo. The six rungs below Stockfish's `UCI_Elo` floor are approximated by starving search and mixing in random legal moves, so their Elo is an aim, not a measurement.
- Score: `(tier number) × 100` per Game won, plus a curved bonus up to 50 for unspent clock. The speed bonus is deliberately worth less than one rung, so depth always outranks speed.
- No backend, no accounts, no leaderboard. Best Score and Run State live in this browser's `localStorage` only (ADR 0002, 0003).
- Domain vocabulary is fixed in `CONTEXT.md` — Run, Game, Ladder, Difficulty Tier, Score, Best Score, Run State, Bot. Use those words in UI copy.
- Stay fast and dependency-light: no new heavyweight dependencies, no analytics, no runtime network calls. Cold load must stay quick despite the WASM engine.
- Mobile play is first-class: the board and stats must genuinely work on a phone in portrait, not merely reflow.

## Evidence on Hand

None. There are no users, ratings, testimonials, download counts, press, or benchmarks — do not invent any. The only real assets are `public/favicon.svg` and `public/icons.svg`.

## Product Principles

1. **One life, one thread.** The Run is unbroken; a loss or a draw is final. Never soften this into retries or checkpoints.
2. **The rival is your own best.** Progress is measured against Best Score on this device, never against other players.
3. **Depth outranks speed.** Scoring, and anything that presents it, must keep a deeper climb worth more than a faster one.
4. **Nothing between the player and the board.** No sign-up, no server, no interstitials; a Run should be one click from arrival.
5. **A closed tab is not a lost Run.** Interruption is normal usage — the Run and its frozen clock survive it.

## Accessibility & Inclusion

No product-specific standard was established beyond ordinary good practice.

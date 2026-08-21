# ChessChallenge

A web app where a player faces a sequence of chess bots of increasing difficulty; how far they get is their score.

## Language

**Run**:
A single play-through of the ladder: starts at the lowest Difficulty Tier and continues, one Game per tier, advancing only on a win. A loss or a draw ends the Run.
_Avoid_: Session, playthrough

**Game**:
One chess match against the Bot at a single Difficulty Tier, played with a 5-minute clock for the player. The player is always White.
_Avoid_: Match, round

**Difficulty Tier**:
One rung of the ladder, mapped to a specific Stockfish skill level. Tiers are played in increasing order within a Run.
_Avoid_: Level (ambiguous with UI/game level), difficulty (alone)

**Score**:
The number of Difficulty Tiers won during the current Run.
_Avoid_: Points

**Best Score**:
The player's highest-ever Score, persisted in the browser's `localStorage`. Local to one device/browser; there is no account or server-side record.
_Avoid_: High score, record

**Run State**:
A snapshot of the in-progress Run (current Difficulty Tier, board position, whose move it is, remaining clock time) written to `localStorage` after every move, so reloading the page resumes the Run rather than losing it. The clock freezes at its saved value while away — real-world time elapsed does not count against the player. Distinct from Best Score, which only records completed Runs.
_Avoid_: Save, save file

**Bot**:
The player's opponent for a Game, powered by Stockfish (via WebAssembly, running entirely client-side) at the Difficulty Tier's configured skill level.
_Avoid_: Engine (reserve "engine" for Stockfish itself, the underlying library)

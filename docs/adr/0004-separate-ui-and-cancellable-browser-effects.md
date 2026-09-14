# Separate UI responsibilities and make browser effects cancellable

Keep the two pure reducers and browser-only deployment established by ADRs 0001–0003. App composes screens and owns adapter instances; components own board selection, presentation, and score-card export. The Run hook owns clock, bot, and snapshot effects. Development previews are injected at the application boundary and excluded from production.

Stockfish's UCI replies have no request identifiers. A local counter cannot correlate an old reply with a new search. Superseding or aborting a request therefore rejects its promise and terminates its worker; a later request creates another. Completed requests retain the worker for reuse. Both initialization and search have timeouts, and a retry preserves the current Game.

A FEN alone cannot detect threefold repetition. Game State now optionally carries positions since the last pawn move or capture. Old snapshots remain valid and accumulate history from their resumed position. The Game reducer still creates a temporary chess.js instance per move and never retains mutable engine state.

The clock anchors immediately on entering a visible, unpaused player turn and bills partial seconds on a move. Hiding the document or showing a celebration clears its anchor. Snapshot cadence remains unchanged: moves and run transitions, not every tick.

Relative build assets make the same static artifact usable under the GitHub Pages repository path and local preview. CI runs lint, tests, type checking, and build before deployment.

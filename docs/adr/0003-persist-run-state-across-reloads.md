# Persist in-progress Run State to localStorage, not just Best Score

We initially defaulted to treating the Run as in-memory only (reload = abandon it), since resumable state means correctly restoring board position, whose move it is, and a live clock. That was rejected: the player wants a reload to resume the Run rather than lose it. Run State (tier, board, turn, remaining clock time) is now snapshotted to `localStorage` after every move, separately from Best Score, which only records completed Runs.

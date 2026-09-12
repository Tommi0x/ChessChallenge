import { useEffect, useReducer, useState } from 'react';
import type { BotAdapter } from './bot/botAdapter';
import { createInitialRunState, runReducer } from './game/runReducer';
import type { RunState, RunStatus } from './game/runReducer';
import type { RunStore } from './persistence/runStore';
import { currentTier, DIFFICULTY_TIERS } from './game/ladder';

const TICK_MS = 1000;

const DEBUG_STATUSES: readonly RunStatus[] = ['lost', 'drawn', 'ladder-complete'];

/** `?tier=n` starts a throwaway Run on rung n, so any Bot can be seen without
 *  beating the ones below it. `?status=lost|drawn|ladder-complete` (optionally
 *  combined with `?tier=n`) fakes that Run's outcome directly, so every
 *  end-of-run screen can be previewed without actually winning or losing.
 *  Nothing else reads the query string. */
function debugRunFromQuery(): RunState | null {
  const params = new URLSearchParams(location.search);
  const rawTier = params.get('tier');
  const n = Number(rawTier);
  const hasTier = rawTier !== null && Number.isInteger(n) && n >= 0 && n < DIFFICULTY_TIERS.length;
  const status = params.get('status') as RunStatus | null;
  if (!hasTier && status === null) return null;
  if (status !== null && !DEBUG_STATUSES.includes(status)) return hasTier ? { ...createInitialRunState(), tierIndex: n } : null;

  const tierIndex = status === 'ladder-complete' ? DIFFICULTY_TIERS.length - 1 : hasTier ? n : 0;
  const run = { ...createInitialRunState(), tierIndex, score: (tierIndex + 1) * 100 };
  if (status === null) return run;

  const gameOutcome =
    status === 'lost' ? { status: 'checkmate' as const, winner: 'b' as const } :
    status === 'drawn' ? { status: 'draw' as const, winner: null } :
    { status: 'checkmate' as const, winner: 'w' as const };
  return { ...run, status, game: { ...run.game, ...gameOutcome } };
}

export type Run = {
  run: RunState;
  botError: string | null;
  /** Applies the player's move, or returns false if it would be illegal. */
  onPieceDrop(from: string, to: string): boolean;
  newRun(): void;
};

/**
 * Everything it takes to play a Run: the state, the Bot's turn, the clock and
 * the snapshot. `paused` stops the clock without touching the Run. The Bot and the store are arguments so a test can drive a whole
 * Run through this interface with fakes and no DOM.
 */
export function useRun(bot: BotAdapter, store: RunStore, paused = false): Run {
  // Captured once: a debug Run is fake from the moment it's requested, and
  // must never overwrite the real saved Run or Best Score, however the query
  // string changes (or a debug end screen advances) after that.
  const [isDebugRun] = useState(() => debugRunFromQuery() !== null);
  const [run, dispatch] = useReducer(runReducer, undefined, () => debugRunFromQuery() ?? store.load());
  const [botError, setBotError] = useState<string | null>(null);

  const { game } = run;
  const tier = currentTier(run);

  useEffect(() => {
    if (isDebugRun) return;
    store.save(run);
  }, [run, store, isDebugRun]);

  useEffect(() => {
    if (game.status !== 'playing' || game.turn !== 'b') return;

    let cancelled = false;
    bot.getMove(game.fen, tier).then(
      (move) => {
        if (!cancelled) dispatch({ type: 'MOVE', ...move });
      },
      (error: unknown) => {
        if (!cancelled) setBotError(error instanceof Error ? error.message : 'The bot failed to move.');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [bot, game.fen, game.status, game.turn, tier]);

  useEffect(() => {
    if (paused || game.status !== 'playing' || game.turn !== 'w') return;
    // The reducer owns elapsed time; this only decides how often to ask.
    //
    // While paused, no TICK is dispatched at all. A Game that has just begun
    // still carries a null `lastTickAt`, so the first TICK after the pause
    // re-anchors and bills nothing — the player is never charged for time the
    // interface spent celebrating.
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), TICK_MS);
    return () => clearInterval(id);
  }, [game.status, game.turn, paused]);

  return {
    run,
    botError,
    onPieceDrop(from, to) {
      if (game.status !== 'playing' || game.turn !== 'w') return false;
      const move = { type: 'MOVE', from, to, promotion: 'q' } as const;
      // Dry-run first: an illegal drop must snap back rather than dispatch.
      if (runReducer(run, move) === run) return false;
      dispatch(move);
      return true;
    },
    newRun() {
      setBotError(null);
      dispatch({ type: 'NEW_RUN' });
    },
  };
}

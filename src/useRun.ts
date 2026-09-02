import { useEffect, useReducer, useState } from 'react';
import type { BotAdapter } from './bot/botAdapter';
import { runReducer } from './game/runReducer';
import type { RunState } from './game/runReducer';
import type { RunStore } from './persistence/runStore';
import { currentTier } from './game/ladder';

const TICK_MS = 1000;

export type Run = {
  run: RunState;
  botError: string | null;
  /** Applies the player's move, or returns false if it would be illegal. */
  onPieceDrop(from: string, to: string): boolean;
  newRun(): void;
};

/**
 * Everything it takes to play a Run: the state, the Bot's turn, the clock and
 * the snapshot. The Bot and the store are arguments so a test can drive a whole
 * Run through this interface with fakes and no DOM.
 */
export function useRun(bot: BotAdapter, store: RunStore): Run {
  const [run, dispatch] = useReducer(runReducer, undefined, () => store.load());
  const [botError, setBotError] = useState<string | null>(null);

  const { game } = run;
  const tier = currentTier(run);

  useEffect(() => {
    store.save(run);
  }, [run, store]);

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
    if (game.status !== 'playing' || game.turn !== 'w') return;
    // The reducer owns elapsed time; this only decides how often to ask.
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), TICK_MS);
    return () => clearInterval(id);
  }, [game.status, game.turn]);

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

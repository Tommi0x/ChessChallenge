import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
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
  retryBot(): void;
};

/**
 * Everything it takes to play a Run: the state, the Bot's turn, the clock and
 * the snapshot. `paused` stops the clock without touching the Run. The Bot and the store are arguments so a test can drive a whole
 * Run through this interface with fakes and no DOM.
 */
export function useRun(bot: BotAdapter, store: RunStore, paused = false, { initialRun, persist = true }: { initialRun?: RunState; persist?: boolean } = {}): Run {
  const [run, dispatch] = useReducer(runReducer, undefined, () => initialRun ?? store.load());
  const [attempt, setAttempt] = useState(0);
  const [botError, setBotError] = useState<string | null>(null);

  const latestRun = useRef(run);
  useEffect(() => { latestRun.current = run; }, [run]);

  const { game } = run;
  const tier = currentTier(run);

  useEffect(() => {
    if (!persist) return;
    store.save(run);
  }, [run, store, persist]);

  useEffect(() => {
    if (game.status !== 'playing' || game.turn !== 'b') return;

    const controller = new AbortController();
    bot.getMove(game.fen, tier, controller.signal).then(
      (move) => {
        if (controller.signal.aborted) return;
        const event = { type: 'MOVE', ...move } as const;
        if (runReducer(latestRun.current, event) === latestRun.current) setBotError('The bot returned an illegal move.');
        else dispatch(event);
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setBotError(error instanceof Error ? error.message : 'The bot failed to move.');
      },
    );

    return () => {
      controller.abort();
    };
  }, [bot, game.fen, game.status, game.turn, tier, attempt]);

  useEffect(() => {
    if (paused || game.status !== 'playing' || game.turn !== 'w') return;
    // Anchor immediately, and stop charging while the document is hidden.
    function tick() { dispatch({ type: 'TICK', now: Date.now() }); }
    let id: ReturnType<typeof setInterval> | undefined;
    function syncClock() {
      clearInterval(id);
      dispatch({ type: 'PAUSE_CLOCK' });
      if (document.visibilityState !== 'hidden') {
        tick();
        id = setInterval(tick, TICK_MS);
      }
    }
    syncClock();
    document.addEventListener('visibilitychange', syncClock);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', syncClock);
      dispatch({ type: 'PAUSE_CLOCK' });
    };
  }, [game.status, game.turn, paused, run.tierIndex]);

  const onPieceDrop = useCallback((from: string, to: string) => {
    const current = latestRun.current;
    if (paused || current.game.status !== 'playing' || current.game.turn !== 'w') return false;
    const move = { type: 'MOVE', from, to, promotion: 'q', now: Date.now() } as const;
    if (runReducer(current, move) === current) return false;
    dispatch(move);
    return true;
  }, [paused]);

  return {
    run,
    botError,
    onPieceDrop,
    retryBot() {
      setBotError(null);
      setAttempt((value) => value + 1);
    },
    newRun() {
      setBotError(null);
      dispatch({ type: 'NEW_RUN' });
    },
  };
}

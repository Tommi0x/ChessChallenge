import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRun } from './useRun';
import type { BotAdapter, BotMove } from './bot/botAdapter';
import type { RunStore } from './persistence/runStore';
import { createInitialRunState, type RunState } from './game/runReducer';
import { PLAYER_CLOCK_MS } from './game/gameReducer';

/** A store that never touches localStorage, and records every save. */
function fakeStore(initial: RunState = createInitialRunState()): RunStore & { saves: RunState[] } {
  const saves: RunState[] = [];
  return {
    saves,
    load: () => initial,
    save: (run) => {
      saves.push(run);
    },
  };
}

function fakeBot(move: BotMove | Error = { from: 'e7', to: 'e5' }): BotAdapter {
  return {
    getMove: () => (move instanceof Error ? Promise.reject(move) : Promise.resolve(move)),
  };
}

/** A Bot that never answers, for tests that only care about the player's side. */
const silentBot: BotAdapter = { getMove: () => new Promise<BotMove>(() => {}) };

afterEach(() => {
  vi.useRealTimers();
});

describe('useRun', () => {
  it('starts from whatever the store hands back', () => {
    const store = fakeStore({ ...createInitialRunState(9), tierIndex: 3, score: 5 });

    const { result } = renderHook(() => useRun(silentBot, store));

    expect(result.current.run.tierIndex).toBe(3);
    expect(result.current.run.score).toBe(5);
    expect(result.current.run.bestScore).toBe(9);
  });

  it('applies a legal drop', () => {
    const { result } = renderHook(() => useRun(silentBot, fakeStore()));

    let accepted = false;
    act(() => {
      accepted = result.current.onPieceDrop('e2', 'e4');
    });

    expect(accepted).toBe(true);
    expect(result.current.run.game.fen).toContain(' b ');
  });

  it('rejects an illegal drop without changing the position', () => {
    const { result } = renderHook(() => useRun(silentBot, fakeStore()));
    const before = result.current.run;

    let accepted = true;
    act(() => {
      accepted = result.current.onPieceDrop('e2', 'e5');
    });

    expect(accepted).toBe(false);
    expect(result.current.run).toBe(before);
  });

  it('rejects a drop while it is the bot\'s turn', async () => {
    const { result } = renderHook(() => useRun(silentBot, fakeStore()));
    act(() => {
      result.current.onPieceDrop('e2', 'e4');
    });

    let accepted = true;
    act(() => {
      accepted = result.current.onPieceDrop('d2', 'd4');
    });

    expect(accepted).toBe(false);
  });

  it('lets the bot answer once it is Black to move', async () => {
    const { result } = renderHook(() => useRun(fakeBot({ from: 'e7', to: 'e5' }), fakeStore()));

    act(() => {
      result.current.onPieceDrop('e2', 'e4');
    });

    await waitFor(() => expect(result.current.run.game.turn).toBe('w'));
    expect(result.current.run.game.fen).toContain('4p3');
  });

  it('surfaces a bot failure instead of freezing silently', async () => {
    const { result } = renderHook(() => useRun(fakeBot(new Error('engine died')), fakeStore()));

    act(() => {
      result.current.onPieceDrop('e2', 'e4');
    });

    await waitFor(() => expect(result.current.botError).toBe('engine died'));
  });

  it('runs the clock down while the player is to move', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRun(silentBot, fakeStore()));

    act(() => {
      vi.advanceTimersByTime(1000); // anchors the clock
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.run.game.clockMs).toBe(PLAYER_CLOCK_MS - 3000);
  });

  it('stops the clock while the bot is thinking', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRun(silentBot, fakeStore()));

    act(() => {
      result.current.onPieceDrop('e2', 'e4');
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.run.game.clockMs).toBe(PLAYER_CLOCK_MS);
  });

  it('ends the run as lost when the clock runs out', () => {
    vi.useFakeTimers();
    const initial = createInitialRunState();
    const store = fakeStore({ ...initial, game: { ...initial.game, clockMs: 2000 } });
    const { result } = renderHook(() => useRun(silentBot, store));

    act(() => {
      vi.advanceTimersByTime(1000); // anchors
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.run.game.status).toBe('timeout');
    expect(result.current.run.status).toBe('lost');
  });

  it('hands every run state to the store, which decides what is worth writing', () => {
    const store = fakeStore();
    const { result } = renderHook(() => useRun(silentBot, store));

    act(() => {
      result.current.onPieceDrop('e2', 'e4');
    });

    expect(store.saves.length).toBeGreaterThanOrEqual(2);
    expect(store.saves.at(-1)!.game.fen).toContain(' b ');
  });

  it('starts a fresh run, keeping the best score and clearing the bot error', async () => {
    const store = fakeStore({ ...createInitialRunState(9), tierIndex: 3, score: 5 });
    const { result } = renderHook(() => useRun(fakeBot(new Error('engine died')), store));
    act(() => {
      result.current.onPieceDrop('e2', 'e4');
    });
    await waitFor(() => expect(result.current.botError).toBe('engine died'));

    act(() => {
      result.current.newRun();
    });

    expect(result.current.run).toEqual(createInitialRunState(9));
    expect(result.current.botError).toBeNull();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStorageRunStore } from './runStore';
import { createInitialRunState, type RunState } from '../game/runReducer';
import { PLAYER_CLOCK_MS } from '../game/gameReducer';

const RUN_STATE_KEY = 'chesschallenge:run-state:v1';
const BEST_SCORE_KEY = 'chesschallenge:best-score:v1';

const stored = (): RunState => JSON.parse(localStorage.getItem(RUN_STATE_KEY)!);

beforeEach(() => {
  localStorage.clear();
});

describe('runStore', () => {
  it('starts a fresh run when nothing is saved', () => {
    expect(createLocalStorageRunStore().load()).toEqual(createInitialRunState());
  });

  it('carries the standalone best score into a fresh run', () => {
    localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(7));

    expect(createLocalStorageRunStore().load().bestScore).toBe(7);
  });

  it('resumes a saved run', () => {
    const saved = { ...createInitialRunState(3), tierIndex: 2, score: 2 };
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify(saved));

    const run = createLocalStorageRunStore().load();

    expect(run.tierIndex).toBe(2);
    expect(run.score).toBe(2);
  });

  it('takes the higher of the two persisted best scores, in case another tab raised it', () => {
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify({ ...createInitialRunState(3), score: 2 }));
    localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(7));

    expect(createLocalStorageRunStore().load().bestScore).toBe(7);
  });

  it('discards a corrupt snapshot rather than resuming into it', () => {
    localStorage.setItem(RUN_STATE_KEY, '{ not json');

    expect(createLocalStorageRunStore().load()).toEqual(createInitialRunState());
  });

  it('resumes with the clock unanchored, so time spent away is not billed', () => {
    const fresh = createInitialRunState();
    const saved = { ...fresh, game: { ...fresh.game, lastTickAt: 1_000 } };
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify(saved));

    expect(createLocalStorageRunStore().load().game.lastTickAt).toBeNull();
  });

  it('writes both keys on the first save', () => {
    const store = createLocalStorageRunStore();

    store.save({ ...createInitialRunState(), score: 5, bestScore: 5 });

    expect(stored().score).toBe(5);
    expect(JSON.parse(localStorage.getItem(BEST_SCORE_KEY)!)).toBe(5);
  });

  it('does not re-snapshot when only the clock moved', () => {
    const store = createLocalStorageRunStore();
    const run = createInitialRunState();
    store.save(run);

    store.save({ ...run, game: { ...run.game, clockMs: PLAYER_CLOCK_MS - 1000, lastTickAt: 2_000 } });

    // ADR 0003: TICK-only changes are deliberately not persisted.
    expect(stored().game.clockMs).toBe(PLAYER_CLOCK_MS);
  });

  it('snapshots again once a move changes the position', () => {
    const store = createLocalStorageRunStore();
    const run = createInitialRunState();
    store.save(run);

    store.save({ ...run, game: { ...run.game, fen: 'moved', clockMs: 1234 } });

    expect(stored().game.fen).toBe('moved');
    expect(stored().game.clockMs).toBe(1234);
  });

  it('never persists the clock anchor, which would bill the player for time away', () => {
    const store = createLocalStorageRunStore();
    const run = createInitialRunState();

    store.save({ ...run, game: { ...run.game, fen: 'moved', lastTickAt: 9_999 } });

    expect(stored().game.lastTickAt).toBeNull();
  });

  it('mirrors a raised best score even when the position is unchanged', () => {
    const store = createLocalStorageRunStore();
    const run = createInitialRunState();
    store.save(run);

    store.save({ ...run, bestScore: 42 });

    expect(JSON.parse(localStorage.getItem(BEST_SCORE_KEY)!)).toBe(42);
  });
});

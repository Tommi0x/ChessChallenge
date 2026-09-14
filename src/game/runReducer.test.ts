import { describe, expect, it } from 'vitest';
import { createInitialRunState, gamePoints, isRunState, runReducer, type RunState } from './runReducer';
import { currentTier, DIFFICULTY_TIERS } from './ladder';
import { createInitialGameState, PLAYER_CLOCK_MS } from './gameReducer';

const WHITE_MATES_FEN = '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1';
const STALEMATE_FEN = '7k/5K2/8/6Q1/8/8/8/8 w - - 0 1';

function stateAt(tierIndex: number, fen: string, bestScore = tierIndex): RunState {
  return {
    tierIndex,
    score: tierIndex,
    bestScore,
    status: 'playing',
    game: { ...createInitialGameState(), fen, turn: 'w' },
  };
}

describe('runReducer', () => {
  it('starts a new run at tier 0 with score 0', () => {
    const state = createInitialRunState();

    expect(state.tierIndex).toBe(0);
    expect(state.score).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.game.status).toBe('playing');
  });

  it('forwards moves to the inner game', () => {
    const state = runReducer(createInitialRunState(), { type: 'MOVE', from: 'e2', to: 'e4' });

    expect(state.game.turn).toBe('b');
    expect(state.tierIndex).toBe(0);
  });

  it('winning a game advances the tier, adds the points for that game, and starts a fresh game', () => {
    const state = runReducer(stateAt(2, WHITE_MATES_FEN), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.status).toBe('playing');
    expect(state.tierIndex).toBe(3);
    expect(state.score).toBe(2 + gamePoints(2, PLAYER_CLOCK_MS));
    expect(state.game.status).toBe('playing');
    expect(state.game.fen).toBe(createInitialGameState().fen);
  });

  it('winning the final tier ends the run as ladder-complete instead of advancing', () => {
    const lastTier = DIFFICULTY_TIERS.length - 1;
    const state = runReducer(stateAt(lastTier, WHITE_MATES_FEN), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.status).toBe('ladder-complete');
    expect(state.score).toBe(lastTier + gamePoints(lastTier, PLAYER_CLOCK_MS));
    expect(state.tierIndex).toBe(lastTier);
  });

  it('losing a game ends the run', () => {
    let state = createInitialRunState();
    state = runReducer(state, { type: 'MOVE', from: 'f2', to: 'f3' });
    state = runReducer(state, { type: 'MOVE', from: 'e7', to: 'e5' });
    state = runReducer(state, { type: 'MOVE', from: 'g2', to: 'g4' });
    state = runReducer(state, { type: 'MOVE', from: 'd8', to: 'h4' });

    expect(state.status).toBe('lost');
    expect(state.score).toBe(0);
  });

  it('a stalemate ends the run as drawn', () => {
    const state = runReducer(stateAt(1, STALEMATE_FEN), { type: 'MOVE', from: 'g5', to: 'g6' });

    expect(state.status).toBe('drawn');
    expect(state.score).toBe(1);
  });

  it('the clock running out ends the run as lost, same as any other loss', () => {
    const state = stateAt(1, createInitialGameState().fen);
    state.game.clockMs = 500;
    state.game.lastTickAt = 1_000;

    const result = runReducer(state, { type: 'TICK', now: 2_000 });

    expect(result.game.status).toBe('timeout');
    expect(result.status).toBe('lost');
    expect(result.score).toBe(1);
  });

  it('the clock only counts down on the player\'s turn', () => {
    const withMove = runReducer(createInitialRunState(), { type: 'MOVE', from: 'e2', to: 'e4' });

    const state = runReducer(withMove, { type: 'TICK', now: 1_000 });

    // A no-op event must hand back the very same state, not an equal copy.
    expect(state).toBe(withMove);
  });

  it('ignores further events once the run is over', () => {
    const over = runReducer(createInitialRunState(), { type: 'MOVE', from: 'f2', to: 'f3' });
    const ended: RunState = { ...over, status: 'lost' };

    const state = runReducer(ended, { type: 'MOVE', from: 'e7', to: 'e5' });

    expect(state).toBe(ended);
  });

  it('starts a brand new run on NEW_RUN, even after the run ended', () => {
    const ended: RunState = { ...createInitialRunState(), status: 'lost', score: 4, tierIndex: 4 };

    const state = runReducer(ended, { type: 'NEW_RUN' });

    expect(state).toEqual(createInitialRunState());
  });

  it('carries the best score forward into a fresh run on NEW_RUN', () => {
    const ended: RunState = { ...createInitialRunState(9), status: 'lost', score: 4, tierIndex: 4 };

    const state = runReducer(ended, { type: 'NEW_RUN' });

    expect(state).toEqual(createInitialRunState(9));
  });

  it('raises the best score once the current score exceeds it', () => {
    const state = runReducer(stateAt(2, WHITE_MATES_FEN, 2), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.score).toBe(2 + gamePoints(2, PLAYER_CLOCK_MS));
    expect(state.bestScore).toBe(state.score);
  });

  it('leaves the best score untouched when the current score does not beat it', () => {
    const state = runReducer(stateAt(2, WHITE_MATES_FEN, 10_000), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.score).toBe(2 + gamePoints(2, PLAYER_CLOCK_MS));
    expect(state.bestScore).toBe(10_000);
  });

  it('scores a faster win on a harder bot above a slower win on an easier one', () => {
    const slow = stateAt(2, WHITE_MATES_FEN);
    slow.game.clockMs = 10_000;

    const fast = runReducer(stateAt(2, WHITE_MATES_FEN), { type: 'MOVE', from: 'a1', to: 'a8' });
    const slowResult = runReducer(slow, { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(fast.score).toBeGreaterThan(slowResult.score);
    expect(gamePoints(5, PLAYER_CLOCK_MS)).toBeGreaterThan(gamePoints(2, PLAYER_CLOCK_MS));
  });

  it('ranks depth over speed: the best possible n-bot run scores below the worst (n+1)-bot run', () => {
    // The whole point of the flat, sub-rung speed bonus. Checked across the whole
    // ladder, since the old tier-scaled bonus only broke past the fourth rung.
    const fastest = (n: number) =>
      Array.from({ length: n }, (_, i) => gamePoints(i, PLAYER_CLOCK_MS)).reduce((a, b) => a + b, 0);
    const slowest = (n: number) =>
      Array.from({ length: n }, (_, i) => gamePoints(i, 0)).reduce((a, b) => a + b, 0);

    for (let n = 1; n < DIFFICULTY_TIERS.length; n++) {
      expect(fastest(n)).toBeLessThan(slowest(n + 1));
    }
  });

  it('pays more for the first saved minutes than the last', () => {
    // The speed bonus curves: an equal slice of clock is worth more near a full
    // clock than near an empty one. Guards against it flattening back to linear.
    const drop = (from: number, to: number) => gamePoints(0, from) - gamePoints(0, to);
    const early = drop(4.5 * 60_000, 4 * 60_000);
    const late = drop(60_000, 30_000);

    expect(early).toBeGreaterThan(late);
    // Still monotonic: more clock left never scores less.
    for (let ms = 0; ms <= PLAYER_CLOCK_MS; ms += 15_000) {
      expect(gamePoints(0, ms)).toBeGreaterThanOrEqual(gamePoints(0, Math.max(0, ms - 15_000)));
    }
  });

  it('records the points the last won game paid, for the UI to show', () => {
    const state = runReducer(stateAt(2, WHITE_MATES_FEN), { type: 'MOVE', from: 'a1', to: 'a8' });
    expect(state.lastGamePoints).toBe(gamePoints(2, PLAYER_CLOCK_MS));
    expect(createInitialRunState().lastGamePoints).toBeUndefined();
  });

  it('accumulates the time bonus of every won game, not just the last one', () => {
    // Win tier 0 with 4 of 5 minutes left, then tier 1 with 1 minute left.
    let state: RunState = { ...stateAt(0, WHITE_MATES_FEN, 0), score: 0 };
    state.game.clockMs = 4 * 60_000;
    state = runReducer(state, { type: 'MOVE', from: 'a1', to: 'a8' });

    const afterFirst = state.score;
    state = { ...state, game: { ...state.game, fen: WHITE_MATES_FEN, turn: 'w', clockMs: 60_000 } };
    state = runReducer(state, { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(afterFirst).toBe(gamePoints(0, 4 * 60_000));
    expect(state.score).toBe(gamePoints(0, 4 * 60_000) + gamePoints(1, 60_000));
  });

  it('maps the tier index to its difficulty settings', () => {
    expect(currentTier(createInitialRunState())).toBe(DIFFICULTY_TIERS[0]);
    expect(currentTier(stateAt(3, WHITE_MATES_FEN))).toBe(DIFFICULTY_TIERS[3]);
  });

  it('recognizes a well-formed run state', () => {
    expect(isRunState(createInitialRunState())).toBe(true);
  });

  it('rejects malformed run state', () => {
    expect(isRunState(null)).toBe(false);
    expect(isRunState({ ...createInitialRunState(), status: 'bogus' })).toBe(false);
    expect(isRunState({ ...createInitialRunState(), game: null })).toBe(false);
  });

  it('rejects a run state with a tierIndex outside the ladder', () => {
    expect(isRunState({ ...createInitialRunState(), tierIndex: -1 })).toBe(false);
    expect(isRunState({ ...createInitialRunState(), tierIndex: DIFFICULTY_TIERS.length })).toBe(false);
  });

  it('rejects a run state whose status disagrees with its game status', () => {
    const playing = createInitialRunState();
    expect(isRunState({ ...playing, status: 'lost' })).toBe(false);
    expect(
      isRunState({ ...playing, game: { ...playing.game, status: 'timeout', winner: 'b' } }),
    ).toBe(false);
  });
});

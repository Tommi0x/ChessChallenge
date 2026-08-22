import { describe, expect, it } from 'vitest';
import { createInitialRunState, currentSkillLevel, DIFFICULTY_TIERS, runReducer, type RunState } from './runReducer';
import { createInitialGameState } from './gameReducer';

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

  it('winning a game advances the tier, increments score, and starts a fresh game', () => {
    const state = runReducer(stateAt(2, WHITE_MATES_FEN), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.status).toBe('playing');
    expect(state.tierIndex).toBe(3);
    expect(state.score).toBe(3);
    expect(state.game.status).toBe('playing');
    expect(state.game.fen).toBe(createInitialGameState().fen);
  });

  it('winning the final tier ends the run as ladder-complete instead of advancing', () => {
    const lastTier = DIFFICULTY_TIERS.length - 1;
    const state = runReducer(stateAt(lastTier, WHITE_MATES_FEN), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.status).toBe('ladder-complete');
    expect(state.score).toBe(DIFFICULTY_TIERS.length);
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

    const result = runReducer(state, { type: 'TICK', deltaMs: 1000 });

    expect(result.game.status).toBe('timeout');
    expect(result.status).toBe('lost');
    expect(result.score).toBe(1);
  });

  it('the clock only counts down on the player\'s turn', () => {
    const withMove = runReducer(createInitialRunState(), { type: 'MOVE', from: 'e2', to: 'e4' });

    const state = runReducer(withMove, { type: 'TICK', deltaMs: 1000 });

    expect(state.game.clockMs).toBe(withMove.game.clockMs);
  });

  it('ignores further events once the run is over', () => {
    const over = runReducer(createInitialRunState(), { type: 'MOVE', from: 'f2', to: 'f3' });
    const ended: RunState = { ...over, status: 'lost' };

    const state = runReducer(ended, { type: 'MOVE', from: 'e7', to: 'e5' });

    expect(state).toEqual(ended);
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

    expect(state.score).toBe(3);
    expect(state.bestScore).toBe(3);
  });

  it('leaves the best score untouched when the current score does not beat it', () => {
    const state = runReducer(stateAt(2, WHITE_MATES_FEN, 10), { type: 'MOVE', from: 'a1', to: 'a8' });

    expect(state.score).toBe(3);
    expect(state.bestScore).toBe(10);
  });

  it('maps the current tier to a Stockfish skill level', () => {
    expect(currentSkillLevel(createInitialRunState())).toBe(DIFFICULTY_TIERS[0]);
    expect(currentSkillLevel(stateAt(3, WHITE_MATES_FEN))).toBe(DIFFICULTY_TIERS[3]);
  });
});

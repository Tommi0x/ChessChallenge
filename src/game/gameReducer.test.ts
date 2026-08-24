import { describe, expect, it } from 'vitest';
import { createInitialGameState, gameReducer, isGameState, PLAYER_CLOCK_MS } from './gameReducer';

describe('gameReducer', () => {
  it('starts a new game with White to move', () => {
    const state = createInitialGameState();

    expect(state.turn).toBe('w');
    expect(state.status).toBe('playing');
    expect(state.winner).toBeNull();
    expect(state.clockMs).toBe(PLAYER_CLOCK_MS);
  });

  it('applies a legal move and flips the turn', () => {
    const state = gameReducer(createInitialGameState(), {
      type: 'MOVE',
      from: 'e2',
      to: 'e4',
    });

    expect(state.turn).toBe('b');
    expect(state.status).toBe('playing');
    expect(state.fen).toContain(' b ');
  });

  it('ignores an illegal move', () => {
    const initial = createInitialGameState();

    const state = gameReducer(initial, { type: 'MOVE', from: 'e2', to: 'e5' });

    expect(state).toEqual(initial);
  });

  it('detects checkmate and records the winner', () => {
    // Fool's mate: Black delivers checkmate on move 2.
    let state = createInitialGameState();
    state = gameReducer(state, { type: 'MOVE', from: 'f2', to: 'f3' });
    state = gameReducer(state, { type: 'MOVE', from: 'e7', to: 'e5' });
    state = gameReducer(state, { type: 'MOVE', from: 'g2', to: 'g4' });
    state = gameReducer(state, { type: 'MOVE', from: 'd8', to: 'h4' });

    expect(state.status).toBe('checkmate');
    expect(state.winner).toBe('b');
  });

  it('detects stalemate with no winner', () => {
    // White Qg5-g6 boxes in the Black king on h8 with no legal moves and no check.
    const fen = '7k/5K2/8/6Q1/8/8/8/8 w - - 0 1';
    const state = gameReducer(
      { fen, turn: 'w', status: 'playing', winner: null, clockMs: PLAYER_CLOCK_MS },
      { type: 'MOVE', from: 'g5', to: 'g6' },
    );

    expect(state.status).toBe('stalemate');
    expect(state.winner).toBeNull();
  });

  it('promotes a pawn when a promotion piece is given', () => {
    const fen = '8/P7/8/8/8/8/8/k1K5 w - - 0 1';
    const state = gameReducer(
      { fen, turn: 'w', status: 'playing', winner: null, clockMs: PLAYER_CLOCK_MS },
      { type: 'MOVE', from: 'a7', to: 'a8', promotion: 'q' },
    );

    expect(state.fen).toContain('Q');
  });

  it('ignores further moves once the game is over', () => {
    const finished = {
      fen: '8/8/8/8/8/8/8/k1K5 b - - 0 1',
      turn: 'b' as const,
      status: 'checkmate' as const,
      winner: 'w' as const,
      clockMs: PLAYER_CLOCK_MS,
    };

    const state = gameReducer(finished, { type: 'MOVE', from: 'a1', to: 'a2' });

    expect(state).toEqual(finished);
  });

  it('counts down the clock on a TICK while it is the player\'s turn', () => {
    const state = gameReducer(createInitialGameState(), { type: 'TICK', deltaMs: 1000 });

    expect(state.clockMs).toBe(PLAYER_CLOCK_MS - 1000);
    expect(state.status).toBe('playing');
  });

  it('does not count down the clock on a TICK during the bot\'s turn', () => {
    const state = { ...createInitialGameState(), turn: 'b' as const };

    const next = gameReducer(state, { type: 'TICK', deltaMs: 1000 });

    expect(next).toEqual(state);
  });

  it('running out of time ends the game as a timeout loss for the player', () => {
    const state = { ...createInitialGameState(), clockMs: 500 };

    const next = gameReducer(state, { type: 'TICK', deltaMs: 1000 });

    expect(next.status).toBe('timeout');
    expect(next.winner).toBe('b');
    expect(next.clockMs).toBe(0);
  });

  it('ignores TICK events once the game is over', () => {
    const finished = { ...createInitialGameState(), status: 'timeout' as const, winner: 'b' as const, clockMs: 0 };

    const state = gameReducer(finished, { type: 'TICK', deltaMs: 1000 });

    expect(state).toEqual(finished);
  });

  it('recognizes a well-formed game state', () => {
    expect(isGameState(createInitialGameState())).toBe(true);
  });

  it('rejects malformed game state', () => {
    expect(isGameState(null)).toBe(false);
    expect(isGameState({ ...createInitialGameState(), status: 'bogus' })).toBe(false);
    expect(isGameState({ ...createInitialGameState(), clockMs: 'not a number' })).toBe(false);
  });
});

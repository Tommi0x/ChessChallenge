import { Chess } from 'chess.js';

export const PLAYER_CLOCK_MS = 5 * 60 * 1000;

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'timeout';

export type GameState = {
  fen: string;
  turn: 'w' | 'b';
  status: GameStatus;
  winner: 'w' | 'b' | null;
  clockMs: number;
};

export type GameEvent =
  | { type: 'MOVE'; from: string; to: string; promotion?: string }
  | { type: 'TICK'; deltaMs: number };

export function createInitialGameState(): GameState {
  return deriveState(new Chess(), PLAYER_CLOCK_MS);
}

export function gameReducer(state: GameState, event: GameEvent): GameState {
  if (state.status !== 'playing') return state;

  if (event.type === 'TICK') {
    // Only the player's own clock runs, and only on the player's turn.
    if (state.turn !== 'w') return state;
    const clockMs = Math.max(0, state.clockMs - event.deltaMs);
    if (clockMs === 0) return { ...state, clockMs, status: 'timeout', winner: 'b' };
    return { ...state, clockMs };
  }

  const chess = new Chess(state.fen);
  try {
    chess.move({ from: event.from, to: event.to, promotion: event.promotion });
  } catch {
    return state;
  }
  return deriveState(chess, state.clockMs);
}

const GAME_STATUSES: readonly GameStatus[] = ['playing', 'checkmate', 'stalemate', 'draw', 'timeout'];

export function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.fen === 'string' &&
    (v.turn === 'w' || v.turn === 'b') &&
    GAME_STATUSES.includes(v.status as GameStatus) &&
    (v.winner === 'w' || v.winner === 'b' || v.winner === null) &&
    typeof v.clockMs === 'number'
  );
}

function deriveState(chess: Chess, clockMs: number): GameState {
  let status: GameStatus = 'playing';
  let winner: GameState['winner'] = null;

  if (chess.isCheckmate()) {
    status = 'checkmate';
    // The side to move is the one who got checkmated.
    winner = chess.turn() === 'w' ? 'b' : 'w';
  } else if (chess.isStalemate()) {
    status = 'stalemate';
  } else if (chess.isDraw()) {
    status = 'draw';
  }

  return { fen: chess.fen(), turn: chess.turn(), status, winner, clockMs };
}

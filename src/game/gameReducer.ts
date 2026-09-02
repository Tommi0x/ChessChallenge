import { Chess } from 'chess.js';

export const PLAYER_CLOCK_MS = 5 * 60 * 1000;

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'timeout';

export type GameState = {
  fen: string;
  turn: 'w' | 'b';
  status: GameStatus;
  winner: 'w' | 'b' | null;
  clockMs: number;
  /**
   * Wall-clock time of the last TICK the clock was billed for, or `null` when
   * the clock is not running (bot's turn, fresh position, resumed Run). The
   * next TICK re-anchors here rather than billing the gap, which is what makes
   * the clock freeze while the tab is away. Never persisted — see `runStore`.
   */
  lastTickAt: number | null;
};

export type GameEvent =
  | { type: 'MOVE'; from: string; to: string; promotion?: string }
  | { type: 'TICK'; now: number };

export function createInitialGameState(): GameState {
  return deriveState(new Chess(), PLAYER_CLOCK_MS);
}

export function gameReducer(state: GameState, event: GameEvent): GameState {
  if (state.status !== 'playing') return state;

  if (event.type === 'TICK') {
    // Only the player's own clock runs, and only on the player's turn.
    if (state.turn !== 'w') return state;
    // First tick since the clock started running: anchor, bill nothing.
    if (state.lastTickAt === null) return { ...state, lastTickAt: event.now };
    // Clamped, so a clock stepped backwards can never hand back time.
    const elapsed = Math.max(0, event.now - state.lastTickAt);
    const clockMs = Math.max(0, state.clockMs - elapsed);
    if (clockMs === 0) return { ...state, clockMs, lastTickAt: event.now, status: 'timeout', winner: 'b' };
    return { ...state, clockMs, lastTickAt: event.now };
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
    typeof v.clockMs === 'number' &&
    Number.isFinite(v.clockMs) &&
    v.clockMs >= 0 &&
    // Absent in saves written before the clock got an anchor; `runStore` nulls
    // it on the way in either way.
    (v.lastTickAt === null || v.lastTickAt === undefined || typeof v.lastTickAt === 'number')
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

  return { fen: chess.fen(), turn: chess.turn(), status, winner, clockMs, lastTickAt: null };
}

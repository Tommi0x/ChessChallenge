import { Chess } from 'chess.js';

export type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw';

export type GameState = {
  fen: string;
  turn: 'w' | 'b';
  status: GameStatus;
  winner: 'w' | 'b' | null;
};

export type GameEvent = {
  type: 'MOVE';
  from: string;
  to: string;
  promotion?: string;
};

export function createInitialGameState(): GameState {
  return deriveState(new Chess());
}

export function gameReducer(state: GameState, event: GameEvent): GameState {
  if (state.status !== 'playing') return state;

  const chess = new Chess(state.fen);
  try {
    chess.move({ from: event.from, to: event.to, promotion: event.promotion });
  } catch {
    return state;
  }
  return deriveState(chess);
}

function deriveState(chess: Chess): GameState {
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

  return { fen: chess.fen(), turn: chess.turn(), status, winner };
}

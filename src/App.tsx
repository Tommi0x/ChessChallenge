import { useEffect, useReducer, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import type { BotAdapter } from './bot/botAdapter';
import { createInitialGameState, gameReducer } from './game/gameReducer';

const BOT_SKILL_LEVEL = 5;

function statusMessage(status: string, winner: 'w' | 'b' | null): string | null {
  if (status === 'checkmate') return winner === 'w' ? 'Checkmate — you win!' : 'Checkmate — the bot wins.';
  if (status === 'stalemate') return 'Stalemate — the game is drawn.';
  if (status === 'draw') return 'Draw.';
  return null;
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [botError, setBotError] = useState<string | null>(null);
  const botRef = useRef<BotAdapter | null>(null);
  if (botRef.current === null) {
    botRef.current = createStockfishBotAdapter();
  }

  useEffect(() => {
    if (state.status !== 'playing' || state.turn !== 'b') return;

    let cancelled = false;
    botRef.current!.getMove(state.fen, BOT_SKILL_LEVEL).then(
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
  }, [state.fen, state.status, state.turn]);

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare || state.status !== 'playing' || state.turn !== 'w') return false;

    const move = { from: sourceSquare, to: targetSquare, promotion: 'q' };
    const next = gameReducer(state, { type: 'MOVE', ...move });
    if (next === state) return false;

    dispatch({ type: 'MOVE', ...move });
    return true;
  }

  const message = statusMessage(state.status, state.winner);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <h1>ChessChallenge</h1>
      <div style={{ width: 'min(90vw, 480px)' }}>
        <Chessboard
          options={{
            position: state.fen,
            onPieceDrop,
            allowDragging: state.status === 'playing' && state.turn === 'w',
          }}
        />
      </div>
      {message && <p aria-live="polite">{message}</p>}
      {botError && <p role="alert">{botError}</p>}
    </main>
  );
}

export default App;

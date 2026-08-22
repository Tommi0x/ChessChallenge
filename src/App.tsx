import { useEffect, useReducer, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import type { BotAdapter } from './bot/botAdapter';
import { createInitialRunState, currentSkillLevel, runReducer } from './game/runReducer';

function statusMessage(status: string, winner: 'w' | 'b' | null): string | null {
  if (status === 'checkmate') return winner === 'w' ? 'Checkmate — you win!' : 'Checkmate — the bot wins.';
  if (status === 'stalemate') return 'Stalemate — the game is drawn.';
  if (status === 'draw') return 'Draw.';
  return null;
}

function runEndMessage(status: string): string | null {
  if (status === 'ladder-complete') return 'You beat the whole ladder!';
  if (status === 'lost') return 'Run over — the bot won.';
  if (status === 'drawn') return 'Run over — drawn.';
  return null;
}

function App() {
  const [run, dispatch] = useReducer(runReducer, undefined, createInitialRunState);
  const [botError, setBotError] = useState<string | null>(null);
  const botRef = useRef<BotAdapter | null>(null);
  if (botRef.current === null) {
    botRef.current = createStockfishBotAdapter();
  }

  const { game } = run;
  const skillLevel = currentSkillLevel(run);

  useEffect(() => {
    if (game.status !== 'playing' || game.turn !== 'b') return;

    let cancelled = false;
    botRef.current!.getMove(game.fen, skillLevel).then(
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
  }, [game.fen, game.status, game.turn, skillLevel]);

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare || game.status !== 'playing' || game.turn !== 'w') return false;

    const move = { from: sourceSquare, to: targetSquare, promotion: 'q' };
    const next = runReducer(run, { type: 'MOVE', ...move });
    if (next === run) return false;

    dispatch({ type: 'MOVE', ...move });
    return true;
  }

  const message = statusMessage(game.status, game.winner);
  const endMessage = runEndMessage(run.status);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <h1>ChessChallenge</h1>
      <p>
        Score: <strong>{run.score}</strong>
      </p>
      {run.status === 'playing' ? (
        <>
          <div style={{ width: 'min(90vw, 480px)' }}>
            <Chessboard
              options={{
                position: game.fen,
                onPieceDrop,
                allowDragging: game.status === 'playing' && game.turn === 'w',
              }}
            />
          </div>
          {message && <p aria-live="polite">{message}</p>}
        </>
      ) : (
        <div role="alert">
          <p>{endMessage}</p>
          <p>Final score: {run.score}</p>
          <button type="button" onClick={() => dispatch({ type: 'NEW_RUN' })}>
            Start new run
          </button>
        </div>
      )}
      {botError && <p role="alert">{botError}</p>}
    </main>
  );
}

export default App;

import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import type { BotAdapter } from './bot/botAdapter';
import { DIFFICULTY_TIERS } from './game/ladder';
import type { GameStatus } from './game/gameReducer';
import type { RunStatus } from './game/runReducer';
import { createLocalStorageRunStore } from './persistence/runStore';
import { useRun } from './useRun';

const store = createLocalStorageRunStore();

function statusMessage(status: GameStatus, winner: 'w' | 'b' | null): string | null {
  if (status === 'checkmate') return winner === 'w' ? 'Checkmate — you win!' : 'Checkmate — the bot wins.';
  if (status === 'stalemate') return 'Stalemate — the game is drawn.';
  if (status === 'draw') return 'Draw.';
  if (status === 'timeout') return "Time's up — the bot wins.";
  return null;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// One switch for how a Run ends: add an outcome here and nowhere else.
const RUN_END: Record<Exclude<RunStatus, 'playing'>, { heading: string; message: string; className: string }> = {
  'ladder-complete': {
    heading: '🏆 Ladder complete!',
    message: 'You beat the whole ladder!',
    className: 'run-end run-end--ladder-complete',
  },
  lost: { heading: 'Run over', message: 'Run over — the bot won.', className: 'run-end' },
  drawn: { heading: 'Run over', message: 'Run over — drawn.', className: 'run-end' },
};

type RunEndScreenProps = {
  status: Exclude<RunStatus, 'playing'>;
  score: number;
  onNewRun: () => void;
};

function RunEndScreen({ status, score, onNewRun }: RunEndScreenProps) {
  const { heading, message, className } = RUN_END[status];
  return (
    <div role="alert" className={className}>
      <h2>{heading}</h2>
      <p>{message}</p>
      <p>Final score: {score}</p>
      <button type="button" onClick={onNewRun}>
        Start new run
      </button>
    </div>
  );
}

function App() {
  // Lazy initializer: one Bot per mount, built on first render and never again.
  const [bot] = useState<BotAdapter>(createStockfishBotAdapter);

  const { run, botError, onPieceDrop, newRun } = useRun(bot, store);
  const { game } = run;

  function handlePieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare) return false;
    return onPieceDrop(sourceSquare, targetSquare);
  }

  const message = statusMessage(game.status, game.winner);

  return (
    <main className="app">
      <h1>ChessChallenge</h1>
      <p className="stat-pill">
        Bot: <strong>{run.tierIndex + 1}/{DIFFICULTY_TIERS.length}</strong> · Score:{' '}
        <strong>{run.score}</strong> · Best: <strong>{run.bestScore}</strong>
      </p>
      {run.status === 'playing' ? (
        <>
          <p className="stat-pill">
            Clock: <strong>{formatClock(game.clockMs)}</strong>
          </p>
          <div className="board-wrap">
            <Chessboard
              options={{
                position: game.fen,
                onPieceDrop: handlePieceDrop,
                allowDragging: game.status === 'playing' && game.turn === 'w',
              }}
            />
          </div>
          {message && (
            <p className="status-message" aria-live="polite">
              {message}
            </p>
          )}
        </>
      ) : (
        <RunEndScreen status={run.status} score={run.score} onNewRun={newRun} />
      )}
      {botError && (
        <p className="error-message" role="alert">
          {botError}
        </p>
      )}
    </main>
  );
}

export default App;

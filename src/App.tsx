import { useEffect, useReducer, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import type { BotAdapter } from './bot/botAdapter';
import { createInitialRunState, currentSkillLevel, isRunState, runReducer, type RunState } from './game/runReducer';
import type { GameStatus } from './game/gameReducer';
import type { RunStatus } from './game/runReducer';
import { createLocalStoragePersistenceAdapter } from './persistence/persistenceAdapter';
import { runEndPresentation } from './runEndPresentation';

const TICK_MS = 1000;

const isNumber = (value: unknown): value is number => typeof value === 'number';
const bestScoreAdapter = createLocalStoragePersistenceAdapter<number>('chesschallenge:best-score:v1', isNumber);
const runStateAdapter = createLocalStoragePersistenceAdapter<RunState>('chesschallenge:run-state:v1', isRunState);

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

function runEndMessage(status: RunStatus): string | null {
  if (status === 'ladder-complete') return 'You beat the whole ladder!';
  if (status === 'lost') return 'Run over — the bot won.';
  if (status === 'drawn') return 'Run over — drawn.';
  return null;
}

type RunEndScreenProps = {
  status: Exclude<RunStatus, 'playing'>;
  message: string | null;
  score: number;
  onNewRun: () => void;
};

function RunEndScreen({ status, message, score, onNewRun }: RunEndScreenProps) {
  const { heading, className } = runEndPresentation(status);
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
  const [run, dispatch] = useReducer(
    runReducer,
    undefined,
    () => runStateAdapter.load() ?? createInitialRunState(bestScoreAdapter.load() ?? 0),
  );
  const [botError, setBotError] = useState<string | null>(null);
  const botRef = useRef<BotAdapter | null>(null);
  if (botRef.current === null) {
    botRef.current = createStockfishBotAdapter();
  }

  const { game } = run;
  const skillLevel = currentSkillLevel(run);

  useEffect(() => {
    bestScoreAdapter.save(run.bestScore);
  }, [run.bestScore]);

  useEffect(() => {
    runStateAdapter.save(run);
  }, [run]);

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

  useEffect(() => {
    if (game.status !== 'playing' || game.turn !== 'w') return;

    let lastTick = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      dispatch({ type: 'TICK', deltaMs: now - lastTick });
      lastTick = now;
    }, TICK_MS);
    return () => clearInterval(id);
  }, [game.status, game.turn]);

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
    <main className="app">
      <h1>ChessChallenge</h1>
      <p className="stat-pill">
        Score: <strong>{run.score}</strong> · Best: <strong>{run.bestScore}</strong>
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
                onPieceDrop,
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
        <RunEndScreen
          status={run.status}
          message={endMessage}
          score={run.score}
          onNewRun={() => dispatch({ type: 'NEW_RUN' })}
        />
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

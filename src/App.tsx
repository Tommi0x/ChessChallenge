import { useEffect, useRef, useState } from 'react';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import { DIFFICULTY_TIERS, currentTier } from './game/ladder';
import { createInitialGameState, PLAYER_CLOCK_MS } from './game/gameReducer';
import type { RunState } from './game/runReducer';
import { createLocalStorageRunStore } from './persistence/runStore';
import { OpponentPortrait } from './components/OpponentPortrait';
import { GameBoard } from './components/GameBoard';
import { StartScreen } from './components/StartScreen';
import { EndScreen } from './components/EndScreen';
import { ScorePop, type Defeated } from './components/ScorePop';
import { useRun } from './useRun';
import { DebugPanel } from './dev/DebugPanel';
import { debugRunFromQuery, debugScorePop } from './dev/preview';

const SHOW_DEBUG_PANEL = import.meta.env.DEV && !import.meta.env.TEST;
if (SHOW_DEBUG_PANEL) void import('./dev/debug.css');

const SCORE_POP_MS = 2400;
const SCORE_POP_EXIT_MS = 420;
const URGENT_CLOCK_MS = 60_000;

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

/** A Run nobody has touched yet — the one state that earns the start screen. */
function isUntouched(run: RunState): boolean {
  return (
    run.tierIndex === 0 &&
    run.score === 0 &&
    run.status === 'playing' &&
    run.game.clockMs === PLAYER_CLOCK_MS &&
    run.game.fen === createInitialGameState().fen
  );
}

function App() {
  const [store] = useState(createLocalStorageRunStore);
  const [bot] = useState(createStockfishBotAdapter);
  const [preview] = useState(() => import.meta.env.DEV ? debugRunFromQuery() : null);
  const [initialRun] = useState(() => preview ?? store.load());
  const [started, setStarted] = useState(() => !isUntouched(initialRun));
  const [defeated, setDefeated] = useState<Defeated | null>(() => SHOW_DEBUG_PANEL ? debugScorePop() : null);
  const [leaving, setLeaving] = useState(false);
  const { run, botError, onPieceDrop, newRun, retryBot } = useRun(bot, store, !started || defeated !== null, { initialRun, persist: preview === null });
  const { game } = run;
  const previous = useRef({ tierIndex: run.tierIndex, score: run.score });
  const tier = currentTier(run);
  const canInteract = started && !defeated && game.status === 'playing' && game.turn === 'w';

  useEffect(() => () => bot.dispose?.(), [bot]);

  // A rung falls the moment tierIndex advances. That transition — not the run's
  // end — is what the score pop celebrates, so it fires once per rung and never
  // on a resumed page load.
  useEffect(() => {
    const before = previous.current;
    previous.current = { tierIndex: run.tierIndex, score: run.score };
    if (run.tierIndex <= before.tierIndex || run.lastGamePoints === undefined) return;

    setDefeated({
      tier: DIFFICULTY_TIERS[before.tierIndex],
      gain: run.lastGamePoints,
      from: before.score,
      to: run.score,
    });
    setLeaving(false);

    const exit = setTimeout(() => setLeaving(true), SCORE_POP_MS);
    const clear = setTimeout(() => setDefeated(null), SCORE_POP_MS + SCORE_POP_EXIT_MS);
    return () => {
      clearTimeout(exit);
      clearTimeout(clear);
    };
  }, [run.tierIndex, run.score, run.lastGamePoints]);

  function handleNewRun() {
    setDefeated(null);
    previous.current = { tierIndex: 0, score: 0 };
    newRun();
    setStarted(false);
  }

  if (!started) {
    return <>
      <StartScreen bestScore={run.bestScore} onStart={() => setStarted(true)} />
      {SHOW_DEBUG_PANEL && <DebugPanel />}
    </>;
  }
  if (run.status !== 'playing') {
    return <>
      <EndScreen run={{ ...run, status: run.status }} onNewRun={handleNewRun} />
      {SHOW_DEBUG_PANEL && <DebugPanel />}
    </>;
  }

  return (
    // While the pop is up the era stays with the opponent just beaten, so the
    // 900ms ground crossfade becomes the reveal of the next world rather than
    // playing invisibly under an 84% scrim.
    <main className="app" data-era={defeated ? defeated.tier.era : tier.era}>
      <p className="wordmark">ChessChallenge</p>

      <section className="opponent">
        <OpponentPortrait era={tier.era} />
        <div>
          <h1 className="opponent-name">{tier.name}</h1>
          <p className="opponent-rank">
            <span>Round {run.tierIndex + 1}</span>
          </p>
        </div>
      </section>

      <div className="board-wrap">
        <GameBoard fen={game.fen} canInteract={canInteract} onPieceDrop={onPieceDrop} />
      </div>

      <div className="stats">
        <p className="stat">
          <span className="stat-label">Clock</span>
          <span className={`stat-value${game.clockMs < URGENT_CLOCK_MS ? ' is-urgent' : ''}`}>
            {formatClock(game.clockMs)}
          </span>
        </p>
        <p className="stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{run.score.toLocaleString()}</span>
        </p>
        <p className="stat">
          <span className="stat-label">Best</span>
          <span className="stat-value">{run.bestScore.toLocaleString()}</span>
        </p>
      </div>

      {botError && <div className="error-line" role="alert">{botError} <button type="button" className="btn btn-quiet" onClick={retryBot}>Retry</button></div>}

      {defeated && <ScorePop defeated={defeated} leaving={leaving} />}

      {SHOW_DEBUG_PANEL && <DebugPanel />}
    </main>
  );
}

export default App;

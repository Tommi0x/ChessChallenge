import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import type { BotAdapter } from './bot/botAdapter';
import { DIFFICULTY_TIERS, currentTier } from './game/ladder';
import type { DifficultyTier } from './game/ladder';
import { createInitialGameState, PLAYER_CLOCK_MS } from './game/gameReducer';
import type { GameStatus } from './game/gameReducer';
import type { RunState, RunStatus } from './game/runReducer';
import { createLocalStorageRunStore } from './persistence/runStore';
import { OpponentPortrait } from './OpponentPortrait';
import { useRun } from './useRun';
import { DebugPanel } from './DebugPanel';

const store = createLocalStorageRunStore();

// Stripped from production by import.meta.env.DEV; also off under the test
// runner (which sets DEV too) so the panel's own buttons don't collide with
// what the tests are asserting on.
const SHOW_DEBUG_PANEL = import.meta.env.DEV && !import.meta.env.TEST;

const SCORE_POP_MS = 2400;
const SCORE_POP_EXIT_MS = 420;
const COUNT_UP_MS = 900;
const URGENT_CLOCK_MS = 60_000;

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

function statusMessage(status: GameStatus, winner: 'w' | 'b' | null): string {
  if (status === 'checkmate') return winner === 'w' ? 'Checkmate. The rung is yours.' : 'Checkmate. That is the end of the run.';
  if (status === 'stalemate') return 'Stalemate. A draw ends the run.';
  if (status === 'draw') return 'Drawn. That ends the run.';
  if (status === 'timeout') return 'Your clock ran out.';
  return '';
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

/** Counts from a start value to an end value once, then holds. */
function useCountUp(from: number, to: number, active: boolean): number {
  const [value, setValue] = useState(to);

  useEffect(() => {
    // State already holds `to`, so with no rAF (jsdom, or a very old client) the
    // final number is simply shown without animating to it.
    if (!active || typeof requestAnimationFrame !== 'function') return;
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / COUNT_UP_MS);
      // Ease out: the number sprints, then settles onto its final digits.
      setValue(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [from, to, active]);

  return value;
}

type Defeated = { tier: DifficultyTier; gain: number; from: number; to: number };

/** `?scorepop=n` previews the score-pop overlay for beating tier n, so it can
 *  be seen without playing to it. Debug only. */
function debugScorePop(): Defeated | null {
  const raw = new URLSearchParams(location.search).get('scorepop');
  const n = Number(raw);
  if (raw === null || !Number.isInteger(n) || n < 0 || n >= DIFFICULTY_TIERS.length) return null;
  const gain = (n + 1) * 100;
  return { tier: DIFFICULTY_TIERS[n], gain, from: 0, to: gain };
}

export function ScorePop({ defeated, leaving }: { defeated: Defeated; leaving: boolean }) {
  const shown = useCountUp(defeated.from, defeated.to, true);
  return (
    <div className={`score-pop${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <p className="score-pop-name">{defeated.tier.name}</p>
      <p className="score-pop-total">{shown.toLocaleString()}</p>
      <p className="score-pop-gain">+{defeated.gain.toLocaleString()}</p>
    </div>
  );
}

const END_COPY: Record<Exclude<RunStatus, 'playing'>, { headline: string; detail: (t: DifficultyTier) => string }> = {
  lost: {
    headline: 'The climb ends here.',
    detail: (t) => `${t.name} was too much. One life, one ladder — that is the whole game.`,
  },
  drawn: {
    headline: 'A draw ends it too.',
    detail: (t) => `You held ${t.name} to a draw. Holding is not beating, and the run stops.`,
  },
  'ladder-complete': {
    headline: 'You beat the Singularity.',
    detail: () => 'Ten rungs, from a monkey to the thing that already knew how this ends. Nothing above you.',
  },
};

function App() {
  const [bot] = useState<BotAdapter>(createStockfishBotAdapter);
  const [defeated, setDefeated] = useState<Defeated | null>(() => (SHOW_DEBUG_PANEL ? debugScorePop() : null));
  // The clock must not run under the celebration: the next Game has already
  // started underneath it, and billing that time would pay speed for a rung the
  // player never got to play.
  const { run, botError, onPieceDrop, newRun } = useRun(bot, store, defeated !== null);
  const { game } = run;

  const [started, setStarted] = useState(() => !isUntouched(run));
  const [leaving, setLeaving] = useState(false);
  const previous = useRef({ tierIndex: run.tierIndex, score: run.score });

  const tier = currentTier(run);

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

  function handleDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    return targetSquare ? onPieceDrop(sourceSquare, targetSquare) : false;
  }

  function handleNewRun() {
    setDefeated(null);
    previous.current = { tierIndex: 0, score: 0 };
    newRun();
    setStarted(true);
  }

  if (!started) {
    return (
      <main className="app" data-era={DIFFICULTY_TIERS[0].era}>
        <div className="start">
          <h1 className="start-title">
            Ten minds.
            <span>One life.</span>
          </h1>
          <p className="start-blurb">
            You are White, with five minutes on your clock. Beat an opponent and you climb; lose or
            draw even once and the run is over. How far up you get is your score.
          </p>
          <ol className="ladder">
            {DIFFICULTY_TIERS.map((t) => (
              <li key={t.name}>{t.name}</li>
            ))}
          </ol>
          <button type="button" className="btn" onClick={() => setStarted(true)}>
            Face the Monkey
          </button>
          {run.bestScore > 0 && (
            <p className="start-note">Your best so far: {run.bestScore.toLocaleString()}</p>
          )}
        </div>
        {SHOW_DEBUG_PANEL && <DebugPanel />}
      </main>
    );
  }

  if (run.status !== 'playing') {
    const fell = DIFFICULTY_TIERS[run.tierIndex];
    const copy = END_COPY[run.status];
    const isBest = run.score > 0 && run.score >= run.bestScore;
    return (
      <main className="app" data-era={run.status === 'ladder-complete' ? 'blank' : fell.era}>
        <div className="end" role="alert">
          <h1 className="end-headline">{copy.headline}</h1>
          <p className="end-detail">{copy.detail(fell)}</p>
          <p className="end-score">
            <span className="end-score-value">{run.score.toLocaleString()}</span>
            <span className="end-score-label">{isBest ? 'New best score' : 'Final score'}</span>
          </p>
          <p className="end-best">
            You reached rung <strong>{run.tierIndex + 1}</strong> of {DIFFICULTY_TIERS.length}
            {!isBest && <> · Best: <strong>{run.bestScore.toLocaleString()}</strong></>}
          </p>
          <div className="end-actions">
            <button type="button" className="btn" onClick={handleNewRun}>
              Climb again
            </button>
          </div>
        </div>
        {SHOW_DEBUG_PANEL && <DebugPanel />}
      </main>
    );
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
          <p className="opponent-tagline">{tier.tagline}</p>
          <p className="opponent-rank">
            <span>Rung {run.tierIndex + 1} / {DIFFICULTY_TIERS.length}</span>
            <span>{tier.elo} Elo</span>
          </p>
        </div>
      </section>

      <div className="board-wrap">
        <Chessboard
          options={{
            position: game.fen,
            onPieceDrop: handleDrop,
            allowDragging: game.status === 'playing' && game.turn === 'w',
          }}
        />
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

      <p className="status-line" aria-live="polite">
        {statusMessage(game.status, game.winner)}
      </p>

      {botError && <p className="error-line" role="alert">{botError}</p>}

      {defeated && <ScorePop defeated={defeated} leaving={leaving} />}

      {SHOW_DEBUG_PANEL && <DebugPanel />}
    </main>
  );
}

export default App;

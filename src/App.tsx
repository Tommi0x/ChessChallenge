import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { PieceDropHandlerArgs, PieceHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { createStockfishBotAdapter } from './bot/stockfishBotAdapter';
import type { BotAdapter } from './bot/botAdapter';
import { DIFFICULTY_TIERS, currentTier } from './game/ladder';
import type { DifficultyTier } from './game/ladder';
import { createInitialGameState, PLAYER_CLOCK_MS } from './game/gameReducer';
import type { GameStatus } from './game/gameReducer';
import type { RunState, RunStatus } from './game/runReducer';
import { createLocalStorageRunStore } from './persistence/runStore';
import { createLocalStoragePersistenceAdapter } from './persistence/persistenceAdapter';
import { OpponentPortrait } from './OpponentPortrait';
import { useRun } from './useRun';
import { DebugPanel } from './DebugPanel';
import { stauntyPieces } from './stauntyPieces';

const store = createLocalStorageRunStore();

/** The name on the score card. Outlives the Run it was typed on, so a player who
 *  climbs again is not asked who they are a second time. */
const nameStore = createLocalStoragePersistenceAdapter(
  'chesschallenge:player-name:v1',
  (value): value is string => typeof value === 'string',
);

// Stripped from production by import.meta.env.DEV; also off under the test
// runner (which sets DEV too) so the panel's own buttons don't collide with
// what the tests are asserting on.
const SHOW_DEBUG_PANEL = import.meta.env.DEV && !import.meta.env.TEST;

const SCORE_POP_MS = 2400;
const SCORE_POP_EXIT_MS = 420;
const COUNT_UP_MS = 900;
const URGENT_CLOCK_MS = 60_000;

const SELECTED_SQUARE_STYLE: CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
};
const MOVE_DOT_STYLE: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.28) 19%, transparent 20%)',
};
const CAPTURE_RING_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, transparent 0%, transparent 79%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.28) 90%, transparent 91%)',
};

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

/** The card is a scoreboard, so the outcome is carried for screen readers only —
 *  sighted players read it off the icon grid. */
const END_LABEL: Record<Exclude<RunStatus, 'playing'>, string> = {
  lost: 'Run over.',
  drawn: 'Run over — drawn.',
  'ladder-complete': 'Ladder complete.',
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
  const [playerName, setPlayerName] = useState(() => nameStore.load() ?? '');
  const previous = useRef({ tierIndex: run.tierIndex, score: run.score });

  const tier = currentTier(run);
  const canInteract = game.status === 'playing' && game.turn === 'w';

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  // Every move (the player's or the Bot's) changes the fen, and a stale
  // selection pointing at a square from the position before it makes no sense.
  // Adjusted during render rather than in an effect, per React's guidance for
  // resetting state when an input changes — no extra render, no flash of the
  // stale selection.
  const [fenAtSelection, setFenAtSelection] = useState(game.fen);
  if (game.fen !== fenAtSelection) {
    setFenAtSelection(game.fen);
    setSelectedSquare(null);
  }

  const legalMoves = selectedSquare ? new Chess(game.fen).moves({ square: selectedSquare, verbose: true }) : [];
  const squareStyles: Record<string, CSSProperties> = {};
  if (selectedSquare) {
    squareStyles[selectedSquare] = SELECTED_SQUARE_STYLE;
    for (const move of legalMoves) {
      squareStyles[move.to] = move.captured ? CAPTURE_RING_STYLE : MOVE_DOT_STYLE;
    }
  }

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
    const moved = targetSquare ? onPieceDrop(sourceSquare, targetSquare) : false;
    // A drop that misses a legal square never changes the fen, so nothing else
    // would clear the grabbed piece's highlights — clear them here regardless
    // of whether the move landed.
    setSelectedSquare(null);
    return moved;
  }

  function handleDragStart({ square }: PieceHandlerArgs) {
    // Grabbing a piece shows its legal moves the same way selecting it by
    // click does; dragging a different piece than the one already selected
    // just switches which one is highlighted.
    if (canInteract && square) setSelectedSquare(square as Square);
  }

  function handleSquareClick({ piece, square }: SquareHandlerArgs) {
    if (!canInteract) return;

    if (selectedSquare && legalMoves.some((move) => move.to === square)) {
      onPieceDrop(selectedSquare, square);
      setSelectedSquare(null);
      return;
    }

    const clickedOwnPiece = piece !== null && piece.pieceType.startsWith('w');
    setSelectedSquare(clickedOwnPiece && square !== selectedSquare ? (square as Square) : null);
  }

  function handleNewRun() {
    setDefeated(null);
    previous.current = { tierIndex: 0, score: 0 };
    newRun();
    setStarted(true);
  }

  if (!started) {
    return (
      <main className="app" data-era="start">
        <div className="start">
          <h1 className="start-title">ChessChallenge</h1>
          {run.bestScore > 0 && (
            <p className="stat">
              <span className="stat-label">Best</span>
              <span className="stat-value">{run.bestScore.toLocaleString()}</span>
            </p>
          )}
          <button type="button" className="btn" onClick={() => setStarted(true)}>
            Start Challenge
          </button>
        </div>
        {SHOW_DEBUG_PANEL && <DebugPanel />}
      </main>
    );
  }

  if (run.status !== 'playing') {
    const fell = DIFFICULTY_TIERS[run.tierIndex];
    // Ladder-complete never advances tierIndex past the last rung, but that
    // last rung was beaten to get there; every other end status stops on the
    // rung that beat the player, so only the rungs before it were beaten.
    const beatenCount = run.status === 'ladder-complete' ? DIFFICULTY_TIERS.length : run.tierIndex;
    return (
      <main className="app" data-era={run.status === 'ladder-complete' ? 'blank' : fell.era}>
        <div className="end" role="alert">
          <p className="sr-only">{END_LABEL[run.status]}</p>
          <p className="end-wordmark">ChessChallenge</p>
          <input
            className="end-name"
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              nameStore.save(e.target.value);
            }}
            placeholder="Your name"
            aria-label="Your name"
            maxLength={18}
            autoComplete="name"
            spellCheck={false}
          />
          <div className="end-bots" aria-hidden="true">
            {DIFFICULTY_TIERS.map((t, i) => (
              <div
                key={t.name}
                className={`end-bot${i < beatenCount ? ' is-beaten' : i === beatenCount ? ' is-lost-to' : ''}`}
              >
                <OpponentPortrait era={t.era} />
              </div>
            ))}
          </div>
          <p className="end-score">
            <span className="end-score-value">{run.score.toLocaleString()}</span>
            <span className="end-score-label">Score</span>
          </p>
        </div>
        <div className="end-actions">
          <button type="button" className="btn" onClick={handleNewRun}>
            Climb again
          </button>
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
          <p className="opponent-rank">
            <span>Round {run.tierIndex + 1}</span>
          </p>
        </div>
      </section>

      <div className="board-wrap">
        <Chessboard
          options={{
            position: game.fen,
            pieces: stauntyPieces,
            onPieceDrop: handleDrop,
            onPieceDrag: handleDragStart,
            onPieceDragCancel: () => setSelectedSquare(null),
            onSquareClick: handleSquareClick,
            squareStyles,
            allowDragging: canInteract,
            animationDurationInMs: 225,
            // Notation sits absolutely-positioned in the same square as the piece, which
            // paints it above a piece's static box regardless of DOM order — push it behind.
            alphaNotationStyle: { zIndex: -1 },
            numericNotationStyle: { zIndex: -1 },
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

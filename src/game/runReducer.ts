import {
  createInitialGameState,
  gameReducer,
  isGameState,
  PLAYER_CLOCK_MS,
  type GameEvent,
  type GameState,
} from './gameReducer';
import { DIFFICULTY_TIERS } from './ladder';

export type RunStatus = 'playing' | 'lost' | 'drawn' | 'ladder-complete';

export type RunState = {
  tierIndex: number;
  score: number;
  bestScore: number;
  status: RunStatus;
  game: GameState;
  /** Points earned by the most recent Game won, so the UI can show what a win paid. */
  lastGamePoints?: number;
};

export type RunEvent = GameEvent | { type: 'NEW_RUN' };

export function createInitialRunState(bestScore = 0): RunState {
  return { tierIndex: 0, score: 0, bestScore, status: 'playing', game: createInitialGameState() };
}

/** The most a fast win can add on top of its rung. Kept strictly below TIER_BASE so
 *  that speed never outranks depth: see gamePoints. */
const MAX_SPEED_BONUS = 50;
const TIER_BASE = 100;
/** Curve on the unspent-clock fraction. > 1 makes early minutes worth more than
 *  late ones; 1 would be linear. The calibration knob for how sharply speed pays. */
const SPEED_CURVE_EXPONENT = 2;

// Points for winning one Game: the rung is worth TIER_BASE per step, plus a speed
// bonus for the share of the 5-minute clock left unspent.
//
// The bonus curves rather than scaling linearly, so the first minutes you save are
// worth far more than the last: dropping 4:30 -> 4:00 costs more than 1:00 -> 0:30.
// It stays flat across rungs and capped below one rung's worth, which is what makes
// the best possible run of n bots always score below the worst possible run of n + 1.
export function gamePoints(tierIndex: number, clockMs: number): number {
  const base = (tierIndex + 1) * TIER_BASE;
  const unspent = clockMs / PLAYER_CLOCK_MS;
  return base + Math.round(MAX_SPEED_BONUS * unspent ** SPEED_CURVE_EXPONENT);
}

const RUN_STATUSES: readonly RunStatus[] = ['playing', 'lost', 'drawn', 'ladder-complete'];

export function isRunState(value: unknown): value is RunState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (
    typeof v.tierIndex !== 'number' ||
    v.tierIndex < 0 ||
    v.tierIndex >= DIFFICULTY_TIERS.length ||
    typeof v.score !== 'number' ||
    typeof v.bestScore !== 'number' ||
    (v.lastGamePoints !== undefined && typeof v.lastGamePoints !== 'number') ||
    !RUN_STATUSES.includes(v.status as RunStatus) ||
    !isGameState(v.game)
  ) {
    return false;
  }
  // A run and its inner game must agree on whether play is still in progress.
  return (v.status === 'playing') === (v.game.status === 'playing');
}

export function runReducer(state: RunState, event: RunEvent): RunState {
  if (event.type === 'NEW_RUN') return createInitialRunState(state.bestScore);
  if (state.status !== 'playing') return state;

  const game = gameReducer(state.game, event);
  if (game === state.game) return state;
  if (game.status === 'playing') return { ...state, game };

  const playerWon = game.status === 'checkmate' && game.winner === 'w';
  if (!playerWon) {
    const runStatus = game.status === 'checkmate' || game.status === 'timeout' ? 'lost' : 'drawn';
    return { ...state, game, status: runStatus };
  }

  const lastGamePoints = gamePoints(state.tierIndex, game.clockMs);
  const score = state.score + lastGamePoints;
  const bestScore = Math.max(state.bestScore, score);
  const nextTierIndex = state.tierIndex + 1;
  if (nextTierIndex >= DIFFICULTY_TIERS.length) {
    return { ...state, game, score, bestScore, lastGamePoints, status: 'ladder-complete' };
  }
  return {
    ...state,
    tierIndex: nextTierIndex,
    score,
    bestScore,
    lastGamePoints,
    status: 'playing',
    game: createInitialGameState(),
  };
}

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
};

export type RunEvent = GameEvent | { type: 'NEW_RUN' };

export function createInitialRunState(bestScore = 0): RunState {
  return { tierIndex: 0, score: 0, bestScore, status: 'playing', game: createInitialGameState() };
}

// Points for winning one Game: harder rungs are worth more, and half the rung's
// value is scaled by how much of the 5-minute clock is left, so a fast win beats
// a grind on the same bot.
export function gamePoints(tierIndex: number, clockMs: number): number {
  const base = (tierIndex + 1) * 100;
  return base + Math.round((base / 2) * (clockMs / PLAYER_CLOCK_MS));
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

  const score = state.score + gamePoints(state.tierIndex, game.clockMs);
  const bestScore = Math.max(state.bestScore, score);
  const nextTierIndex = state.tierIndex + 1;
  if (nextTierIndex >= DIFFICULTY_TIERS.length) {
    return { ...state, game, score, bestScore, status: 'ladder-complete' };
  }
  return { ...state, tierIndex: nextTierIndex, score, bestScore, status: 'playing', game: createInitialGameState() };
}

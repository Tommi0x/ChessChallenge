import { createInitialGameState, gameReducer, isGameState, type GameEvent, type GameState } from './gameReducer';
import type { DifficultyTier } from '../bot/botAdapter';

// The ladder, played in order. Targets 200-2000 Elo in even 200-point steps.
// The bottom six rungs sit below the engine's UCI_Elo floor and are approximated
// by search budget + blunder rate, so their Elo is an aim, not a measurement.
export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  { elo: 200, nodes: 1, blunderChance: 0.5 },
  { elo: 400, nodes: 2, blunderChance: 0.35 },
  { elo: 600, nodes: 5, blunderChance: 0.25 },
  { elo: 800, nodes: 15, blunderChance: 0.15 },
  { elo: 1000, nodes: 50, blunderChance: 0.08 },
  { elo: 1200, nodes: 200, blunderChance: 0.03 },
  { elo: 1400 },
  { elo: 1600 },
  { elo: 1800 },
  { elo: 2000 },
];

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

export function currentTier(state: RunState): DifficultyTier {
  return DIFFICULTY_TIERS[state.tierIndex];
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

  const score = state.score + 1;
  const bestScore = Math.max(state.bestScore, score);
  const nextTierIndex = state.tierIndex + 1;
  if (nextTierIndex >= DIFFICULTY_TIERS.length) {
    return { ...state, game, score, bestScore, status: 'ladder-complete' };
  }
  return { ...state, tierIndex: nextTierIndex, score, bestScore, status: 'playing', game: createInitialGameState() };
}

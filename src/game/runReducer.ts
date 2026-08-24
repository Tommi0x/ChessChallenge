import { createInitialGameState, gameReducer, isGameState, type GameEvent, type GameState } from './gameReducer';

// Skill level (0-20) for each rung of the ladder, played in order.
export const DIFFICULTY_TIERS: readonly number[] = [0, 2, 4, 6, 8, 10, 12, 14, 17, 20];

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

export function currentSkillLevel(state: RunState): number {
  return DIFFICULTY_TIERS[state.tierIndex];
}

const RUN_STATUSES: readonly RunStatus[] = ['playing', 'lost', 'drawn', 'ladder-complete'];

export function isRunState(value: unknown): value is RunState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tierIndex === 'number' &&
    v.tierIndex >= 0 &&
    v.tierIndex < DIFFICULTY_TIERS.length &&
    typeof v.score === 'number' &&
    typeof v.bestScore === 'number' &&
    RUN_STATUSES.includes(v.status as RunStatus) &&
    isGameState(v.game)
  );
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

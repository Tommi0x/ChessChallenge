import { createInitialGameState, gameReducer, type GameEvent, type GameState } from './gameReducer';

// Skill level (0-20) for each rung of the ladder, played in order.
export const DIFFICULTY_TIERS: readonly number[] = [0, 2, 4, 6, 8, 10, 12, 14, 17, 20];

export type RunStatus = 'playing' | 'lost' | 'drawn' | 'ladder-complete';

export type RunState = {
  tierIndex: number;
  score: number;
  status: RunStatus;
  game: GameState;
};

export type RunEvent = GameEvent | { type: 'NEW_RUN' };

export function createInitialRunState(): RunState {
  return { tierIndex: 0, score: 0, status: 'playing', game: createInitialGameState() };
}

export function currentSkillLevel(state: RunState): number {
  return DIFFICULTY_TIERS[state.tierIndex];
}

export function runReducer(state: RunState, event: RunEvent): RunState {
  if (event.type === 'NEW_RUN') return createInitialRunState();
  if (state.status !== 'playing') return state;

  const game = gameReducer(state.game, event);
  if (game === state.game) return state;
  if (game.status === 'playing') return { ...state, game };

  const playerWon = game.status === 'checkmate' && game.winner === 'w';
  if (!playerWon) {
    return { ...state, game, status: game.status === 'checkmate' ? 'lost' : 'drawn' };
  }

  const score = state.score + 1;
  const nextTierIndex = state.tierIndex + 1;
  if (nextTierIndex >= DIFFICULTY_TIERS.length) {
    return { ...state, game, score, status: 'ladder-complete' };
  }
  return { tierIndex: nextTierIndex, score, status: 'playing', game: createInitialGameState() };
}

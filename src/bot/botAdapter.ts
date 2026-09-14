import type { DifficultyTier } from '../game/ladder';

export type BotMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type BotAdapter = {
  /** Cancels pending work and releases the worker; reusable afterwards. */
  dispose?(): void;
  getMove(fen: string, tier: DifficultyTier, signal?: AbortSignal): Promise<BotMove>;
};

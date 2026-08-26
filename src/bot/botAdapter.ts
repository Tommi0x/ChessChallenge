import type { DifficultyTier } from '../game/ladder';

export type BotMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type BotAdapter = {
  getMove(fen: string, tier: DifficultyTier): Promise<BotMove>;
};

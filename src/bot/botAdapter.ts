export type BotMove = {
  from: string;
  to: string;
  promotion?: string;
};

/**
 * How to weaken the engine for one rung of the ladder.
 *
 * Stockfish's own `UCI_Elo` calibration only reaches down to ~1320, so tiers
 * below that are approximated by starving the search (`nodes`) and mixing in
 * random legal moves (`blunderChance`). Those two are the calibration knobs:
 * adjust them, not the code, when a rung plays too hard or too soft.
 */
export type DifficultyTier = {
  /** Target Elo for this rung — what the settings below aim at. */
  elo: number;
  /** Search budget in nodes. Omitted = let the engine hit `elo` via UCI_Elo. */
  nodes?: number;
  /** Probability (0-1) of playing a random legal move instead of the engine's. */
  blunderChance?: number;
};

export type BotAdapter = {
  getMove(fen: string, tier: DifficultyTier): Promise<BotMove>;
};

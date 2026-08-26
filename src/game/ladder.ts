/**
 * The ladder: every Difficulty Tier, in the order a Run plays them.
 *
 * Stockfish's own `UCI_Elo` calibration only reaches down to ~1320, so rungs
 * below that are approximated by starving the search (`nodes`) and mixing in
 * random legal moves (`blunderChance`). The `kind` tag says which of the two
 * weakening strategies a rung uses, so the Bot adapter switches on it once
 * instead of re-deriving it from which fields are present.
 *
 * `nodes` and `blunderChance` are the calibration knobs: adjust them, not the
 * code, when a rung plays too hard or too soft.
 */
export type DifficultyTier =
  | {
      kind: 'starved';
      /** Target Elo for this rung — what the settings below aim at. */
      elo: number;
      /** Search budget in nodes. */
      nodes: number;
      /** Probability (0-1) of playing a random legal move instead of the engine's. */
      blunderChance: number;
    }
  | {
      kind: 'calibrated';
      /** Handed to the engine as `UCI_Elo`. */
      elo: number;
    };

// Targets 200-2000 Elo in even 200-point steps. The bottom six rungs sit below
// the engine's UCI_Elo floor, so their Elo is an aim, not a measurement.
export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  { kind: 'starved', elo: 200, nodes: 1, blunderChance: 0.5 },
  { kind: 'starved', elo: 400, nodes: 2, blunderChance: 0.35 },
  { kind: 'starved', elo: 600, nodes: 5, blunderChance: 0.25 },
  { kind: 'starved', elo: 800, nodes: 15, blunderChance: 0.15 },
  { kind: 'starved', elo: 1000, nodes: 50, blunderChance: 0.08 },
  { kind: 'starved', elo: 1200, nodes: 200, blunderChance: 0.03 },
  { kind: 'calibrated', elo: 1400 },
  { kind: 'calibrated', elo: 1600 },
  { kind: 'calibrated', elo: 1800 },
  { kind: 'calibrated', elo: 2000 },
];

export function currentTier(state: { tierIndex: number }): DifficultyTier {
  return DIFFICULTY_TIERS[state.tierIndex];
}

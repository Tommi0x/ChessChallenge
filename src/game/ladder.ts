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
/**
 * Who the player is facing on this rung. The ladder climbs intelligence itself,
 * from a monkey to whatever comes after us, so identity belongs on the tier
 * rather than in a parallel array that could drift out of step with it.
 *
 * `era` keys the screen's whole visual treatment (see `[data-era]` in index.css)
 * and the portrait drawn in `OpponentPortrait`; adding a rung means adding an
 * era block in both places.
 */
export type OpponentIdentity = {
  /** Display name, shown on the opponent plate above the board. */
  name: string;
  /** Theme key: drives the era palette and the portrait. */
  era: Era;
};

export type Era =
  | 'jungle'
  | 'cave'
  | 'dawn'
  | 'tavern'
  | 'club'
  | 'hall'
  | 'machine'
  | 'network'
  | 'void'
  | 'blank';

export type DifficultyTier = OpponentIdentity &
  (
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
      }
  );

// Targets 200-2000 Elo in even 200-point steps. The bottom six rungs sit below
// the engine's UCI_Elo floor, so their Elo is an aim, not a measurement.
export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  {
    kind: 'starved', elo: 200, nodes: 1, blunderChance: 0.5,
    name: 'The Monkey', era: 'jungle',
  },
  {
    kind: 'starved', elo: 400, nodes: 2, blunderChance: 0.35,
    name: 'The Neanderthal', era: 'cave',
  },
  {
    kind: 'starved', elo: 600, nodes: 5, blunderChance: 0.25,
    name: 'Homo Sapiens', era: 'dawn',
  },
  {
    kind: 'starved', elo: 800, nodes: 15, blunderChance: 0.15,
    name: 'The Village Player', era: 'tavern',
  },
  {
    kind: 'starved', elo: 1000, nodes: 50, blunderChance: 0.08,
    name: 'The Club Player', era: 'club',
  },
  {
    kind: 'starved', elo: 1200, nodes: 200, blunderChance: 0.03,
    name: 'The Grandmaster', era: 'hall',
  },
  {
    kind: 'calibrated', elo: 1400,
    name: 'The Computer', era: 'machine',
  },
  {
    kind: 'calibrated', elo: 1600,
    name: 'The AI', era: 'network',
  },
  {
    kind: 'calibrated', elo: 1800,
    name: 'The Alien', era: 'void',
  },
  {
    kind: 'calibrated', elo: 2000,
    name: 'The Singularity', era: 'blank',
  },
];

export function currentTier(state: { tierIndex: number }): DifficultyTier {
  return DIFFICULTY_TIERS[state.tierIndex];
}

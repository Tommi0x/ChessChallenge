import { createInitialRunState, isRunState, type RunState } from '../game/runReducer';
import { createLocalStoragePersistenceAdapter } from './persistenceAdapter';

/**
 * The one owner of Run State and Best Score on the way to and from storage.
 *
 * Everything the two keys need to agree on lives here: which snapshot wins on
 * load, which writes are worth making, and what must never be persisted.
 */
export type RunStore = {
  load(): RunState;
  save(run: RunState): void;
};

const RUN_STATE_KEY = 'chesschallenge:run-state:v1';
const BEST_SCORE_KEY = 'chesschallenge:best-score:v1';

const isNumber = (value: unknown): value is number => typeof value === 'number';

export function createLocalStorageRunStore(): RunStore {
  const runStateAdapter = createLocalStoragePersistenceAdapter<RunState>(RUN_STATE_KEY, isRunState);
  const bestScoreAdapter = createLocalStoragePersistenceAdapter<number>(BEST_SCORE_KEY, isNumber);

  let lastSavedKey: string | null = null;
  let lastSavedBestScore: number | null = null;

  return {
    load() {
      const savedBest = bestScoreAdapter.load() ?? 0;
      const savedRun = runStateAdapter.load();
      if (!savedRun) return createInitialRunState(savedBest);
      return {
        ...savedRun,
        // Reconcile against the standalone best-score key in case another tab raised it more recently.
        bestScore: Math.max(savedRun.bestScore, savedBest),
        // A resumed Run starts its clock unanchored, so time spent away is not billed.
        game: { ...savedRun.game, lastTickAt: null },
      };
    },

    save(run) {
      if (run.bestScore !== lastSavedBestScore) {
        lastSavedBestScore = run.bestScore;
        bestScoreAdapter.save(run.bestScore);
      }
      // Snapshot after moves/run transitions only, not every clock TICK (ADR 0003).
      const key = `${run.game.fen}|${run.game.status}|${run.status}|${run.tierIndex}`;
      if (key === lastSavedKey) return;
      lastSavedKey = key;
      // lastTickAt is wall-clock: persisting it would bill the player for the
      // time the tab was closed.
      runStateAdapter.save({ ...run, game: { ...run.game, lastTickAt: null } });
    },
  };
}

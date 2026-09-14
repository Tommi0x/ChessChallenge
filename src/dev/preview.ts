import { createInitialRunState, type RunState, type RunStatus } from '../game/runReducer';
import { DIFFICULTY_TIERS } from '../game/ladder';
import type { Defeated } from '../components/ScorePop';

const DEBUG_STATUSES: readonly RunStatus[] = ['lost', 'drawn', 'ladder-complete'];

/** `?tier=n` starts a throwaway Run on rung n, so any Bot can be seen without
 *  beating the ones below it. `?status=lost|drawn|ladder-complete` (optionally
 *  combined with `?tier=n`) fakes that Run's outcome directly, so every
 *  end-of-run screen can be previewed without actually winning or losing.
 *  Nothing else reads the query string. */
export function debugRunFromQuery(): RunState | null {
  const params = new URLSearchParams(location.search);
  const rawTier = params.get('tier');
  const n = Number(rawTier);
  const hasTier = rawTier !== null && Number.isInteger(n) && n >= 0 && n < DIFFICULTY_TIERS.length;
  const status = params.get('status') as RunStatus | null;
  if (!hasTier && status === null) return null;
  if (status !== null && !DEBUG_STATUSES.includes(status)) return hasTier ? { ...createInitialRunState(), tierIndex: n } : null;

  const tierIndex = status === 'ladder-complete' ? DIFFICULTY_TIERS.length - 1 : hasTier ? n : 0;
  const run = { ...createInitialRunState(), tierIndex, score: (tierIndex + 1) * 100 };
  if (status === null) return run;

  const gameOutcome =
    status === 'lost' ? { status: 'checkmate' as const, winner: 'b' as const } :
    status === 'drawn' ? { status: 'draw' as const, winner: null } :
    { status: 'checkmate' as const, winner: 'w' as const };
  return { ...run, status, game: { ...run.game, ...gameOutcome } };
}
/** `?scorepop=n` previews the score-pop overlay for beating tier n, so it can
 *  be seen without playing to it. Debug only. */
export function debugScorePop(): Defeated | null {
  const raw = new URLSearchParams(location.search).get('scorepop');
  const n = Number(raw);
  if (raw === null || !Number.isInteger(n) || n < 0 || n >= DIFFICULTY_TIERS.length) return null;
  const gain = (n + 1) * 100;
  return { tier: DIFFICULTY_TIERS[n], gain, from: 0, to: gain };
}

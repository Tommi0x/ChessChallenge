import type { RunStatus } from './game/runReducer';

export function runEndPresentation(status: Exclude<RunStatus, 'playing'>): { heading: string; className: string } {
  if (status === 'ladder-complete') return { heading: '🏆 Ladder complete!', className: 'run-end run-end--ladder-complete' };
  return { heading: 'Run over', className: 'run-end' };
}

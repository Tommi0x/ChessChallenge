import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialRunState } from './game/runReducer';

vi.mock('./bot/stockfishBotAdapter', () => ({
  createStockfishBotAdapter: () => ({ getMove: vi.fn(() => new Promise(() => {})) }),
}));

import App, { ScorePop } from './App';
import { DIFFICULTY_TIERS } from './game/ladder';

const RUN_STATE_KEY = 'chesschallenge:run-state:v1';

function saveRun(overrides: Record<string, unknown>) {
  const initial = createInitialRunState();
  localStorage.setItem(RUN_STATE_KEY, JSON.stringify({ ...initial, ...overrides }));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

// The Run's behaviour is tested through useRun and runStore; these cover only
// what App itself owns — which screen renders for a given Run State, and which
// opponent that screen names.
describe('App', () => {
  it('opens on the start screen, not the board, for an untouched run', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Face the Monkey' })).toBeInTheDocument();
    // All ten are named here — the one screen where the whole ladder is visible.
    expect(screen.getByText('The Singularity')).toBeInTheDocument();
    expect(screen.queryByText('Clock')).not.toBeInTheDocument();
  });

  it('starts the run on the first rung when the start action is taken', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Face the Monkey' }));

    expect(screen.getByRole('heading', { name: 'The Monkey' })).toBeInTheDocument();
    expect(screen.getByText('Rung 1 / 10')).toBeInTheDocument();
    expect(screen.getByText('Clock')).toBeInTheDocument();
  });

  it('skips the start screen and names the right opponent for a resumed run', () => {
    saveRun({ tierIndex: 2, score: 2, bestScore: 7 });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Homo Sapiens' })).toBeInTheDocument();
    expect(screen.getByText('Rung 3 / 10')).toBeInTheDocument();
    expect(screen.getByText('600 Elo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Face the Monkey' })).not.toBeInTheDocument();
  });

  it('does not replay the score celebration when a run is resumed', () => {
    saveRun({ tierIndex: 4, score: 900, lastGamePoints: 240 });

    render(<App />);

    // The pop belongs to the moment a rung falls, never to a page load. A pop
    // here would name the rung just below (The Village Player); the plate names
    // the current one.
    expect(screen.getByRole('heading', { name: 'The Club Player' })).toBeInTheDocument();
    expect(screen.queryByText('The Village Player')).not.toBeInTheDocument();
  });

  it('shows the end screen instead of the board once the run is over', () => {
    const initial = createInitialRunState();
    saveRun({
      status: 'lost',
      score: 4,
      bestScore: 500,
      game: { ...initial.game, status: 'timeout', winner: 'b' },
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'The climb ends here.' })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Final score')).toBeInTheDocument();
    expect(screen.queryByText('Clock')).not.toBeInTheDocument();
  });

  it('marks a run that beats the stored best as a new best', () => {
    const initial = createInitialRunState();
    saveRun({
      status: 'lost',
      score: 900,
      bestScore: 200,
      game: { ...initial.game, status: 'timeout', winner: 'b' },
    });

    render(<App />);

    expect(screen.getByText('New best score')).toBeInTheDocument();
  });

  it('gives a completed ladder its own screen', () => {
    const initial = createInitialRunState();
    saveRun({
      tierIndex: 9,
      status: 'ladder-complete',
      score: 12,
      game: { ...initial.game, status: 'checkmate', winner: 'w' },
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'You beat the Singularity.' })).toBeInTheDocument();
  });

  it('returns to the first rung when a new run is started', () => {
    const initial = createInitialRunState();
    saveRun({
      status: 'lost',
      score: 4,
      game: { ...initial.game, status: 'timeout', winner: 'b' },
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Climb again' }));

    expect(screen.getByRole('heading', { name: 'The Monkey' })).toBeInTheDocument();
    expect(screen.getByText('Rung 1 / 10')).toBeInTheDocument();
  });

  it('names the beaten opponent and what the rung paid', () => {
    render(
      <ScorePop
        defeated={{ tier: DIFFICULTY_TIERS[2], gain: 340, from: 500, to: 840 }}
        leaving={false}
      />,
    );

    expect(screen.getByText('Homo Sapiens')).toBeInTheDocument();
    expect(screen.getByText('+340')).toBeInTheDocument();
    // The name and the number carry the moment; there is no label above them.
    expect(screen.queryByText('Defeated')).not.toBeInTheDocument();
  });
});

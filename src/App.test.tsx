import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialRunState } from './game/runReducer';

vi.mock('./bot/stockfishBotAdapter', () => ({
  createStockfishBotAdapter: () => ({ getMove: vi.fn(() => new Promise(() => {})) }),
}));

import App from './App';

const RUN_STATE_KEY = 'chesschallenge:run-state:v1';

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

// The Run's behaviour is tested through useRun and runStore; these cover only
// what App itself owns — what gets rendered for a given Run State.
describe('App', () => {
  it('renders the board with White to move', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'ChessChallenge' })).toBeInTheDocument();
    expect(screen.queryByText(/checkmate|stalemate|draw/i)).not.toBeInTheDocument();
  });

  it('shows the tier, score and best score of a resumed run', () => {
    const saved = { ...createInitialRunState(7), tierIndex: 2, score: 2 };
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify(saved));

    render(<App />);

    expect(screen.getByText(/Score:/).textContent).toBe('Bot: 3/10 · Score: 2 · Best: 7');
  });

  it('shows the end-of-run screen instead of the board once the run is over', () => {
    const initial = createInitialRunState();
    localStorage.setItem(
      RUN_STATE_KEY,
      JSON.stringify({
        ...initial,
        status: 'lost',
        score: 4,
        game: { ...initial.game, status: 'timeout', winner: 'b' },
      }),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Run over' })).toBeInTheDocument();
    expect(screen.getByText('Final score: 4')).toBeInTheDocument();
    expect(screen.queryByText(/Clock:/)).not.toBeInTheDocument();
  });

  it('gives a completed ladder its own screen', () => {
    const initial = createInitialRunState();
    localStorage.setItem(
      RUN_STATE_KEY,
      JSON.stringify({
        ...initial,
        tierIndex: 9,
        status: 'ladder-complete',
        score: 12,
        game: { ...initial.game, status: 'checkmate', winner: 'w' },
      }),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: '🏆 Ladder complete!' })).toBeInTheDocument();
    expect(screen.getByText('You beat the whole ladder!')).toBeInTheDocument();
  });

  it('returns to the board when a new run is started', () => {
    const initial = createInitialRunState();
    localStorage.setItem(
      RUN_STATE_KEY,
      JSON.stringify({
        ...initial,
        status: 'lost',
        score: 4,
        game: { ...initial.game, status: 'timeout', winner: 'b' },
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new run' }));

    expect(screen.getByText(/Score:/).textContent).toBe('Bot: 1/10 · Score: 0 · Best: 0');
    expect(screen.getByText(/Clock:/)).toBeInTheDocument();
  });
});

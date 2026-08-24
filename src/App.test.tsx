import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialRunState } from './game/runReducer';

vi.mock('./bot/stockfishBotAdapter', () => ({
  createStockfishBotAdapter: () => ({ getMove: vi.fn() }),
}));

import App from './App';

const RUN_STATE_KEY = 'chesschallenge:run-state:v1';
const BEST_SCORE_KEY = 'chesschallenge:best-score:v1';

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('App', () => {
  it('renders the board with White to move', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'ChessChallenge' })).toBeInTheDocument();
    expect(screen.queryByText(/checkmate|stalemate|draw/i)).not.toBeInTheDocument();
  });

  it('resumes an in-progress run from the last saved snapshot', () => {
    const saved = { ...createInitialRunState(3), tierIndex: 2, score: 2 };
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify(saved));

    render(<App />);

    expect(screen.getByText(/Score:/).textContent).toBe('Score: 2 · Best: 3');
  });

  it('uses the higher of the two persisted best scores, in case another tab raised it', () => {
    const saved = { ...createInitialRunState(3), tierIndex: 2, score: 2 };
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify(saved));
    localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(7));

    render(<App />);

    expect(screen.getByText(/Score:/).textContent).toBe('Score: 2 · Best: 7');
  });

  it('starting a new run clears the previous run snapshot', () => {
    const initial = createInitialRunState();
    const saved = {
      ...initial,
      status: 'lost' as const,
      score: 4,
      game: { ...initial.game, status: 'timeout' as const, winner: 'b' as const },
    };
    localStorage.setItem(RUN_STATE_KEY, JSON.stringify(saved));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new run' }));

    const stored = JSON.parse(localStorage.getItem(RUN_STATE_KEY)!);
    expect(stored.status).toBe('playing');
    expect(stored.score).toBe(0);
  });
});

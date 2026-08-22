import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./bot/stockfishBotAdapter', () => ({
  createStockfishBotAdapter: () => ({ getMove: vi.fn() }),
}));

import App from './App';

describe('App', () => {
  it('renders the board with White to move', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'ChessChallenge' })).toBeInTheDocument();
    expect(screen.queryByText(/checkmate|stalemate|draw/i)).not.toBeInTheDocument();
  });
});

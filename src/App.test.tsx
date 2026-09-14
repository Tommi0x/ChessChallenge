import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

    expect(screen.getByRole('button', { name: 'Start Challenge' })).toBeInTheDocument();
    expect(screen.getByLabelText('Your opponents, from 200 to 2000 Elo')).toBeInTheDocument();
    expect(screen.getByText('Best Score')).toBeInTheDocument();
    expect(screen.queryByText('Clock')).not.toBeInTheDocument();
  });

  it('starts the run on the first rung when the start action is taken', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Challenge' }));

    expect(screen.getByRole('heading', { name: 'The Monkey' })).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Clock')).toBeInTheDocument();
  });

  it('skips the start screen and names the right opponent for a resumed run', () => {
    saveRun({ tierIndex: 2, score: 2, bestScore: 7 });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Homo Sapiens' })).toBeInTheDocument();
    expect(screen.getByText('Round 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Challenge' })).not.toBeInTheDocument();
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

    // The card carries no verdict prose; the outcome is left to assistive tech.
    expect(screen.getByText('Run over.')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.queryByText('Clock')).not.toBeInTheDocument();
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

    expect(screen.getByText('Ladder complete.')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('returns to the start screen when a new run is started', () => {
    const initial = createInitialRunState();
    saveRun({
      status: 'lost',
      score: 4,
      game: { ...initial.game, status: 'timeout', winner: 'b' },
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Climb again' }));

    expect(screen.getByRole('heading', { name: 'ChessChallenge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Challenge' })).toBeInTheDocument();
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

// react-chessboard tags every square with data-square and every piece with
// data-piece, and applies our squareStyles as an inline style on a div inside
// the square — that's the seam these tests drive through.
describe('board click-to-move', () => {
  beforeEach(() => {
    // jsdom lays out every element at 0×0. react-chessboard's move-animation
    // effect measures the source square and throws when that comes back
    // zero-width, so give every element a plausible size.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 60,
      height: 60,
      top: 0,
      left: 0,
      right: 60,
      bottom: 60,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function square(container: HTMLElement, id: string) {
    const el = container.querySelector(`[data-square="${id}"]`);
    if (!el) throw new Error(`no square rendered for ${id}`);
    return el as HTMLElement;
  }

  function hasHighlight(container: HTMLElement, id: string) {
    return square(container, id).querySelector('[style*="gradient"], [style*="color-mix"]') !== null;
  }

  it('selects a piece on click and shows its legal destinations', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Challenge' }));

    fireEvent.click(square(container, 'e2'));

    expect(hasHighlight(container, 'e2')).toBe(true);
    expect(hasHighlight(container, 'e3')).toBe(true);
    expect(hasHighlight(container, 'e4')).toBe(true);
    // Only reachable squares light up.
    expect(hasHighlight(container, 'e5')).toBe(false);
  });

  it('moves the piece when a highlighted destination is clicked', async () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Challenge' }));

    fireEvent.click(square(container, 'e2'));
    fireEvent.click(square(container, 'e4'));

    // The board holds the move behind its own animationDurationInMs before
    // the piece actually reparents to its new square.
    await waitFor(() => {
      expect(square(container, 'e4').querySelector('[data-piece="wP"]')).not.toBeNull();
    });
    expect(square(container, 'e2').querySelector('[data-piece]')).toBeNull();
    // The selection (and its highlights) clears once the move lands.
    expect(hasHighlight(container, 'e4')).toBe(false);
  });

  it('deselects on a second click of the same piece', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Challenge' }));

    fireEvent.click(square(container, 'e2'));
    fireEvent.click(square(container, 'e2'));

    expect(hasHighlight(container, 'e2')).toBe(false);
    expect(hasHighlight(container, 'e4')).toBe(false);
    expect(square(container, 'e2').querySelector('[data-piece="wP"]')).not.toBeNull();
  });

  it('switches selection to another own piece without needing a deselect first', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Challenge' }));

    fireEvent.click(square(container, 'e2'));
    fireEvent.click(square(container, 'd2'));

    expect(hasHighlight(container, 'e2')).toBe(false);
    expect(hasHighlight(container, 'd2')).toBe(true);
    expect(hasHighlight(container, 'd4')).toBe(true);
  });

  it('marks a capturable square differently from a quiet destination', () => {
    // After 1.e4 d5, White's e-pawn can push to e5 or capture on d5.
    const initial = createInitialRunState();
    saveRun({
      game: {
        ...initial.game,
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
        turn: 'w',
      },
    });
    const { container } = render(<App />);

    fireEvent.click(square(container, 'e4'));

    const captureStyle = square(container, 'd5').querySelector('[style*="gradient"]')?.getAttribute('style');
    const pushStyle = square(container, 'e5').querySelector('[style*="gradient"]')?.getAttribute('style');
    expect(captureStyle).toBeTruthy();
    expect(pushStyle).toBeTruthy();
    expect(captureStyle).not.toBe(pushStyle);
  });
});

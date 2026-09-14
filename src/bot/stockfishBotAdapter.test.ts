import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStockfishBotAdapter } from './stockfishBotAdapter';
import type { DifficultyTier } from '../game/ladder';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
// Identity plays no part in how the Bot moves; it rides along because a rung is
// one thing. These fixtures carry it only to satisfy the type.
// Above the UCI_Elo floor: engine-calibrated, never blunders.
const STRONG_TIER: DifficultyTier = {
  kind: 'calibrated', elo: 1600, name: 'The AI', era: 'network',
};
// Below the floor: node-starved with a blunder rate.
const WEAK_TIER: DifficultyTier = {
  kind: 'starved', elo: 200, nodes: 1, blunderChance: 0.5,
  name: 'The Monkey', era: 'jungle',
};

class FakeWorker {
  listeners: Record<string, ((event: any) => void)[]> = { message: [], error: [] };
  posted: string[] = [];
  terminate = vi.fn();

  addEventListener(type: string, listener: (event: any) => void) {
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
  }

  postMessage(data: string) {
    this.posted.push(data);
  }

  emitMessage(data: string) {
    for (const listener of [...this.listeners.message]) listener({ data });
  }

  emitError(message: string) {
    for (const listener of [...this.listeners.error]) listener({ message, error: new Error(message) });
  }
}

describe('createStockfishBotAdapter', () => {
  let fakeWorker: FakeWorker;

  beforeEach(() => {
    fakeWorker = new FakeWorker();
    vi.stubGlobal(
      'Worker',
      function Worker() {
        fakeWorker = new FakeWorker();
        return fakeWorker;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function initialized() {
    const adapter = createStockfishBotAdapter();
    return adapter;
  }

  it('resolves with the move parsed from the engine bestmove line', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    fakeWorker.emitMessage('uciok');
    await Promise.resolve();
    fakeWorker.emitMessage('bestmove e2e4 ponder e7e5');

    await expect(movePromise).resolves.toEqual({ from: 'e2', to: 'e4', promotion: undefined });
  });

  it('parses the promotion piece off a promoting bestmove', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    fakeWorker.emitMessage('uciok');
    await Promise.resolve();
    fakeWorker.emitMessage('bestmove e7e8q');

    // Dropping the 5th character makes the bot's promotion illegal downstream,
    // which silently freezes it for the rest of the game.
    await expect(movePromise).resolves.toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });

  it('rejects if the worker errors', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    fakeWorker.emitMessage('uciok');
    await Promise.resolve();
    fakeWorker.emitError('boom');

    await expect(movePromise).rejects.toThrow('boom');
  });

  it('rejects superseded requests and terminates their worker before starting another', async () => {
    const adapter = await initialized();
    const first = adapter.getMove(START_FEN, STRONG_TIER);
    const rejected = expect(first).rejects.toThrow('cancelled');
    const oldWorker = fakeWorker;
    const second = adapter.getMove(AFTER_E4_FEN, STRONG_TIER);
    expect(oldWorker.terminate).toHaveBeenCalledOnce();
    oldWorker.emitMessage('bestmove d2d4');
    fakeWorker.emitMessage('uciok');
    fakeWorker.emitMessage('bestmove e7e5');
    await rejected;
    await expect(second).resolves.toEqual({ from: 'e7', to: 'e5', promotion: undefined });
  });

  it('does not create a worker during construction', () => {
    const factory = vi.fn();
    vi.stubGlobal('Worker', factory);
    createStockfishBotAdapter();
    expect(factory).not.toHaveBeenCalled();
  });

  it('times out during initialization', async () => {
    vi.useFakeTimers();
    const adapter = createStockfishBotAdapter();
    const assertion = expect(adapter.getMove(START_FEN, STRONG_TIER)).rejects.toThrow('did not start');
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    expect(fakeWorker.terminate).toHaveBeenCalledOnce();
  });

  it('rejects a worker failure before initialization', async () => {
    const adapter = createStockfishBotAdapter();
    const assertion = expect(adapter.getMove(START_FEN, STRONG_TIER)).rejects.toThrow('loading failed');
    fakeWorker.emitError('loading failed');
    await assertion;
  });

  it('aborts pending work and can retry after disposal', async () => {
    const adapter = createStockfishBotAdapter();
    const controller = new AbortController();
    const assertion = expect(adapter.getMove(START_FEN, STRONG_TIER, controller.signal)).rejects.toThrow('cancelled');
    controller.abort();
    await assertion;
    adapter.dispose?.();
    const retry = adapter.getMove(START_FEN, STRONG_TIER);
    fakeWorker.emitMessage('uciok');
    fakeWorker.emitMessage('bestmove e2e4');
    await expect(retry).resolves.toMatchObject({ from: 'e2', to: 'e4' });
  });

  it('rejects an empty engine move', async () => {
    const adapter = createStockfishBotAdapter();
    const assertion = expect(adapter.getMove(START_FEN, STRONG_TIER)).rejects.toThrow('invalid move');
    fakeWorker.emitMessage('uciok');
    fakeWorker.emitMessage('bestmove (none)');
    await assertion;
  });

  it('rejects if the engine never responds, after five seconds and not before', async () => {
    vi.useFakeTimers();
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    const assertion = expect(movePromise).rejects.toThrow('did not respond in time');
    fakeWorker.emitMessage('uciok');

    await vi.advanceTimersByTimeAsync(4999);
    expect(await Promise.race([movePromise.catch(() => 'rejected'), Promise.resolve('pending')])).toBe('pending');

    await vi.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it('hands strength limiting to the engine for tiers above the UCI_Elo floor', async () => {
    const adapter = await initialized();

    const pending = adapter.getMove(START_FEN, STRONG_TIER);
    fakeWorker.emitMessage('uciok');
    await Promise.resolve();

    expect(fakeWorker.posted).toContain('setoption name UCI_LimitStrength value true');
    expect(fakeWorker.posted).toContain('setoption name UCI_Elo value 1600');
    expect(fakeWorker.posted).toContain('go movetime 500');
    fakeWorker.emitMessage('bestmove e2e4');
    await pending;
  });

  it('starves the search instead for tiers below the floor', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // above blunderChance: no blunder
    const adapter = await initialized();

    const pending = adapter.getMove(START_FEN, WEAK_TIER);
    fakeWorker.emitMessage('uciok');
    await Promise.resolve();

    expect(fakeWorker.posted).toContain('setoption name UCI_LimitStrength value false');
    expect(fakeWorker.posted).toContain('go nodes 1');
    expect(fakeWorker.posted.some((m) => m.startsWith('setoption name UCI_Elo'))).toBe(false);
    fakeWorker.emitMessage('bestmove e2e4');
    await pending;
  });

  it('plays a random legal move when the blunder roll succeeds, without asking the engine', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // below blunderChance: blunder, and pick move 0
    const adapter = await initialized();

    const move = await adapter.getMove(START_FEN, WEAK_TIER);

    expect(move.from).toMatch(/^[a-h][1-8]$/);
    expect(fakeWorker.posted.some((m) => m.startsWith('go'))).toBe(false);
  });
});

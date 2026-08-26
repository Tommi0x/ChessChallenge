import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStockfishBotAdapter } from './stockfishBotAdapter';
import type { DifficultyTier } from './botAdapter';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
// Above the UCI_Elo floor: engine-calibrated, never blunders.
const STRONG_TIER: DifficultyTier = { elo: 1600 };
// Below the floor: node-starved with a blunder rate.
const WEAK_TIER: DifficultyTier = { elo: 200, nodes: 1, blunderChance: 0.5 };

class FakeWorker {
  listeners: Record<string, ((event: any) => void)[]> = { message: [], error: [] };
  posted: string[] = [];

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
        return fakeWorker;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function initialized() {
    const adapter = createStockfishBotAdapter();
    fakeWorker.emitMessage('uciok');
    return adapter;
  }

  it('resolves with the move parsed from the engine bestmove line', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    await Promise.resolve();
    fakeWorker.emitMessage('bestmove e2e4 ponder e7e5');

    await expect(movePromise).resolves.toEqual({ from: 'e2', to: 'e4', promotion: undefined });
  });

  it('parses the promotion piece off a promoting bestmove', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    await Promise.resolve();
    fakeWorker.emitMessage('bestmove e7e8q');

    // Dropping the 5th character makes the bot's promotion illegal downstream,
    // which silently freezes it for the rest of the game.
    await expect(movePromise).resolves.toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });

  it('rejects if the worker errors', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    await Promise.resolve();
    fakeWorker.emitError('boom');

    await expect(movePromise).rejects.toThrow('boom');
  });

  it('ignores a bestmove reply meant for a superseded request', async () => {
    const adapter = await initialized();

    const first = adapter.getMove(START_FEN, STRONG_TIER);
    const second = adapter.getMove(AFTER_E4_FEN, STRONG_TIER);
    await Promise.resolve();

    // Only one bestmove ever arrives, and it belongs to the latest request.
    fakeWorker.emitMessage('bestmove d2d4');

    await expect(second).resolves.toEqual({ from: 'd2', to: 'd4', promotion: undefined });
    // The superseded request's promise never settles; it must not resolve to the wrong move.
    const result = await Promise.race([first, Promise.resolve('pending')]);
    expect(result).toBe('pending');
  });

  it('rejects if the engine never responds, after five seconds and not before', async () => {
    vi.useFakeTimers();
    const adapter = await initialized();

    const movePromise = adapter.getMove(START_FEN, STRONG_TIER);
    const assertion = expect(movePromise).rejects.toThrow('did not respond in time');

    await vi.advanceTimersByTimeAsync(4999);
    expect(await Promise.race([movePromise.catch(() => 'rejected'), Promise.resolve('pending')])).toBe('pending');

    await vi.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it('hands strength limiting to the engine for tiers above the UCI_Elo floor', async () => {
    const adapter = await initialized();

    void adapter.getMove(START_FEN, STRONG_TIER);
    await Promise.resolve();

    expect(fakeWorker.posted).toContain('setoption name UCI_LimitStrength value true');
    expect(fakeWorker.posted).toContain('setoption name UCI_Elo value 1600');
    expect(fakeWorker.posted).toContain('go movetime 500');
  });

  it('starves the search instead for tiers below the floor', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // above blunderChance: no blunder
    const adapter = await initialized();

    void adapter.getMove(START_FEN, WEAK_TIER);
    await Promise.resolve();

    expect(fakeWorker.posted).toContain('setoption name UCI_LimitStrength value false');
    expect(fakeWorker.posted).toContain('go nodes 1');
    expect(fakeWorker.posted.some((m) => m.startsWith('setoption name UCI_Elo'))).toBe(false);
  });

  it('plays a random legal move when the blunder roll succeeds, without asking the engine', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // below blunderChance: blunder, and pick move 0
    const adapter = await initialized();

    const move = await adapter.getMove(START_FEN, WEAK_TIER);

    expect(move.from).toMatch(/^[a-h][1-8]$/);
    expect(fakeWorker.posted.some((m) => m.startsWith('go'))).toBe(false);
  });
});

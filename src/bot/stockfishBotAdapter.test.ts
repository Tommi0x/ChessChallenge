import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStockfishBotAdapter } from './stockfishBotAdapter';

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

    const movePromise = adapter.getMove('startpos', 5);
    await Promise.resolve();
    fakeWorker.emitMessage('bestmove e2e4 ponder e7e5');

    await expect(movePromise).resolves.toEqual({ from: 'e2', to: 'e4', promotion: undefined });
  });

  it('rejects if the worker errors', async () => {
    const adapter = await initialized();

    const movePromise = adapter.getMove('startpos', 5);
    await Promise.resolve();
    fakeWorker.emitError('boom');

    await expect(movePromise).rejects.toThrow('boom');
  });

  it('ignores a bestmove reply meant for a superseded request', async () => {
    const adapter = await initialized();

    const first = adapter.getMove('fen-one', 5);
    const second = adapter.getMove('fen-two', 5);
    await Promise.resolve();

    // Only one bestmove ever arrives, and it belongs to the latest request.
    fakeWorker.emitMessage('bestmove d2d4');

    await expect(second).resolves.toEqual({ from: 'd2', to: 'd4', promotion: undefined });
    // The superseded request's promise never settles; it must not resolve to the wrong move.
    const result = await Promise.race([first, Promise.resolve('pending')]);
    expect(result).toBe('pending');
  });

  it('rejects if the engine never responds', async () => {
    vi.useFakeTimers();
    const adapter = await initialized();

    const movePromise = adapter.getMove('startpos', 5);
    const assertion = expect(movePromise).rejects.toThrow('did not respond in time');
    await vi.runAllTimersAsync();
    await assertion;
  });
});

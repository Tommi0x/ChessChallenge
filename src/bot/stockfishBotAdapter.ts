import { Chess } from 'chess.js';
import type { BotAdapter, BotMove } from './botAdapter';

const MOVE_TIME_MS = 500;
const RESPONSE_TIMEOUT_MS = 5000;

function randomLegalMove(fen: string): BotMove | null {
  const moves = new Chess(fen).moves({ verbose: true });
  if (moves.length === 0) return null;
  const move = moves[Math.floor(Math.random() * moves.length)];
  return { from: move.from, to: move.to, promotion: move.promotion };
}

function parseUciMove(uci: string): BotMove {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
  };
}

/** The factory is pure: the worker is started only when the first move is requested.
 * Cancelling a search terminates its worker because UCI replies carry no request ID. */
export function createStockfishBotAdapter(): BotAdapter {
  let worker: Worker | null = null;
  let ready = false;
  let cancelPending: (() => void) | null = null;

  function reset() {
    worker?.terminate();
    worker = null;
    ready = false;
  }

  return {
    dispose() {
      cancelPending?.();
      reset();
    },
    getMove(fen, tier, signal) {
      cancelPending?.();
      if (signal?.aborted) return Promise.reject(new Error('Stockfish request cancelled'));

      if (tier.kind === 'starved' && Math.random() < tier.blunderChance) {
        const blunder = randomLegalMove(fen);
        if (blunder) return Promise.resolve(blunder);
      }

      return new Promise((resolve, reject) => {
        let active: Worker;
        try {
          worker ??= new Worker(`${import.meta.env.BASE_URL}stockfish/stockfish.js`);
          active = worker;
        } catch (error) {
          reject(error);
          return;
        }
        let timeout: ReturnType<typeof setTimeout>;
        function cleanup() {
          clearTimeout(timeout);
          active.removeEventListener('message', onMessage);
          active.removeEventListener('error', onError);
          signal?.removeEventListener('abort', cancel);
          cancelPending = null;
        }
        function fail(error: Error) {
          cleanup();
          reset();
          reject(error);
        }
        function cancel() { fail(new Error('Stockfish request cancelled')); }
        function search() {
          clearTimeout(timeout);
          timeout = setTimeout(() => fail(new Error('Stockfish did not respond in time')), RESPONSE_TIMEOUT_MS);
          active.postMessage('setoption name Skill Level value 20');
          active.postMessage(`setoption name UCI_LimitStrength value ${tier.kind === 'calibrated'}`);
          if (tier.kind === 'calibrated') active.postMessage(`setoption name UCI_Elo value ${tier.elo}`);
          active.postMessage(`position fen ${fen}`);
          active.postMessage(tier.kind === 'calibrated' ? `go movetime ${MOVE_TIME_MS}` : `go nodes ${tier.nodes}`);
        }
        function onMessage(event: MessageEvent<string>) {
          if (event.data === 'uciok' && !ready) {
            ready = true;
            search();
          } else if (ready && typeof event.data === 'string' && event.data.startsWith('bestmove')) {
            const uci = event.data.split(' ')[1];
            if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) {
              fail(new Error('Stockfish returned an invalid move'));
              return;
            }
            cleanup();
            resolve(parseUciMove(uci));
          }
        }
        function onError(event: ErrorEvent) {
          fail(new Error(event.message || 'Stockfish failed to start'));
        }
        cancelPending = cancel;
        active.addEventListener('message', onMessage);
        active.addEventListener('error', onError);
        signal?.addEventListener('abort', cancel);
        if (ready) search();
        else {
          timeout = setTimeout(() => fail(new Error('Stockfish did not start in time')), 15_000);
          active.postMessage('uci');
        }
      });
    },
  };
}

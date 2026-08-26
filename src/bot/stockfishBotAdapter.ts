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

export function createStockfishBotAdapter(): BotAdapter {
  const worker = new Worker(`${import.meta.env.BASE_URL}stockfish/stockfish.js`);
  let requestId = 0;

  const ready = new Promise<void>((resolve) => {
    function onMessage(event: MessageEvent<string>) {
      if (event.data === 'uciok') {
        worker.removeEventListener('message', onMessage);
        resolve();
      }
    }
    worker.addEventListener('message', onMessage);
    worker.postMessage('uci');
  });

  return {
    async getMove(fen, tier) {
      await ready;

      // Below the engine's UCI_Elo floor, a starved search still snaps up hanging
      // pieces; the random move is what makes the low rungs feel like a beginner.
      if (tier.kind === 'starved' && Math.random() < tier.blunderChance) {
        const blunder = randomLegalMove(fen);
        if (blunder) return blunder;
      }

      const id = ++requestId;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Stockfish did not respond in time'));
        }, RESPONSE_TIMEOUT_MS);

        function cleanup() {
          clearTimeout(timeout);
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
        }

        function onMessage(event: MessageEvent<string>) {
          // A newer getMove() call superseded this one; let it own the response.
          if (id !== requestId) {
            cleanup();
            return;
          }
          if (typeof event.data === 'string' && event.data.startsWith('bestmove')) {
            cleanup();
            resolve(parseUciMove(event.data.split(' ')[1]));
          }
        }

        function onError(event: ErrorEvent) {
          cleanup();
          reject(event.error ?? new Error(event.message));
        }

        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);

        // Skill Level stays at full; UCI_LimitStrength is what governs when it's on.
        worker.postMessage('setoption name Skill Level value 20');
        worker.postMessage(`setoption name UCI_LimitStrength value ${tier.kind === 'calibrated'}`);
        if (tier.kind === 'calibrated') worker.postMessage(`setoption name UCI_Elo value ${tier.elo}`);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(tier.kind === 'calibrated' ? `go movetime ${MOVE_TIME_MS}` : `go nodes ${tier.nodes}`);
      });
    },
  };
}

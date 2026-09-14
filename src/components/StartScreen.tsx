import { DIFFICULTY_TIERS } from '../game/ladder';
import { OpponentPortrait } from './OpponentPortrait';

const START_BOARD_PIECES = ['♜', '♞', '♝', '♛', '♚', '♟'];

export function StartScreen({ bestScore, onStart }: { bestScore: number; onStart(): void }) {
  return (
    <main className="app app-start" data-era="start">
      <div className="start-backdrop" aria-hidden="true">
        {Array.from({ length: 64 }, (_, index) => (
          <span
            key={index}
            className={(Math.floor(index / 8) + (index % 8)) % 2 === 0 ? 'is-dark' : ''}
          >
            {START_BOARD_PIECES[index % START_BOARD_PIECES.length]}
          </span>
        ))}
      </div>
      <div className="start">
        <h1 className="start-title">
          Chess<span>Challenge</span>
        </h1>

        <div className="start-bots" aria-label="Your opponents, from 200 to 2000 Elo">
          {DIFFICULTY_TIERS.map((tier) => (
            <div className="start-bot" key={tier.name} title={`${tier.name}, ${tier.elo} Elo`}>
              <OpponentPortrait era={tier.era} />
              <span className="sr-only">{tier.name}, {tier.elo} Elo</span>
            </div>
          ))}
        </div>

        <p className="stat start-best">
          <span className="stat-label">Best Score</span>
          <span className="stat-value">{bestScore.toLocaleString()}</span>
        </p>

        <div className="start-action">
          <button type="button" className="btn start-button" onClick={onStart}>
            Start Challenge
          </button>
          <p>Win to climb. A loss or draw ends your Run.</p>
        </div>
      </div>
    </main>
  );
}

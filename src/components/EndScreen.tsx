import { useEffect, useRef, useState } from 'react';
import { DIFFICULTY_TIERS } from '../game/ladder';
import type { RunState, RunStatus } from '../game/runReducer';
import { createLocalStoragePersistenceAdapter } from '../persistence/persistenceAdapter';
import { OpponentPortrait } from './OpponentPortrait';

/** The name on the score card. Outlives the Run it was typed on, so a player who
 *  climbs again is not asked who they are a second time. */
const nameStore = createLocalStoragePersistenceAdapter(
  'chesschallenge:player-name:v1',
  (value): value is string => typeof value === 'string',
);

/** The card is a scoreboard, so the outcome is carried for screen readers only —
 *  sighted players read it off the icon grid. */
const END_LABEL: Record<Exclude<RunStatus, 'playing'>, string> = {
  lost: 'Run over.',
  drawn: 'Run over — drawn.',
  'ladder-complete': 'Ladder complete.',
};

export function EndScreen({ run, onNewRun }: { run: RunState & { status: Exclude<RunStatus, 'playing'> }; onNewRun(): void }) {
  const [playerName, setPlayerName] = useState(() => nameStore.load() ?? '');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  /** Rasterises the score card so it can be pasted straight into a chat. The
   *  card is translucent over the era's ground, so the ground is painted in
   *  behind it — a PNG with a see-through middle reads as broken everywhere it
   *  lands. */
  async function copyCard() {
    const card = cardRef.current;
    if (!card) return;
    const png = import('html-to-image').then(async (m) => {
      const blob = await m.toBlob(card, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(card).getPropertyValue('--field').trim() || '#0a1410',
      });
      if (!blob) throw new Error('could not render the card');
      return blob;
    });

    try {
      // The Promise form rather than an awaited Blob: Safari discards a
      // clipboard write whose user gesture has already ended, and rendering
      // takes longer than the gesture does.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // No image clipboard (Firefox until recently), or permission refused —
      // hand over the file instead so the card is still shareable.
      const blob = await png.catch(() => null);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'chesschallenge.png' }).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  const fell = DIFFICULTY_TIERS[run.tierIndex];
  // Ladder-complete never advances tierIndex past the last rung, but that
  // last rung was beaten to get there; every other end status stops on the
  // rung that beat the player, so only the rungs before it were beaten.
  const beatenCount = run.status === 'ladder-complete' ? DIFFICULTY_TIERS.length : run.tierIndex;
  return (
    <main className="app" data-era={run.status === 'ladder-complete' ? 'blank' : fell.era}>
      <div className="end" role="alert" ref={cardRef}>
        <p className="sr-only">{END_LABEL[run.status]}</p>
        <p className="end-wordmark">ChessChallenge</p>
        <input
          className="end-name"
          type="text"
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            nameStore.save(e.target.value);
          }}
          placeholder="Your name"
          aria-label="Your name"
          maxLength={18}
          autoComplete="name"
          spellCheck={false}
        />
        <div className="end-bots" aria-hidden="true">
          {DIFFICULTY_TIERS.map((t, i) => (
            <div
              key={t.name}
              className={`end-bot${i < beatenCount ? ' is-beaten' : i === beatenCount ? ' is-lost-to' : ''}`}
            >
              <OpponentPortrait era={t.era} />
            </div>
          ))}
        </div>
        <p className="end-score">
          <span className="end-score-value">{run.score.toLocaleString()}</span>
          <span className="end-score-label">Score</span>
        </p>
      </div>
      <div className="end-actions">
        <button type="button" className="btn" onClick={onNewRun}>
          Climb again
        </button>
        <button type="button" className="btn btn-quiet" onClick={copyCard} aria-live="polite">
          {copied ? 'Copied' : 'Copy card'}
        </button>
      </div>
    </main>
  );
}

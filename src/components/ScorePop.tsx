import { useEffect, useState } from 'react';
import type { DifficultyTier } from '../game/ladder';

const COUNT_UP_MS = 900;

/** Counts from a start value to an end value once, then holds. */
function useCountUp(from: number, to: number): number {
  const [value, setValue] = useState(to);

  useEffect(() => {
    // State already holds `to`, so with no rAF (jsdom, or a very old client) the
    // final number is simply shown without animating to it.
    if (typeof requestAnimationFrame !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / COUNT_UP_MS);
      // Ease out: the number sprints, then settles onto its final digits.
      setValue(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [from, to]);

  return value;
}
export type Defeated = { tier: DifficultyTier; gain: number; from: number; to: number };

export function ScorePop({ defeated, leaving }: { defeated: Defeated; leaving: boolean }) {
  const shown = useCountUp(defeated.from, defeated.to);
  return (
    <div className={`score-pop${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <p className="score-pop-name">{defeated.tier.name}</p>
      <p className="score-pop-total">{shown.toLocaleString()}</p>
      <p className="score-pop-gain">+{defeated.gain.toLocaleString()}</p>
    </div>
  );
}

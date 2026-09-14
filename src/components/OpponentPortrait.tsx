import type { Era } from '../game/ladder';

/**
 * The ten opponents, drawn as one system: a 64x64 box, a 2px stroke in
 * `currentColor`, round caps and joins. Each rung is the artifact that era would
 * leave behind rather than a portrait of its face, so the climb reads as one hand
 * drawing ten stages of the same escalation.
 *
 * Adding a rung means adding its `Era` here and an `[data-era]` block in
 * index.css.
 */

const PORTRAITS: Record<Era, React.ReactNode> = {
  // A banana: the one thing this era has ever deliberately picked up.
  jungle: (
    <path d="M50.7 20.5v-4.4a2.2 2.2 0 0 0 -2.2 -2.2h-4.4a2.2 2.2 0 0 0 -2.2 2.2v4.4a20 20 0 0 1 -8.8 17.8c-4.4 2.9 -11 3.5 -15.4 3.5a4.4 4.4 0 0 0 -4.4 4.4a4.4 4.4 0 0 0 2.6 4c5.9 2.6 20.8 7.6 31.6 -3.7c9.9 -10.4 3.3 -26 3.3 -26" />
  ),
  // Meat on the bone: the one thing worth taking, cooked over someone else's fire.
  // The only rung drawn on a 24-unit grid, so it is scaled up to fill the 64 box.
  // Its stroke is pre-divided by that scale to land back on the shared 2 — never
  // non-scaling-stroke, which pins the stroke to screen pixels and makes this the
  // one icon that ignores how big it is being drawn.
  cave: (
    <g transform="translate(6.6,5.3) scale(2.15)" strokeWidth={2 / 2.15}>
      <path d="M13.62 8.382l1.966 -1.967a2 2 0 1 1 3.414 -1.415a2 2 0 1 1 -1.413 3.414l-1.82 1.821" />
      <path d="M5.904 18.596c2.733 2.734 5.9 4 7.07 2.829c1.172 -1.172 -.094 -4.338 -2.828 -7.071c-2.733 -2.734 -5.9 -4 -7.07 -2.829c-1.172 1.172 .094 4.338 2.828 7.071" />
      <path d="M7.5 16l1 1" />
      <path d="M12.975 21.425c3.905 -3.906 4.855 -9.288 2.121 -12.021c-2.733 -2.734 -8.115 -1.784 -12.02 2.121" />
    </g>
  ),
  // Fire: the first thing kept alive on purpose, and the first plan longer than a day.
  dawn: (
    <>
      <path d="M32 7c9 11 14 18 14 27 0 10-6 18-14 18s-14-8-14-18c0-9 5-16 14-27z" />
      <path d="M32 30c4 5 6 8 6 12 0 4-3 7-6 7s-6-3-6-7c0-4 2-7 6-12z" />
    </>
  ),
  // A tankard. The game is now something you do on a Thursday, for fun.
  tavern: (
    <>
      <path d="M18 22h22v30a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z" />
      <path d="M40 28h5a6 6 0 0 1 0 12h-5" />
      <path d="M18 31h22" />
    </>
  ),
  // An open book: the first opponent who has read about this rather than guessed.
  club: (
    <>
      <path d="M32 22c-5-4-11-5-18-5v30c7 0 13 1 18 5 5-4 11-5 18-5V17c-7 0-13 1-18 5z" />
      <path d="M32 22v30" />
    </>
  ),
  // A crown. The peak of the species, and the last rung a human holds.
  hall: (
    <>
      <path d="M14 44V21l9 8 9-14 9 14 9-8v23z" />
      <path d="M14 51h36" />
    </>
  ),
  // A screen where a face was. Nothing behind it is pretending to be alive.
  machine: (
    <>
      <rect x="13" y="16" width="38" height="29" rx="3" />
      <rect x="19" y="22" width="26" height="17" rx="1" />
      <path d="M25 30h6M35 30h4M25 35h14" />
      <path d="M32 45v6M23 51h18" />
    </>
  ),
  // The head is still there, but what fills it is a graph, not a face.
  network: (
    <>
      <path d="M18 32c0-9 6-15 14-15s14 6 14 15v7c0 9-6 14-14 15s-14-6-14-15z" />
      <circle cx="26" cy="28" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="39" cy="31" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="24" cy="40" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="37" cy="44" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="33" cy="35" r="2.4" fill="currentColor" stroke="none" />
      <path d="M26 28l7 7M39 31l-6 4M24 40l9-5M37 44l-4-9M26 28l-2 12" />
    </>
  ),
  // Cranium first, everything else vestigial. The eyes are the whole face.
  void: (
    <>
      <path d="M32 13c11 0 18 8 18 18 0 12-9 22-18 22s-18-10-18-22c0-10 7-18 18-18z" />
      <path d="M22 31c3-3 7-2 8 2 1 4-2 7-5 6-3-1-5-5-3-8z" />
      <path d="M42 31c-3-3-7-2-8 2-1 4 2 7 5 6 3-1 5-5 3-8z" />
      <path d="M29 45h6" />
    </>
  ),
  // No face left to draw. A horizon, and the fact that you are outside it.
  blank: (
    <>
      <circle cx="32" cy="32" r="19" />
      <circle cx="32" cy="32" r="8" fill="currentColor" stroke="none" />
      <path d="M32 5v6M32 53v6M5 32h6M53 32h6" />
    </>
  ),
};

export function OpponentPortrait({ era }: { era: Era }) {
  return (
    <svg
      className="portrait"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PORTRAITS[era]}
    </svg>
  );
}

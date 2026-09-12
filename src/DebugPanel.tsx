import { DIFFICULTY_TIERS } from './game/ladder';

/**
 * Dev-only controls for jumping straight to any screen without playing to it
 * — every button just sets the query string useRun.ts and App.tsx already
 * read (see their `?tier=`/`?status=`/`?scorepop=` comments) and reloads.
 *
 * Stripped from production by `import.meta.env.DEV` in App.tsx, which Vite
 * replaces with a literal `false` and dead-code-eliminates from the build. To
 * remove it for good instead, delete this file and its import in App.tsx.
 */
function go(params: Record<string, string>) {
  location.search = new URLSearchParams(params).toString();
}

export function DebugPanel() {
  return (
    <div className="debug-panel">
      <p className="debug-title">Debug</p>

      <p className="debug-label">Jump to tier</p>
      <div className="debug-row">
        {DIFFICULTY_TIERS.map((t, i) => (
          <button key={t.name} type="button" title={t.name} onClick={() => go({ tier: String(i) })}>
            {i + 1}
          </button>
        ))}
      </div>

      <p className="debug-label">End screen</p>
      <div className="debug-row">
        <button type="button" onClick={() => go({ status: 'lost' })}>Lost</button>
        <button type="button" onClick={() => go({ status: 'drawn' })}>Drawn</button>
        <button type="button" onClick={() => go({ status: 'ladder-complete' })}>Complete</button>
      </div>

      <p className="debug-label">Score pop (beat tier)</p>
      <div className="debug-row">
        {DIFFICULTY_TIERS.map((t, i) => (
          <button key={t.name} type="button" title={t.name} onClick={() => go({ tier: String(i), scorepop: String(i) })}>
            {i + 1}
          </button>
        ))}
      </div>

      <button type="button" className="debug-reset" onClick={() => go({})}>
        Reset (real Run)
      </button>
    </div>
  );
}

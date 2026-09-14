---
name: ChessChallenge
description: A one-life climb up ten minds, where the board never changes and the world around it does.
colors:
  jungle-field: "#2b2008"
  jungle-ink: "#f5ecd6"
  jungle-ink-dim: "#b7a67e"
  jungle-accent: "#e0a83e"
  jungle-accent-ink: "#1c1406"
  cave-field: "#241408"
  cave-ink: "#f2e6d6"
  cave-ink-dim: "#b39d84"
  cave-accent: "#d2542a"
  cave-accent-ink: "#16110c"
  dawn-field: "#2b1a0c"
  dawn-ink: "#f7ead8"
  dawn-ink-dim: "#bda486"
  dawn-accent: "#e8a33d"
  dawn-accent-ink: "#1d150e"
  tavern-field: "#251708"
  tavern-ink: "#f0e2cf"
  tavern-ink-dim: "#b39b7d"
  tavern-accent: "#c98b3a"
  tavern-accent-ink: "#1a120c"
  club-field: "#12301f"
  club-ink: "#e6f0e6"
  club-ink-dim: "#93ab99"
  club-accent: "#c2a15a"
  club-accent-ink: "#0d1a12"
  hall-field: "#181d28"
  hall-ink: "#eef1f6"
  hall-ink-dim: "#99a1b0"
  hall-accent: "#ef6b64"
  hall-accent-ink: "#12151b"
  machine-field: "#0c180c"
  machine-ink: "#d9f2d5"
  machine-ink-dim: "#7fa87c"
  machine-accent: "#4ade5a"
  machine-accent-ink: "#0b0e0b"
  network-field: "#0a1728"
  network-ink: "#e2ecfa"
  network-ink-dim: "#8098b8"
  network-accent: "#35d6e8"
  network-accent-ink: "#070d18"
  void-field: "#120824"
  void-ink: "#ede4f7"
  void-ink-dim: "#a48fbd"
  void-accent: "#d94fd0"
  void-accent-ink: "#0e0716"
  blank-field: "#f4f4f2"
  blank-ink: "#0d0d0d"
  blank-ink-dim: "#6b6b68"
  blank-accent: "#0d0d0d"
  blank-accent-ink: "#f4f4f2"
  start-field: "#3a3d42"
  start-ink: "#eef0f2"
  start-ink-dim: "#b8bdc4"
  start-accent: "#b9c8de"
  start-accent-ink: "#14161a"
  board-light-square: "#f0d9b5"
  board-dark-square: "#b58863"
typography:
  display-hero:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, min(16vw, 13vh), 5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  display-hero-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "5.5rem"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  display-score:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 18vw, 6.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.055em"
  display-score-pop:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 17vw, 6rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 10vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 4.5vw, 1.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  stat:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 800
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  stat-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  body-lead:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.14em"
  label-wordmark:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.22em"
  caption:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
spacing:
  "3xs": "0.3rem"
  xxs: "0.4rem"
  xs: "0.6rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  xxl: "1.75rem"
  "3xl": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.jungle-accent}"
    textColor: "{colors.jungle-accent-ink}"
    rounded: "{rounded.sm}"
    padding: "0.85rem 2rem"
    typography: "{typography.body}"
  opponent-plate:
    rounded: "{rounded.md}"
    padding: "0.9rem 1.1rem"
    width: "var(--board-size)"
  opponent-plate-desktop:
    rounded: "{rounded.lg}"
    padding: "1.15rem 1.5rem"
  stat-plate:
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.7rem"
    typography: "{typography.stat}"
  board-frame:
    rounded: "{rounded.sm}"
    width: "var(--board-size)"
  climb-rung:
    background: "var(--atmos, none), var(--field)"
    flexGrow: "1 unlit / 1.75 lit"
    portraitSize: "32px"
    edge: "inset 0 1px 0 0 rgb(255 255 255 / 0.06)"
  entrance-plate:
    backgroundColor: "{colors.jungle-accent}"
    textColor: "{colors.jungle-accent-ink}"
    rounded: "0"
    width: "100vw"
    padding: "1rem 0 1.15rem"
  portrait:
    size: "3.75rem"
  portrait-desktop:
    size: "4.75rem"
---

<!-- Start screen composition: surface concept seed f4af7305 (scope: surface,
     mode: persuade), dealt 4/7/1, lead index 4. The user locked "The Climb",
     code-led. Alternates dealt and declined: "The Board is the Ground",
     "The Corridor". -->

# Design System: ChessChallenge

## Overview

**Creative North Star: "Ten Rooms, One Table"**

The player sits at exactly one table for the whole game, and the table never changes. Around it, the room does — ten times, once per rung, from a night jungle lit from above to a white room with nothing left in it. Every visual decision in this build serves that single contrast: an invariant, boringly legible chessboard held inside a world that mutates completely between opponents. The board is the control variable; the room is the story.

Each room is built from the same five slots — a flat ground, a bright ink, a dimmed ink, an accent, and the ink that sits on the accent — plus a sixth that does the real work: an atmosphere layer, the room's own direction of light. Firelight rises from below in the cave, dawn falls from above, the machine carries scanlines, the network a lattice, the void a vignette that closes in from the edges. The palettes alone would read as tinting. The light direction is what makes them places.

Density is low and vertical. One column, centred, with nothing beside the board at any width; the desktop breakpoint scales the same column up rather than filling the margins with a second thing. Exactly one opponent is ever named — no roster, no ladder sidebar, no persistent chrome beyond a small wordmark. The start screen is the one exception: it *is* the ladder, ten unlabelled rooms stacked as altitude rather than ten opponents listed. The one authored spectacle is the score pop: a full-screen scrim over the field, the beaten opponent's name in dim ink, and the running total arriving out of a 16px blur at 1.4x scale before settling.

**Key Characteristics:**
- Ten era palettes on one five-slot structure, crossfading over 900ms
- An atmosphere gradient per era, each with its own direction of light
- A stock, unstyled chessboard at every single rung
- One self-hosted display face (Archivo 800) at negative tracking against a system-ui body
- Translucent plates derived from the era's ink, never from a fixed grey
- One opponent on screen, one column, centre-pinned

## Colors

Ten complete palettes, each a dark ground with a warm or electric accent, ending in a full light inversion.

### Primary

The **accent** slot is the only saturated colour any screen carries, and it changes identity every rung: **Jungle Ochre**, **Cave Ember**, **Dawn Sunrise**, **Tavern Brass**, **Club Gold**, **Hall Coral**, **Phosphor Green**, **Network Cyan**, **Void Magenta**, and at the Singularity a **Near-Black** — the accent stops being a colour at all. The accent carries the primary button fill, the portrait stroke, the score total, the urgent clock, the status line, the last item in the ladder list, the focus ring, and `::selection`.

The **accent-ink** slot is the accent's partner and exists only so text on an accent fill stays legible; it is always a near-black drawn from the era's own ground, inverting to near-white in the final blank era.

### Neutral

- **Field**: the era's flat ground, painted under the atmosphere layer on the shell.
- **Ink**: all primary text, and the source colour for every plate and edge.
- **Ink-dim**: taglines, labels, blurbs, the wordmark, the beaten opponent's name in the score pop. Everything the player reads once and moves past.
- **Plate** (`color-mix(in srgb, var(--ink) 8%, transparent)`) and **Edge** (`color-mix(in srgb, var(--ink) 20%, transparent)`): the derived surface pair for the opponent plate and stat pills.
- **Board squares**: react-chessboard's stock light and dark squares, unmodified at every rung.

### Named Rules

**The Constant Board Rule.** The board is never themed. It renders at react-chessboard's stock light/dark squares in all ten eras. Its invariance is the system's central device, not an omission — the era changes around the board precisely so the player never loses the surface they are playing on.

**The Under-Point-Oh-Four Rule.** Every atmosphere gradient peak is held under ~0.04 relative luminance, so ink-dim still clears 4.5:1 over the brightest point of its own gradient. Retuning a gradient stop means re-measuring that contrast; the atmosphere is allowed to be visible, never allowed to be bright.

The 0.04 figure is a proxy for that 4.5:1 outcome, and two places show why the outcome is what actually binds. The **start** era's ground is a light gray measuring 0.046 before any gradient is painted, so its ink-dim is `#b8bdc4` to clear 4.5:1 over both the gradient peak (4.79:1) and the plate (4.59:1). And on the climb, the proxy says nothing at all — what governs there is each band's own ink over its own scrimmed field, measured across all thirty era x state combinations. When the proxy and the outcome disagree, measure the outcome.

**The One Accent Rule.** An era gets exactly one accent. If a screen needs a second emphasis colour it uses ink at full strength or a plate, never a second hue. The hall era is the proof: the direction contract called for tournament red as the ground, and it shipped as a slate-blue field with coral surviving as the accent only — because a red ground could not carry a legible rank line.

## Typography

**Display Font:** Archivo 800, self-hosted at `src/fonts/archivo-800-latin.woff2` (latin subset, 14.4 kB, OFL), exposed through a `--display` custom property with a `system-ui, sans-serif` fallback and `font-display: swap`.
**Body Font:** system-ui (`-apple-system`, `Segoe UI`, sans-serif), 16px root, 1.45 line-height.

**Character:** One weight, one job. Archivo appears only at 800 with negative tracking that tightens as the size grows (−0.02em on a stat pill, −0.055em on the final score), so big numbers and short headlines read as one struck block. Everything that is prose stays system-ui at 400/600 and never competes.

### Hierarchy

- **Display Hero** (800, fluid to 5rem, 5.5rem ceiling at ≥1024px, 0.92 line-height): the start title only, always on two lines. Its second line is set in the accent as a block element. It scales on the **smaller** of 16vw and 13vh, at every breakpoint including the desktop one: width alone puts an 80px title into a 360px-tall landscape window and pushes the entrance off the fold. A width-only override of this value is a bug, and has been one twice.
- **Display Score** (800, fluid to 6.5rem, tabular figures): the end-screen final score. The score pop's total is the same treatment one step down (fluid to 6rem).
- **Headline** (800, fluid to 3.75rem, 0.98 line-height): end-screen verdict lines.
- **Title** (800, fluid to 1.5rem, 1.875rem at ≥1024px): the opponent's name on the plate. The only display type on the playing screen.
- **Stat** (800, 1.15rem, 1.375rem at ≥1024px, tabular figures): clock, score, best.
- **Body** (400, 1rem/1.45): taglines, details, errors. The start screen carries no prose at all — the one thing a player must know before committing rides on the button instead (see Components).
- **Label** (600, 0.625–0.75rem, 0.14–0.22em tracking, uppercase): stat labels, the rank line, the end-score label, the wordmark. Always ink-dim, except the rank line which is accent.

### Named Rules

**The Tabular Number Rule.** Every number that changes in place — clock, score, best, the counting-up total — carries `font-variant-numeric: tabular-nums`. Digits must not reflow while they tick.

**The Eight-Hundred-Only Rule.** Archivo ships at a single weight in a single subset. Never request 400, 600 or 700 from `--display`; that buys a faux-bold or a second file. Prose weight lives in system-ui.

## Layout

A single centred column. The shell is a flex column with `align-items: center`, `justify-content: safe center`, a 1.5rem gap (1.75rem at ≥1024px), `min-height: 100dvh`, and `clamp(1rem, 4vw, 2.5rem) 1rem 2rem` padding.

**`--board-size` is the layout module.** It is `min(92vw, max(18rem, calc(100dvh - 20rem)), 30rem)`, raised to `min(92vw, max(18rem, calc(100dvh - 23rem)), 38rem)` at ≥1024px. The `calc` keeps the board from pushing the composition past one screen; the inner `max(18rem, …)` is a floor that stops a short viewport from squeezing the board below playable — the page is allowed to scroll instead. The opponent plate and the stats row are both set to `width: var(--board-size)`, so those three elements share one edge-to-edge measure at every size.

One breakpoint, at 1024px. Below it the board is deliberately phone-sized; above it the whole composition scales up (plate padding, portrait, name, stat size, hero title) rather than adding columns. The pin never changes: board centre, opponent above it, stats below, one opponent only.

Spacing rhythm is small and consistent: 0.3–0.6rem inside components, 1–1.75rem between them, 2–2.5rem at the page edge. Prose blocks cap at 30rem, the start and end screens at 34rem, the ladder list at 32rem.

### Named Rules

**The Shared Measure Rule.** Anything sitting in the main column *beside the board* is `width: var(--board-size)`. Never hard-code a container width there; a second measure breaks the pin. The start and end screens have no board and so no pin to break. The start screen sets one measure of its own, 34rem, and holds everything to it: the title column, each band's inner content, and the entrance plate's contents — so the door lines up with the rooms even though the plate itself spans the viewport.

**The One Opponent Rule.** Exactly one opponent is *named* at any moment, and only ever the one being played — plus rung 1 on the entrance plate, which names the opponent you are about to face rather than a roster. The full ladder appears once, on the start screen, as the climb: ten bands, one per rung, each painting its own era rather than describing its occupant. No names and no taglines; the Elo is pinned because a number states the ladder's range without spoiling who is on it. The climb is never persistent chrome beside the board, and no screen but the start screen carries it.

*Superseded twice, 2026-09-14.* The rule originally called for a wrapped list of names with dot separators. That became a grid of ten era tiles, which spoiled nothing and showed the worlds — and then became the climb, because the grid rendered every atmosphere at a tenth of its authored scale and aliased. What the rule has always protected — never a roster competing with the opponent in front of you — all three forms honour; only the climb also renders the worlds correctly.

## Elevation & Depth

Depth is atmospheric, not stacked. There is one real shadow in the build, under the board, and everything else takes its separation from the translucent plate plus hairline edge pair mixed out of the era's ink. The atmosphere gradient does the rest: because each era's light has a direction, the flat ground reads as a space rather than a fill.

### Shadow Vocabulary

- **Board lift** (`box-shadow: 0 1.5rem 3rem -1rem rgb(0 0 0 / 0.6)`): the only shadow in the system. A long, soft, downward cast that seats the board in whatever room it is currently in.
- **Board lift, light room** (`box-shadow: 0 1.5rem 3rem -1rem rgb(0 0 0 / 0.22)` under the blank era): the same shadow re-weighted for the inverted final era, where 0.6 black would read as dirt.
- **Score scrim** (`background: color-mix(in srgb, var(--field) 84%, transparent)` with `backdrop-filter: blur(7px)`): the only backdrop-filter, and the only true overlay layer (z-index 10).

### Named Rules

**The One Shadow Rule.** The board casts; nothing else does. Plates, buttons, and pills separate by plate and edge alone. A new surface asking for a shadow is asking for the wrong kind of hierarchy.

## Shapes

A soft-rectangle language with no circles outside the portrait system. Radii climb with the size of the thing: 0.25rem on the focus ring, 0.5rem on buttons, stat pills and the board frame, 0.75rem on the opponent plate (1rem at ≥1024px). Nothing is pill-shaped and nothing is square.

Borders are one hairline: `1px solid var(--edge)`, and only on plates. Buttons carry no border at all — they are a solid accent fill.

The portrait system is the one place with free geometry: a 64×64 viewBox, `fill: none`, `stroke: currentColor`, `stroke-width: 2`, round caps and joins, drawn in the era accent. Ten heads, one hand: only the silhouette and one signature feature change per rung (a splayed ear, a brow shelf, spectacles, a tie, a CRT bezel, a graph, an eclipse ring). A portrait needing a fill sweep or a second stroke weight is off-system.

## Components

### Buttons

- **Shape:** softly rounded rectangle (0.5rem), no border.
- **Primary:** accent fill with accent-ink text, `0.85rem 2rem` padding, inherited system-ui at 700 with 0.02em tracking. There is exactly one on screen: "Face the Monkey" on the start screen, "Climb again" on the end screen.
- **The start screen has no button.** It has the entrance plate (see The Entrance), which is full-bleed, square-cornered and flush to the floor. `.btn` does not appear on it.
- **Hover / Active:** `filter: brightness(1.12)` plus a 1px lift over 200ms on the house ease; active drops the lift back to 0.
- **Focus:** the global ring — `2px solid var(--accent)` at 3px offset with a 0.25rem radius, applied to every link, button and `[tabindex]`. `.btn` overrides the ring to `var(--ink)`: the button is an accent fill, so an accent ring is 1:1 against it and reads as the button growing rather than as focus. **Any future accent-filled surface needs the same override.**
- **Secondary / Ghost:** none exist. A screen needing a second action has too many actions.

### Cards / Containers

**Opponent plate** — the only place a personality lives.
- **Corner Style:** 0.75rem (1rem at ≥1024px)
- **Background:** plate (8% ink); **Border:** 1px edge (20% ink)
- **Internal Padding:** `0.9rem 1.1rem` (`1.15rem 1.5rem` at ≥1024px)
- **Grid:** `auto 1fr` — portrait left, name / tagline / rank right, 1rem gap
- **Transition:** background and border-color crossfade at 900ms with the era

**Stat pills** — three equal flex children spanning the shared measure, 0.4rem apart (0.5rem at ≥1024px), 0.5rem radius, the same plate and edge pair, centred. An uppercase 0.625rem label over a tabular 800 value. The clock value flips to the accent under 60 seconds; that is the only state colour in the system.

### Navigation

There is none. A 0.75rem uppercase wordmark at 0.22em tracking in ink-dim is the whole persistent chrome, and only on the playing screen.

### The Climb (signature)

The start screen's entire composition, and the answer to a defect: the previous design showed the ladder as a 5x2 grid of ~101px tiles, which rendered each era's `--atmos` at a tenth of its authored scale. Several eras carry 1-2px repeating gradients, and at that size they aliased into moire — the screen read as a low-quality screenshot. Full width is the fix, and it is structural rather than cosmetic.

Ten bands fill the viewport, `flex-direction: column-reverse` so rung 1 sits on the floor and the load stagger reads as an ascent. Each `<div>` carries its own `[data-era]` and paints `var(--atmos), var(--field)` at full viewport width — the scale those gradients were drawn for.

**The horizon** is the top edge of the first rung not yet beaten: lit below, scrimmed above, the edge itself an `inset 0 1px 0 var(--accent)`. A player with no Best Score gets the horizon on rung 1, so a first arrival sees one lit room at their feet and the whole climb dark above it. Lit rungs take `flex-grow: 1.75`, so the ground a player has taken owns more of the screen than the climb they have not — the composition visibly fills as they improve.

**Unlit is designed, not absent.** A dark rung keeps its own texture under a `rgb(7 8 10 / 0.5)` scrim plus `filter: saturate(0.38)`. The recession is atmospheric perspective, not black paint: colour drains and cools with altitude the way it does over real ground. A heavier scrim was tried and rejected — it made the first-arrival viewport, the only state a new player ever sees, the blandest one in the build.

**Reach is never persisted.** It is read back out of Best Score by `rungsBeaten`, exact because `gamePoints` caps the speed bonus below one rung's worth. Change `TIER_BASE` or `MAX_SPEED_BONUS` and that inverse must be re-derived.

### Named Rules

**The Still Hairline Rule.** The atmosphere is painted on the band itself and never animated. Motion lives on `.rung::before`, which carries one broad radial wash in the era's accent and deliberately nothing else. A smooth gradient has no high-frequency detail to resample; translating a 1-2px hairline by fractional offsets resamples it every frame, which is the exact shimmer this screen exists to end. **Never move a layer that contains `--atmos`.**

**The Whole-Pixel Stroke Rule.** The portraits are a 2-unit stroke on a 64 viewBox, so the rendered stroke is `size / 32`. Only whole multiples of 32px land it on a whole pixel; a fluid `clamp` between them produces 1.24px and goes soft. Band portraits are a flat **32px** (a 1.00px stroke), not a fluid size, and are hidden entirely below 460px of viewport height rather than shrunk.

**The Inverted Era Exception.** `blank` is the one light era, and under the scrim its near-white ground lands on mid-gray — exactly where its own mid-gray `--ink-dim` disappears (1.27:1). Its Elo uses `--ink` at full opacity instead. Every other era's label runs `--ink-dim` at 0.88. Verified across all thirty era x state combinations; worst case 4.78:1.

### The Entrance (signature)

Not a button and not a wide button: the floor of the climb. It breaks the 34rem column with `width: 100vw; margin-inline: calc(50% - 50vw)`, squares its corners to `0`, and sits flush to the bottom of the viewport, so it reads as ground rather than as a control. It wears **rung 1's own palette** via `data-era` — the door is the colour of the room behind it — and carries rung 1's portrait and Elo inside it, on the same 34rem measure as every band above, because the two were otherwise fighting for the same space and the plate won.

The terms of the Run ride inside its accessible name deliberately: this is the only place they are stated, and splitting them out is how sighted and screen-reader players end up knowing different things.

**Signature interaction.** Hovering or focusing the entrance scales `.climb` by 1.018 from `transform-origin: 50% 100%` and brightens rung 1 — reaching for the door makes the climb loom and the room behind it warm. Scaling from the floor rather than translating means no gap opens at the bottom.

### Era Shell (signature)

The shell element carries `[data-era]`, and that one attribute swaps the whole world: `background: var(--atmos, none), var(--field)` with `color: var(--ink)`, crossfading over 900ms. The derived `--plate` and `--edge` are declared on that same element, because they are mixed from `--ink`, which the era sets there.

While the score pop is up, the era deliberately stays with the opponent just beaten, so the 900ms crossfade to the next world plays as the reveal after the scrim lifts instead of running invisibly beneath it.

### Score Pop (signature)

The one authored moment. A fixed full-viewport scrim (84% field plus a 7px blur, `pointer-events: none`, `role="status"`), grid-centred: the beaten opponent's name in dim display type, the running total in accent display type, and the gain beneath in 700 system-ui. The total animates in over 700ms from `scale(1.4)` plus `blur(16px)` at zero opacity to rest, while the number itself counts up over 900ms on a cubic ease-out. The gain rises 0.75rem on a 140ms delay. Entry is a 300ms fade; exit is a 420ms fade to `scale(1.04)`.

## Do's and Don'ts

### Do:

- **Do** declare `--plate` and `--edge` on the element that carries `[data-era]`. They are `color-mix` results derived from `--ink`.
- **Do** give every new era all six properties: `--field`, `--ink`, `--ink-dim`, `--accent`, `--accent-ink`, and an `--atmos` with its own direction of light.
- **Do** size anything in the main column with `var(--board-size)`.
- **Do** use the accent for exactly one thing at a time on a screen, and ink-dim for everything read once.
- **Do** set every changing number in tabular figures.
- **Do** re-measure ink-dim against 4.5:1 over the brightest point of any gradient you touch.
- **Do** keep transitions on the house ease `cubic-bezier(0.16, 1, 0.3, 1)`: 900ms for era crossfades, 200ms for interaction, 300–700ms for the score pop.
- **Do** honour `prefers-reduced-motion: reduce`, which collapses every animation and transition in the build to 0.01ms.

### Don't:

- **Don't** theme, tint, or restyle the chessboard. It stays at react-chessboard's stock squares on all ten rungs.
- **Don't** put `--plate` or `--edge` on `:root` — `--ink` is not defined there, the mix resolves against nothing, and every plate loses its ground.
- **Don't** raise an atmosphere gradient peak above ~0.04 relative luminance.
- **Don't** add a second shadow. Only the board casts.
- **Don't** name more than one opponent at a time, and don't turn the climb into a roster by captioning its bands or making them selectable. They are places, not a menu.
- **Don't** animate any layer carrying `--atmos`, at any scale. See The Still Hairline Rule.
- **Don't** give a band portrait a fluid size. See The Whole-Pixel Stroke Rule.
- **Don't** request a weight from `--display` other than 800, or add a second display face; the subset ships one.
- **Don't** give the board or the main column a fixed pixel width — the `max(18rem, …)` floor inside `--board-size` is what keeps it playable on short viewports, and the page is permitted to scroll instead.
- **Don't** introduce a second accent hue, a pill radius, or a bordered button; none exist in this system.

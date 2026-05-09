# 2026-05-09 — Hero layout, page coordinate system, accessibility hardening

## What this session was

Trisha had built a static hero reference at `_hero-reference/` (see commit `969bd17` and the directory's own CLAUDE.md) to resolve a visual brief that earlier implementations hadn't landed. She had then started introducing a left margin column with a dashed rule for SVG marginalia, but the math became interdependent in a way that made it hard to debug interactively. This session translated her static reference and margin-column idea into a coherent page coordinate system, then hardened the result with accessibility, responsive, and animation fixes.

## What changed (in commit order)

| Commit | What |
|---|---|
| `3b44c89` | Single-grid page layout: `.site-wrapper` owns the grid, `<main>` subgrids the column tracks, sections opt into full-bleed via `.full-bleed` class. Hero painting reaches viewport edges via `100vw` + negative-margin trick. Single source of truth: `--margin-w` (130px, dashed rule) and `--content-start` (180px, content column boundary). |
| `cdf1fd4` | Stack hero below 1024px (was 768) — at narrower viewports the painted features collide with the content column. Margin column collapses at the same threshold. Logo scales via `clamp(1.4rem, 4vw, 2rem)` with `white-space: nowrap`. Added `tests/e2e/viewport-snapshot.spec.ts` covering 8 breakpoints. |
| `c2a776a` | `--bg-soft` brought closer to `--bg` so the Lineage gradient reads as atmosphere rather than a band — the peachy palette had more contrast between the two values than the cream palette did. |
| `0cfe7c8` | Font-size px → rem throughout (16px base). `html { font-size: 100% }` made explicit. clamp values keep their `vw` middles but switch floor and ceiling to rem. Skipped Base.astro console.log strings (those are dev console formatting, not user-facing CSS). |
| `1b4ce15` | sparkly-text: `display: contents` → `display: inline-block` so the host has a real box. Sparkles now cluster around Inkling instead of scattering across the painting; the small inline-block box keeps them from triggering scrollbars on small viewports. Pause toggle: added `.inkling` to motion-paused selector list (Trisha's recent change put `animation: flit` directly on `.inkling` rather than on the `.flit` class the off-switch was looking for). |
| `33138e5` | Removed `overflow: hidden` from sparkly-text host (was clipping Inkling's wing during flit translate). Added `:host-context(body.motion-paused)` selector so the manual pause toggle reaches into shadow DOM and stops sparkle spinning. |

## Decisions worth preserving

### The painting + margin-column architecture

The page coordinate system uses one CSS variable as the anchor (`--margin-w: 130px`) with `--content-start` derived (`calc(--margin-w + --margin-pad)`). The dashed rule and the content column both read from these. They cannot drift because they share a source of truth. This replaces the earlier ad-hoc layered approach where `--gutter-left` on `<main>`, `max-width: 1400px` centering on each section, and an absolutely-positioned pseudo on `.site-wrapper` all scaled on different curves and only aligned coincidentally at one viewport width.

### Subgrid for `<main>`

`<main>` spans both wrapper columns and uses `grid-template-columns: subgrid` to inherit the page's column tracks. Sections inside `<main>` participate in the same coordinate system without duplicating the template. The alternative (duplicating the grid template on `<main>`) would have worked but kept two values in two places.

### Full-bleed escape via `100vw + calc(50% - 50vw)`

The negative-margin trick works at every viewport because the calc resolves to 0 when wrapper fills viewport (no centering offset) and to the correct negative offset when wrapper centers at max-width. No JavaScript, no media queries, no clamp math.

### Hero internal grid mirrors the wrapper

Hero is full-bleed (100vw) but its internal grid replicates `[1fr] [content-start] [content] [1fr]` so the text inside the hero aligns with the content column elsewhere on the page even though the painting spans viewport-edge-to-viewport-edge. Outer 1fr columns absorb extra space at >1440px viewports; inner columns mirror the wrapper.

### Inkling positioned in percent against the painting

`top: 3%; right: 22%; width: 17%` of the painting box, with `aspect-ratio: 364/531` for CLS pre-allocation. Because the painting box matches the artwork's natural aspect ratio behavior, percentages always resolve to the same painted spot regardless of viewport.

### `align-self: start` vs center for hero text

Text aligns to the top of the painting row (paired with Inkling and the painted CSS at the upper-right) rather than vertically centered (which floated the text in empty rose-haze). Compositional consequence is large for a small switch.

### Stack at 1024px, not 768px

At viewports < ~1280px, the painting's painted features (concentrated in the right ~50%) collide with the content column. Tested empirically: 1024px viewport produced ~96px of overlap between text and painted CSS code. Stacking at 1024px clears the collision; below that, the painting becomes a banner above the text.

### `display: contents` is the wrong default for shadow-DOM web components that need to position absolute children

`display: contents` makes the host vanish from layout — its `overflow`, `position`, and z-index don't apply, and absolute descendants resolve against the *grandparent*'s positioning context. For sparkly-text wrapping a target, `display: inline-block` (or `block`) is the right call: the host establishes its own positioning context, sparkles stay near the host, and overflow can be controlled.

### Shadow DOM responding to light-DOM state via `:host-context()`

Manual pause toggle adds `motion-paused` class to `body` and `html`. Shadow CSS uses `:host-context(body.motion-paused)` to halt sparkle animation when the toggle fires. This is the standard cross-boundary mechanism in 2026 (well-supported across browsers).

## Open items (not addressed in this session)

| Item | Status |
|---|---|
| **Top edge of hero painting visible** | Trisha noticed at end of session. Considering a slight fade at the top to soften the edge. Not yet implemented. |
| **Browser default font-size 20px** | Trisha's local environment, not a code issue — testing remnant she'll fix. |
| **Spec drift** | `docs/superpowers/specs/2026-04-26-inkling-hero-design.md` still describes dark mode, dashed-SVG sparkle trail, mix-blend-mode: screen, PNG assets. Memory note `spec_revision_approach.md` describes how to revise: preserve principles, update implementation specifics, don't apologize for divergence. |
| **Closed-list pause off-switch** | `motion.css` has explicit selectors per animation class (`.flit`, `.inkling`, `.halo-pulse`, `.sparkle`, `.glow-trail`). Each new animated class has to enroll. A universal `.motion-paused * { animation: none !important }` would be more robust but kills helpful transitions (nav hover, etc). Worth a future refactor. |
| **Animation: flit keyframes vs painted-CSS-as-spec** | The painted CSS in `light-bkg-full.webp` specifies a flit with opacity fade and rotation. Current motion.css `@keyframes flit` is a gentle hover (translate ±8px). Trisha decided: change the painting later, don't change the implementation. |
| **Code review** | Deferred. |
| **Typography pass** | Trisha mentioned "fonts need love" but it's a perception call she'll drive. Most likely a calibration once the 20px browser default is fixed. |

## Memory notes referenced

- `asset_workflow.md` — ChatGPT-raw + Photoshop-composite is Trisha's asset pipeline
- `spec_revision_approach.md` — preserve principles, update implementation, don't apologize for divergence
- `collaborative_authorship_framing.md` — name actual division of labor; "we all have our strengths"

## Tests

- 12 pre-existing e2e tests (a11y, pause-toggle, reduced-motion, home-renders) — all pass
- 8 viewport-snapshot tests added — all pass
- 1 stale assertion removed (`Broken Arrow, OK` text in hero meta — Trisha removed the meta list earlier in the design pass)
- Total: 20 pass, 0 fail

## Sequence of fixes that mattered

1. Token swap (cream palette) — single-line change, ripples globally via CSS variables
2. Hero refactor (aspect-ratio wrapper) — structural, but bounded to one section
3. Single-grid layout system — replaces three competing scaling curves with one source of truth
4. Subgrid fix — caught the `<main>` wrapping issue that broke the full-bleed CSS targeting
5. Bg color iteration — peachy → cream → peachy (Trisha's eyes drove it; she could see what the math couldn't)
6. Stack threshold raised to 1024px — desktop happy path was always solid; tablet/laptop needed work
7. Px → rem typographic conversion — invisible at 16px root, real for accessibility
8. sparkly-text architecture (display: contents → inline-block) — fixed scrollbars *and* improved the visual (sparkles cluster around target instead of scattering)
9. Pause toggle reach (motion.css selector + `:host-context`) — both light-DOM and shadow-DOM coverage

## What this session was *not*

- Not a typography pass (held for Trisha's perception calls)
- Not a flit-animation rework (Trisha chose to update the painting rather than change the implementation)
- Not a code review (deferred to next pass)
- Not a finalization of the spec (revision still pending; memory notes describe the approach)

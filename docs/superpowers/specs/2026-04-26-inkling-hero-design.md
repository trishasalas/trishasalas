# Inkling Hero Design — trishasalas.com v2

**Date:** 2026-04-26
**Status:** Design approved, pending user review of this spec
**Tech stack:** Astro
**Scope:** Home page only. Inner pages (Research, Writing, About, Notes) stay minimal/professional and are out of scope for this design.

---

## Why this exists

`trishasalas.com` is being rebuilt as the personal site of Trisha Salas — a senior front-end developer turned accessibility consultant doing independent research in mechanistic interpretability. The home page needs to carry a specific tension: **structure that reads as serious credibility** while **art that reads as a human mind behind the work**. The brief, distilled from her brainstorming notes: *"independent research with a visible mind behind it."*

The design centers on **Inkling** — a recurring fairy character. Inkling is Trisha's self-portrait: understated but mischievous, modeled in part on Ene from Kagerou Project (a cyber-girl character who lives inside computers and causes playful mischief). Inkling is **not a hero or mascot**. She is a *system that appears across the page* — marginalia, glow trails, quill cameos, easter eggs in the source code. The site is primary; she inhabits it.

Inner pages are deliberately minimal-professional so the whimsy of the home page reads as deliberate rather than tonal.

---

## Section 1 — Asset inventory

### A. Painterly raster Inkling poses

Three poses, three placements across the home page, each characterizing a different state:

| Asset | Pose | Placement | State |
|---|---|---|---|
| `inkling-in-flight.png` | mid-flight, body angled, carrying a small lit object | Hero, right side | Active mischief |
| `inkling-on-inkwell.png` | perched on inkwell | Mid-page rest stop (between Research and Writing) | *She lives here* |
| `inkling-reading.png` | sitting cross-legged, reading a glowing book | About / lineage section | Inward, contemplative |

**Asset state notes:**
- `inkling-on-inkwell.png` and `inkling-reading.png` already exist as clean transparent assets.
- `inkling-in-flight.png` will be hand-cleaned by Trisha in Figma from the ChatGPT-generated extract (`source-files/inkling-transparent.png`), removing the residual sparkle trail (which would otherwise compete with the animated SVG trail) and cropping tight to her bounding box plus ~60–80px halo padding.
- All three render with `mix-blend-mode: screen` against the dark page background — this lets the dark warm bg of the source images drop out and the bright pixels (body, wings, halo) come through cleanly without requiring pixel-perfect alpha extraction.

### B. Vertical signature wordmark

- **`signature.svg`** — wordmark reading *"Trisha Salas — Digital Gardener"*, set in Fraunces italic, exported as SVG paths (not `<text>`) so the typographic stroke character is preserved exactly. ~40px wide, runs vertically up the far-left edge of the hero.
- The "Digital Gardener" wording is a deliberate nod to Mosslight Nook and Trisha's plant collection — it carries personal meaning, not a generic tagline.
- Inside the SVG: `<title>Trisha Salas — Digital Gardener</title>` so screen readers announce it correctly.

### C. Marginalia primitives (inline `<svg>`, no separate files)

- **Glow trail.** Single SVG path, ~3–5 anchor curve, originating at Inkling's position in the hero and curving leftward toward the headline text — *crossing the margin guide line*. Animated via `stroke-dashoffset` (draw-in on load + continuous gentle dash flow).
- **Sparkle glyph.** A single 4-point star path. Dropped as `<svg>` instances at varying sizes (8–24px) and opacities. 3–5 instances scattered through the hero. Each twinkles on its own clock.
- **Quill cameo.** Small SVG illustration (~80–100px) drawn once, used as static accent in the Writing section header. Punctuation, not motion.
- **Margin guide line.** 1px vertical baseline, ~15% opacity, full-page-height. The glow trail crosses it — that's the "she crosses boundaries" move.

### D. Source-code easter eggs (mischief surfaces)

- **`console.log` greeting** in-character on page load. Single line, witty, e.g., *"✦ inkling logged in. wings: deployed. mischief: pending."*
- **HTML comments scattered through the source**, written *as Inkling* (small notes, observations, the occasional unicode doodle). Page reads as a document she's been editing. Literal "magic in the source code." Invisible to screen readers by definition (HTML comments are stripped by AT) — explicitly a view-source easter egg.
- **`@keyframes flit` is real** — the hero Inkling's flit animation (defined in Section 3) is named exactly `flit` to match the layout image's code panel, with a CSS comment over it (haiku or in-character note). The visible "code" in the comp becomes the actual implementation. Same animation, just deliberately named to wink at the source-of-truth.

### E. Background

No raster asset. Solid `--bg` (deep wine burgundy) + an SVG-noise grain overlay (the `body::before` filter pattern carried over from the existing mockup HTML, with the smart-quote bug fixed). Inkling's own glow + the CSS atmospheric halo do the candlelit warmth.

### F. Atmospheric lighting (CSS only)

- **Halo behind Inkling** — `::before` radial gradient, rose-gold center fading to transparent, sized larger than her bounding box.
- **Ambient hero gradients** — 1–2 large soft warm-rose radial gradients scattered across the hero section, very low opacity, suggesting candlelight bloom.
- All `pointer-events: none`, behind interactive content but in front of the page background.

---

## Section 2 — Composition & placement

### Hero (top of page, single viewport-height section)

- **Layout grid:** asymmetric. Headline + lede + meta column on the **left**, ~55% of width. No image column on the right — Inkling is *positioned over* the hero, not contained in a slot.
- **In-flight Inkling** absolutely-positioned in the right margin, biased toward the upper-third vertically. No frame, no aspect-ratio box. She's allowed to bleed off the viewport edge at narrow breakpoints.
- **Halo** behind Inkling via CSS pseudo-element radial gradient.
- **Glow trail (SVG)** originates at her position and curves leftward, crossing the margin guide line and entering the headline area. This is the painterly "she crosses boundaries" move.
- **Vertical signature SVG** runs up the far-left edge of the hero, low opacity.
- **Margin guide line** (1px, ~15% opacity) sits between the text column and Inkling's column.
- **Sparkles** scattered (3–5 instances) through the section.
- **Eyebrow row** (`Accessibility · Mech Interp · Practice`) sits above the headline. Headline: *"Following the inkling."* with `inkling` italic in `--rose-deep`. Lede paragraph follows. Meta row at bottom: *Broken Arrow, OK · Level Access · Independent Research*.

### Mid-page rest stop (proposed, pending visual review)

- A small section between Research and Writing.
- `inkling-on-inkwell.png` perched at ~120–180px wide, off-center, low position. *She lives here* moment.
- Possibly a single italic line of marginalia near her: *"still here."*
- **No animation on this Inkling** — at rest by design.
- This section is **proposed but pending visual review** — to be mocked up as a quick HTML demo into `source-files/` after the rest of the design is locked, before final commitment.

### Writing section

- Quill cameo SVG above the section title or alongside the first post. Static. ~80px, warm rose-gold stroke.

### About / lineage section

- `inkling-reading.png` placed unframed (no `aspect-ratio` box, no radial-gradient frame). Same treatment as hero: absolute placement, screen blend, CSS halo behind her, no animation.

### Footer

- Pause-animations toggle (see Section 4).
- Source-code easter eggs (HTML comments) scattered throughout the markup, not concentrated here.

### Responsive behavior

- Inkling **does not shrink linearly**. At narrow viewports (<1024px) she pulls fully into the right margin and is partially clipped (allowed). Below ~640px she may move *behind* the headline at very low opacity (`z-index` lower, opacity `0.4`), so text remains primary. The painterly approach allows this because she has no frame to break.
- The vertical signature drops below the headline (becomes horizontal) on mobile, OR is hidden on mobile entirely — a sub-decision to make at implementation time.

---

## Section 3 — Animation scope

Conservative budget. "She will flit and float" — not "everything wiggles."

### Ambient motion (auto-playing)

| Motion | Target | Curve | Duration | Notes |
|---|---|---|---|---|
| Flit | hero in-flight Inkling | translate-only, figure-8 path, ~12px displacement each axis. Optional `scale(1.000 → 1.012 → 1.000)` for breath/wing pulse. No rotation. | 6s ease-in-out infinite | |
| Halo pulse | hero halo gradient | opacity `0.65 → 0.9 → 0.65` | 8s ease-in-out infinite | Out of phase with flit |
| Glow trail draw-in | hero SVG trail | `stroke-dashoffset: <length> → 0` | 2.5s ease-out, once on load | |
| Glow trail flow | hero SVG trail | continuous dash-flow + opacity oscillation along path | 10s linear infinite | |
| Sparkle twinkle | hero sparkles (3–5 instances) | `scale 0 → 1 → 0` per instance | ~1.8s, staggered via `animation-delay`, 5–8s gaps between cycles | Each on its own clock |

### User-initiated motion (mischief surface #4 — hover responses)

| Trigger | Effect | Notes |
|---|---|---|
| Hover headline period | period swaps to ✦ glyph | ~150ms transition. Keyboard: not applicable (h1 is non-interactive). |
| Hover paper title | small quill-stroke SVG flickers in next to title, fades on hover-end | Must also fire on `:focus-visible` |
| Hover italic `em` emphasis | warm rose underline draws in via `::after` width-transition | Must also fire on `:focus-visible` for any inside an interactive element |

### Static (no animation)

- Mid-page perched Inkling (at rest)
- About/lineage reading Inkling (at rest)
- Quill cameo (punctuation)
- Vertical signature
- Background grain

### `prefers-reduced-motion: reduce` and pause-animations toggle

These two triggers map to the **same CSS class** on `<body>` (e.g., `body.motion-paused`). Single mechanism, two triggers. When applied:

- Flit: stopped at base position
- Halo pulse: stopped at mid-opacity (`0.78`), static gradient
- Glow trail: drawn in instantly, no draw-in animation, no dash-flow
- Sparkles: visible at full scale, no twinkle
- Hover responses: kept (user-initiated, not ambient), but transitions clamp to ~50ms

Result: a "still life" version of the same composition. No motion is ever *required* for the design to read.

### Performance notes

- Everything uses `transform` / `opacity` / SVG attribute animation — GPU-cheap, no layout/paint thrash.
- Flit on the painterly raster uses `will-change: transform` (toggled, not permanent).
- Grain overlay stays `position: fixed; pointer-events: none;` and uses an SVG data-URI so it scales without rasterization.

---

## Section 4 — Accessibility

### Alt-text strategy: narrative, not visually descriptive

Inkling's lore is already in the visible body copy ("Inkling has been here since before any of this had a name…"). Alt text gives screen reader users the *same beat* sighted users get at that point on the page — name and presence, not appearance.

- Hero: `alt="Inkling, in flight."`
- Mid-page rest stop: `alt="Inkling, perched."`
- About/lineage: `alt="Inkling, reading."`

### WCAG 2.2.2 — pause control for auto-playing motion

The flit (6s loop) and halo pulse (8s loop) exceed the 5-second threshold. We ship a manual pause toggle alongside `prefers-reduced-motion` honoring.

- **Placement:** footer, far-left, before the copyright line.
- **Visual:** monospace label, `▸ pause animations` / `■ animations paused`. Adequate click target.
- **Behavior:** real `<button>` element, `aria-pressed`, focusable, keyboard-toggleable, persists state in `localStorage`.
- **Mechanism:** toggling adds/removes `body.motion-paused` (the same class `prefers-reduced-motion` applies via media query).

### Keyboard parity for hover responses

Every `:hover` response (paper title quill flicker, em underline draw-in) must also fire on `:focus-visible`. The headline period swap (`.` → `✦`) stays hover-only — `<h1>` is not focusable, and the swap is purely ornamental.

### Focus visible treatment

- Default browser focus rings are illegible against burgundy.
- Custom: `outline: 2px solid var(--rose); outline-offset: 2px;` applied via `:focus-visible` only (not `:focus`, so mouse users don't see it).
- Verify ≥3:1 contrast against `--bg` for the rose outline.

### Decorative SVGs

All inline marginalia SVGs (sparkles, glow trail, halo, quill cameo, margin guide) get `aria-hidden="true"`. They carry no content meaning lost without them.

### Vertical signature SVG

Path-based wordmark with `<title>Trisha Salas — Digital Gardener</title>` inside the SVG so AT announces it correctly.

### Source-code-only mischief surfaces

- HTML comments are stripped by AT — view-source easter egg only, by design.
- Console greeting is invisible to AT — view-DevTools easter egg only, by design.
- Both are explicitly *not* the only place character information lives. Visible body copy carries the lore.

---

## Section 5 — Palette, type, build, file structure

### CSS custom properties (dark palette)

```css
:root {
    /* base */
    --bg:           #1f1217;  /* deep wine, near-black with warm shift */
    --bg-soft:      #2a181f;  /* sections, cards */
    --bg-warm:      #3a1f28;  /* hover lift, ambient accent */

    /* text */
    --text:         #f5dfd2;  /* warm cream, primary */
    --text-soft:    #c9a89e;  /* secondary */
    --dust:         #a88090;  /* meta, technical labels */

    /* roses */
    --rose:         #e89aa8;
    --rose-deep:    #d97a92;
    --rose-whisper: #5a2c38;  /* very dark rose for borders, dividers */

    /* warmths (Inkling's lighting) */
    --peach:        #f0b8a4;
    --gold:         #d8a676;

    /* ink (kept for dark accents on warm text) */
    --ink:          #2a1a1f;
}
```

**Contrast verification needed during implementation** (run an automated checker):
- `--text` on `--bg`: expected ~12:1, AAA
- `--text-soft` on `--bg`: expected ~6.5:1, AA
- `--rose-deep` on `--bg`: expected ~5:1 — borderline. If short for body links, bump to a slightly lighter rose-deep variant.
- `--dust` on `--bg`: expected ~5.5:1, AA for labels

### Type system (carries from existing mockup)

- **Fraunces** — display, italic for emphasis. `font-weight: 300` for h1. `font-synthesis: none` to ensure browsers don't fake italics (Fraunces ships true italic axes).
- **Lora** — body.
- **JetBrains Mono** — technical metadata, eyebrow, meta rows, pause toggle label.

### Tech stack: Astro

Reasoning: minimal-JS-by-default keeps the painterly hero feeling like *a page* not *an app*. MDX support gives writing/research sections room to grow without a rewrite. Scoped CSS per component fits the granular marginalia system.

### File / folder structure (proposed)

```
trishasalasV2/
├── src/
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Inkling.astro              # placement + halo + flit wrapper
│   │   ├── GlowTrail.astro            # SVG component
│   │   ├── Sparkle.astro              # single sparkle SVG, used multiple times
│   │   ├── QuillCameo.astro
│   │   ├── Signature.astro            # vertical SVG signature
│   │   ├── MarginGuide.astro
│   │   ├── PauseAnimationsToggle.astro
│   │   └── sections/
│   │       ├── Research.astro
│   │       ├── Writing.astro
│   │       ├── Lineage.astro          # About / lineage
│   │       └── RestStop.astro         # mid-page perched-Inkling moment
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       ├── tokens.css                 # CSS custom properties
│       ├── motion.css                 # @keyframes + body.motion-paused rules
│       └── global.css
├── public/
│   └── images/
│       ├── inkling-in-flight.png      # hand-cleaned in Figma
│       ├── inkling-on-inkwell.png
│       └── inkling-reading.png
├── source-files/                      # reference assets, not deployed
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-26-inkling-hero-design.md
```

---

## Open / pending items

These are explicitly **not blockers for the implementation plan** but should be tracked:

1. **Mid-page rest stop** — proposed but pending visual review. To be mocked up as a quick HTML demo and reviewed before final commitment to inclusion.
2. **Mobile signature** — sub-decision: drops below headline as horizontal, or hidden on mobile. Resolve at implementation time.
3. **Contrast verification** — `--rose-deep` on `--bg` is borderline; verify with an automated checker, bump if needed.
4. **`inkling-in-flight.png`** — Trisha cleans the residual sparkle trail and crops in Figma before the asset lands in `public/images/`.

## Out of scope

- Inner pages (Research, Writing, About, Notes individual pages) — minimal-professional, designed separately.
- Content management for posts (will be MDX-driven; structure is part of the implementation plan, not this design).
- Analytics, comments, search.
- Animation on the mid-page perched and About/lineage Inklings — both are at rest by design.
- Cursor trail effects — explicitly out of scope (rejected as polarizing and against the "understated" half of the brief).

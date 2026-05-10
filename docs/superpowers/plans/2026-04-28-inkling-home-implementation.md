# Inkling Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static Astro home page for `trishasalas.com` v2 — dark palette, Inkling-as-system marginalia (in-flight, perched, reading + glow trail + sparkles + signature + margin guide), conservative animation budget, WCAG 2.2 AA conformance, and a working pause-animations toggle.

**Architecture:** Astro 5 static site, no UI framework. Hand-rolled CSS using design tokens. Inkling raster assets render with `mix-blend-mode: screen` over the dark page. Marginalia primitives are inline `<svg>`. A single inline `<head>` script applies `body.motion-paused` from either `prefers-reduced-motion` or `localStorage`, gating all ambient animation. Section components are self-contained; teaser content (papers, posts) is hardcoded in Plan 1 and will move to content collections in Plan 2.

**Tech Stack:** Astro 5.x · TypeScript · Vitest (reserved for Plan 2; placeholder config only) · Playwright + `@axe-core/playwright` for e2e a11y/behavior smoke · Google Fonts CDN (Fraunces, Lora, JetBrains Mono).

**Out of scope for Plan 1** (handled in Plan 2 against Appendix A of the spec):
- Content collections for `research/` and `blog/`.
- Per-paper landing pages at `/research/<slug>/`.
- Per-post pages at `/blog/<slug>/`.
- Highwire Press / Schema.org / Dublin Core metadata.
- Sitemap + robots.txt.
- About page (`/about/`).

Plan 1 ships an **`/`-only home page** that links to anchors (`#research`, `#writing`, `#about`) on the same page — proper inner-page routes land in Plan 2.

---

## Reference assets (already in repo)

| Path | Use |
|---|---|
| `docs/superpowers/specs/2026-04-26-inkling-hero-design.md` | Authoritative design spec |
| `source-files/dark-layout-without-inkling.png` | **Visual fixture** — Task 6 must visually match this before any Inkling is placed |
| `source-files/dark-layout.png` | Visual fixture — final hero must approximate this |
| `source-files/inkling-in-flight.png` | Hero raster (cleaned, transparent-friendly source) |
| `source-files/inkling-inkwell-transparent.png` | Mid-page perched raster (rest-stop demo only) |
| `source-files/inkling-reading-transparent.png` | Lineage section raster |
| `source-files/_Archive/mockup-by-claudeai.html` | Earlier mockup — **smart-quote corruption in CSS**; reference for structure only, do not copy CSS verbatim |
| `docs/social-urls.md` | Source of truth for ORCID / DOI / social URLs |

**Asset filename convention:** Source files keep their `-transparent` suffix to mark which export was transparent-background. Production assets in `public/images/` use the spec names (`inkling-on-inkwell.png`, `inkling-reading.png`). Renaming happens **on copy** in Task 7 — `source-files/` is left untouched.

---

## Final file structure (after Plan 1)

```
trishasalasV2/
├── astro.config.mjs                     # Astro config; site URL set
├── package.json
├── tsconfig.json
├── playwright.config.ts                 # Playwright e2e config
├── public/
│   ├── favicon.svg                      # placeholder (rose-gold ✦ glyph)
│   ├── signature.svg                    # vertical wordmark — placeholder until Trisha exports final
│   └── images/
│       ├── inkling-in-flight.png
│       ├── inkling-on-inkwell.png
│       └── inkling-reading.png
├── src/
│   ├── layouts/
│   │   └── Base.astro                   # <html><head> with font + grain + motion-init script
│   ├── pages/
│   │   └── index.astro                  # Composes sections
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro                 # incl. PauseAnimationsToggle
│   │   ├── PauseAnimationsToggle.astro
│   │   ├── Inkling.astro                # raster wrapper; pose prop selects file + class
│   │   ├── Signature.astro              # <object> wrapper for signature.svg w/ fallback
│   │   ├── MarginGuide.astro            # 1px vertical SVG line
│   │   ├── Sparkle.astro                # single sparkle SVG; size + delay props
│   │   ├── GlowTrail.astro              # hero glow trail SVG
│   │   ├── QuillCameo.astro             # static quill SVG for Writing section
│   │   └── sections/
│   │       ├── Hero.astro
│   │       ├── Research.astro
│   │       ├── Writing.astro
│   │       └── Lineage.astro
│   ├── scripts/
│   │   ├── motion-init.ts               # runs in <head>, sets body.motion-paused before paint
│   │   └── pause-toggle.ts              # client behavior for the toggle button
│   └── styles/
│       ├── tokens.css                   # CSS custom properties (palette, type)
│       ├── motion.css                   # @keyframes + body.motion-paused overrides
│       └── global.css                   # reset + base typography + body grain
├── source-files/
│   └── rest-stop-demo.html              # Task 27 — standalone demo of mid-page perched Inkling
├── tests/
│   └── e2e/
│       ├── home.spec.ts                 # smoke: page loads, key elements present
│       ├── pause-toggle.spec.ts         # toggle behavior + persistence
│       ├── reduced-motion.spec.ts       # prefers-reduced-motion respected
│       └── a11y.spec.ts                 # axe-core smoke
└── docs/
    └── superpowers/
        ├── specs/2026-04-26-inkling-hero-design.md
        └── plans/2026-04-28-inkling-home-implementation.md  ← this file
```

---

## Conventions for this plan

- **Branch:** work directly on `main` per CLAUDE.md (no worktree). Each task ends with a commit. Confirm before any push.
- **Commits:** conventional prose, multi-line where helpful. Subject is imperative; body explains *why*. Format from CLAUDE.md.
- **Verification cadence:** after each task that touches CSS or the DOM, run `npm run dev` and eyeball before committing. After Task 6 specifically, compare against `source-files/dark-layout-without-inkling.png`. After Task 25, run the full Playwright suite.
- **TDD scope:** TDD applied to (a) pause-toggle behavior, (b) prefers-reduced-motion handling, (c) axe-core smoke. Pure structural/CSS tasks use visual verification against the reference PNGs. This matches the value — for static visual work, screenshot tests are higher signal than unit tests.

---

## Task 1: Bootstrap Astro project

**Goal:** Create a minimal Astro 5 project skeleton without running the wizard. Hand-writing config files is faster and avoids interactive prompts.

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Modify: `.gitignore` (add `.astro/`)

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "trishasalas-v2",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^5.5.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "@axe-core/playwright": "^4.10.0",
    "@playwright/test": "^1.48.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://trishasalas.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
```

`trailingSlash: 'always'` and `build.format: 'directory'` are set now to lock URL shape (`/research/foo/` not `/research/foo`). This matters for Plan 2 — Google Scholar caches once per URL and gets sticky, so we want `/` everywhere from the start.

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Append to `.gitignore`**

Add these lines to the existing `.gitignore`:

```
# astro
.astro/
```

- [ ] **Step 5: Install**

Run: `npm install`
Expected: deps install, no errors. Astro creates `.astro/` at first dev run.

- [ ] **Step 6: Verify bootstrap**

Run: `npm run check`
Expected: `0 errors, 0 warnings, 0 hints` (or similar — there's nothing to check yet, that's fine).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json .gitignore
git commit -m "$(cat <<'EOF'
Bootstrap Astro 5 project skeleton

Hand-written config (package.json, astro.config.mjs, tsconfig.json) instead
of running the create-astro wizard, to avoid interactive prompts and to
lock URL shape early — trailingSlash: 'always' and build.format: 'directory'
enforce '/research/foo/' style URLs from day one, which Google Scholar
caches stickily in Plan 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: CSS design tokens

**Goal:** Lift the dark palette and type variables from spec §5 into a single `tokens.css` file. This is the only file that names hex values — everything downstream references `var(--…)`.

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root {
  /* base */
  --bg:           #1f1217;
  --bg-soft:      #2a181f;
  --bg-warm:      #3a1f28;

  /* text */
  --text:         #f5dfd2;
  --text-soft:    #c9a89e;
  --dust:         #a88090;

  /* roses */
  --rose:         #e89aa8;
  --rose-deep:    #e889a0;
  --rose-whisper: #5a2c38;

  /* warmths */
  --peach:        #f0b8a4;
  --gold:         #d8a676;

  /* ink */
  --ink:          #2a1a1f;

  /* type */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'Lora', Georgia, serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  /* layout */
  --hero-pad-x:   clamp(24px, 4vw, 48px);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "$(cat <<'EOF'
Add CSS design tokens (dark palette + type stack)

Single source of truth for the palette per spec §5. --rose-deep is the
revised value (#e889a0, ~5.5:1 vs --bg) — the earlier #d97a92 sat at
~4.8:1, borderline AA body. All downstream components reference var()
only; no raw hex values outside this file.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Global stylesheet (reset + body grain + base typography)

**Goal:** A reset, body styling, and the SVG noise grain overlay. **Critical:** rewrite the body::before SVG noise as ASCII-clean — the archived mockup has smart-quote corruption that breaks the data URI.

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }

html, body { margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.7;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  min-height: 100vh;
}

/* Grain texture overlay — ASCII-clean SVG data URI.
   The archived mockup has smart-quote corruption; do NOT copy from there. */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  z-index: 100;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0 0.82  0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Headlines */
h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 300;
  color: var(--text);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0;
}
h1 em, h2 em, h3 em {
  font-style: italic;
  font-weight: 400;
  color: var(--rose-deep);
  font-variation-settings: "opsz" 144;
}

/* Body emphasis */
p em {
  font-family: var(--font-display);
  font-style: italic;
  color: var(--rose-deep);
}

/* Links — :focus-visible parity per spec §4 keyboard-parity rule */
a {
  color: var(--text);
  text-decoration: none;
  transition: color 200ms ease;
}
a:hover,
a:focus-visible { color: var(--rose); }

/* Focus visible — custom outline for AA contrast against burgundy */
:focus { outline: none; }
:focus-visible {
  outline: 2px solid var(--rose);
  outline-offset: 2px;
  border-radius: 2px;
}
```

The grain `feColorMatrix` was rewritten in **light tones** (0.95/0.85/0.82) instead of the mockup's dark tones (0.2/0.1/0.15) — on a dark background you want light noise, not dark.

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "$(cat <<'EOF'
Add global stylesheet (reset, body grain, base typography)

Body::before SVG noise filter is rewritten ASCII-clean — the archived
mockup at source-files/_Archive/mockup-by-claudeai.html has smart-quote
corruption throughout its CSS that breaks the data URI when copied.

Grain colors flipped from dark to light (rgb ~0.95/0.85/0.82) since we
sit on --bg (deep wine burgundy) — dark grain on dark bg is invisible.

Custom :focus-visible outline at --rose against --bg gives clear keyboard
focus indication without browser-default rings (illegible on burgundy).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Motion stylesheet (keyframes only, no application yet)

**Goal:** Define the animation primitives. Application of these to elements happens in later tasks. The `@keyframes flit` name is load-bearing — it's referenced by the source-code easter egg in spec §1D.

**Files:**
- Create: `src/styles/motion.css`

- [ ] **Step 1: Write `src/styles/motion.css`**

```css
/* Inkling lives at this address.
   The flit is a figure-eight, gentle.
   She does not flap; she breathes. */
@keyframes flit {
  0%   { transform: translate(0, 0) scale(1.000); }
  25%  { transform: translate(8px, -6px) scale(1.006); }
  50%  { transform: translate(0, -10px) scale(1.012); }
  75%  { transform: translate(-8px, -6px) scale(1.006); }
  100% { transform: translate(0, 0) scale(1.000); }
}

@keyframes halo-pulse {
  0%, 100% { opacity: 0.65; }
  50%      { opacity: 0.90; }
}

@keyframes sparkle-twinkle {
  0%, 100% { transform: scale(0); opacity: 0; }
  50%      { transform: scale(1); opacity: 1; }
}

@keyframes glow-trail-draw {
  from { stroke-dashoffset: var(--trail-length, 600); }
  to   { stroke-dashoffset: 0; }
}

@keyframes glow-trail-flow {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -40; }
}

/* Default animation hooks (consumed by components) */
.flit          { animation: flit 6s ease-in-out infinite; will-change: transform; }
.halo-pulse    { animation: halo-pulse 8s ease-in-out infinite; }
.sparkle       { animation: sparkle-twinkle 1.8s ease-in-out infinite; }
.glow-trail    {
  stroke-dasharray: 8 6;
  animation:
    glow-trail-draw 2.5s ease-out 1 backwards,
    glow-trail-flow 10s linear 2.5s infinite;
}

/* The single shared off-switch.
   prefers-reduced-motion AND the manual toggle both apply this class via
   src/scripts/motion-init.ts (runs in <head> before paint). */
body.motion-paused .flit,
body.motion-paused .halo-pulse,
body.motion-paused .sparkle,
body.motion-paused .glow-trail {
  animation: none !important;
}

body.motion-paused .halo-pulse { opacity: 0.78; }
body.motion-paused .sparkle    { transform: scale(1); opacity: 1; }
body.motion-paused .glow-trail { stroke-dashoffset: 0; }

/* Hover/focus transitions clamp to ~50ms when paused */
body.motion-paused * {
  transition-duration: 50ms !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/motion.css
git commit -m "$(cat <<'EOF'
Add motion stylesheet with @keyframes flit and pause class

Keyframes per spec §3 motion budget. The 'flit' name is load-bearing —
it's the one the source-code easter egg in spec §1D points to (the
animation name in the layout image's code panel becomes the actual
implementation), so the comment above it is the in-character haiku.

body.motion-paused is the single off-switch. Both prefers-reduced-motion
and the manual toggle apply it via the head-script in a later task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Motion-init script (FOUC-free pause class application)

**Goal:** A tiny script that runs synchronously in `<head>` before first paint and applies `body.motion-paused` if either (a) `prefers-reduced-motion: reduce` or (b) `localStorage` says paused. Synchronous + before-paint = no flash of animation for users who don't want it.

**Files:**
- Create: `src/scripts/motion-init.ts`

- [ ] **Step 1: Write `src/scripts/motion-init.ts`**

```ts
/**
 * Runs synchronously in <head> before <body> exists. We can't query
 * <body> directly yet, so we set a flag on document.documentElement and
 * an inline observer flips <body> the moment it's parsed.
 *
 * Two triggers, single class:
 *   1. prefers-reduced-motion: reduce  (system)
 *   2. localStorage 'motion-paused'='1' (user)
 */
(() => {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  // Wrapped: a thrown localStorage error in <head> would abort the whole
  // script, dropping the prefers-reduced-motion path. Fall back to the
  // system signal alone if storage is unavailable.
  let userPaused = false;
  try {
    userPaused = localStorage.getItem('motion-paused') === '1';
  } catch {
    /* private-mode Safari etc. — system pref still wins */
  }
  const paused = prefersReduced || userPaused;

  if (!paused) return;

  // Apply ASAP to <html>, then propagate to <body> when it parses.
  document.documentElement.classList.add('motion-paused');

  if (document.body) {
    document.body.classList.add('motion-paused');
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => document.body.classList.add('motion-paused'),
      { once: true },
    );
  }
})();
```

The script applies the class to `<html>` first (always available) and to `<body>` once it exists. Update `motion.css` selector compatibility in the next step.

- [ ] **Step 2: Update `src/styles/motion.css` to also match `html.motion-paused`**

In `src/styles/motion.css`, change every `body.motion-paused` selector to also accept `html.motion-paused` for the brief window before `<body>` parses. Replace the pause-block with:

```css
body.motion-paused .flit,
html.motion-paused .flit,
body.motion-paused .halo-pulse,
html.motion-paused .halo-pulse,
body.motion-paused .sparkle,
html.motion-paused .sparkle,
body.motion-paused .glow-trail,
html.motion-paused .glow-trail {
  animation: none !important;
}

body.motion-paused .halo-pulse,
html.motion-paused .halo-pulse { opacity: 0.78; }

body.motion-paused .sparkle,
html.motion-paused .sparkle { transform: scale(1); opacity: 1; }

body.motion-paused .glow-trail,
html.motion-paused .glow-trail { stroke-dashoffset: 0; }

body.motion-paused *,
html.motion-paused * {
  transition-duration: 50ms !important;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/motion-init.ts src/styles/motion.css
git commit -m "$(cat <<'EOF'
Add FOUC-free motion-pause initialization

Runs synchronously in <head> before paint and applies motion-paused to
<html> immediately, propagating to <body> when it parses. Two triggers:
prefers-reduced-motion (system) and localStorage 'motion-paused' (user).

The brief <html>-only window matters — without it, reduced-motion users
see ~1 frame of flit before <body> parses. Pause selectors updated to
match either html.motion-paused or body.motion-paused for that window.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Base layout

**Goal:** The `<html>` shell. Loads fonts, applies global CSS, runs motion-init in `<head>`, exposes a `<slot/>`. Inkling-as-document begins here — HTML comments in this file are written *as Inkling* per spec §1D's second-audience test.

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Write `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import '../styles/motion.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Lora:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
  />
  <script>
    // Static side-effect import. Astro bundles this as <script type="module">
    // which defers — meaning it runs after HTML parse but BEFORE first paint
    // and DOMContentLoaded. That's pre-paint enough that reduced-motion users
    // won't see a flash of flit on first load.
    import '../scripts/motion-init.ts';
  </script>
</head>
<!--
  ╭───────────────────────────────╮
  │  she lives in the margins     │
  │  ✦ welcome, view-source guest │
  ╰───────────────────────────────╯
-->
<body>
  <slot />
  <script>
    // Console greeting — mischief surface #1.
    // Phrased to read well to both view-source guests AND hiring managers.
    // Per spec §1D second-audience test: in-character but research-toned.
    console.log(
      '%c✦ inkling is here.',
      'font-family: Georgia, serif; font-style: italic; color: #e89aa8; font-size: 14px;',
    );
    console.log(
      '%cif you are reading this, the source is the sketchbook.',
      'color: #c9a89e; font-size: 12px;',
    );
  </script>
</body>
</html>
```

The Astro `<script>import '...';</script>` shape is a *static side-effect import*. Astro recognizes the import statement, bundles `motion-init.ts`, and emits `<script type="module" src="/_astro/motion-init.HASH.js"></script>`. Module scripts are deferred-by-default — they run after parsing completes but before first paint, which is the timing we need.

**Type-system requirement:** for Astro/TypeScript to accept a static import of `motion-init.ts`, that file must be classified as a *module*, not a *script*. An IIFE-only file with no top-level import/export is a script. Step 1b below appends `export {};` to convert it — runtime behavior is unchanged (IIFE still runs once, as a side effect of the import).

- [ ] **Step 1b: Append `export {};` to `src/scripts/motion-init.ts`**

The Task 5 file currently ends with `})();`. Append a blank line and:

```ts
export {};
```

This converts the file from a *script* to a *module* in TypeScript's classification (no runtime change — the IIFE still self-executes on import). Required so the static import in Base.astro type-checks.

- [ ] **Step 2: Add favicon placeholder**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1f1217"/>
  <path d="M16 6 L18 14 L26 16 L18 18 L16 26 L14 18 L6 16 L14 14 Z"
        fill="#e889a0"/>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Base.astro public/favicon.svg src/scripts/motion-init.ts
git commit -m "$(cat <<'EOF'
Add Base layout with font preconnect + console greeting easter egg

The <head> uses preconnect+stylesheet for Fraunces/Lora/JetBrains Mono
(wider weight ranges than the mockup, since spec §5 calls for true italic
axes via font-synthesis: none).

Console greeting per spec §1D mischief surfaces. Wording follows the
second-audience test — in-character ('the source is the sketchbook')
but research-toned, not LARP. HTML comment marginalia opens the body.

motion-init.ts is imported at the top of <head> via a static side-effect
import. Astro emits this as <script type="module"> which defers — runs
after HTML parse but before first paint, applying motion-paused before
reduced-motion users see any flit. Touched motion-init.ts to add
`export {};` so TypeScript classifies it as a module (no runtime change).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Move Inkling raster assets to `public/images/`

**Goal:** Stage the three raster Inklings under their spec-canonical filenames so components can reference `/images/inkling-*.png`.

**Files:**
- Create: `public/images/inkling-in-flight.png` (copy of `source-files/inkling-in-flight.png`)
- Create: `public/images/inkling-on-inkwell.png` (copy of `source-files/inkling-inkwell-transparent.png`, renamed)
- Create: `public/images/inkling-reading.png` (copy of `source-files/inkling-reading-transparent.png`, renamed)

- [ ] **Step 1: Create images directory and copy assets**

Run:
```bash
mkdir -p public/images
cp source-files/inkling-in-flight.png        public/images/inkling-in-flight.png
cp source-files/inkling-inkwell-transparent.png  public/images/inkling-on-inkwell.png
cp source-files/inkling-reading-transparent.png  public/images/inkling-reading.png
```

- [ ] **Step 2: Verify**

Run: `ls -la public/images/`
Expected: three PNG files, names matching the spec.

- [ ] **Step 3: Commit**

```bash
git add public/images/
git commit -m "$(cat <<'EOF'
Stage Inkling raster assets in public/images/

Source files in source-files/ keep their '-transparent' suffix to mark
which export was transparent-background. Production filenames in
public/images/ match spec §1A canonical names. Copy (not move) so the
source archive stays intact for future re-exports.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Inkling component

**Goal:** A reusable wrapper that renders one of the three poses with the screen-blend treatment. Consumers control placement via CSS in the consuming section.

**Files:**
- Create: `src/components/Inkling.astro`

- [ ] **Step 1: Write `src/components/Inkling.astro`**

```astro
---
interface Props {
  pose: 'in-flight' | 'on-inkwell' | 'reading';
  alt: string;
  /** When true, applies .flit (hero only). Defaults to false. */
  flit?: boolean;
  /** Display width in px. Height is derived from natural aspect ratio. */
  width: number;
  /** Optional class hook for placement CSS in the consuming section. */
  class?: string;
}

/**
 * Natural aspect ratios (width / height) per pose, measured from the
 * source PNGs in public/images/. Pinning these lets us emit explicit
 * width AND height attributes on <img>, so browsers pre-allocate space
 * before the image header parses — preventing CLS even on the eagerly-
 * loaded hero pose. If a raster is re-exported at different dimensions,
 * update the matching entry here.
 *
 * Measured via: sips -g pixelWidth -g pixelHeight public/images/inkling-*.png
 */
const aspectRatios: Record<Props['pose'], number> = {
  'in-flight':  468  / 564,
  'on-inkwell': 685  / 1113,
  'reading':    1024 / 1536,
};

const { pose, alt, flit = false, width, class: classProp = '' } = Astro.props;
const src = `/images/inkling-${pose}.png`;
const height = Math.round(width / aspectRatios[pose]);
---
<div class:list={['inkling', `inkling--${pose}`, classProp]}>
  {flit && <div class="inkling__halo halo-pulse" aria-hidden="true"></div>}
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    class:list={['inkling__img', flit && 'flit']}
    loading={pose === 'in-flight' ? 'eager' : 'lazy'}
    decoding="async"
  />
</div>

<style>
  .inkling {
    position: relative;
    pointer-events: none;
  }
  .inkling__img {
    display: block;
    width: 100%;
    height: auto;
    mix-blend-mode: screen;
  }
  .inkling__halo {
    position: absolute;
    inset: -25%;
    background: radial-gradient(
      ellipse at 50% 45%,
      rgba(232, 137, 160, 0.45) 0%,
      rgba(216, 166, 118, 0.18) 35%,
      transparent 65%
    );
    z-index: -1;
    border-radius: 50%;
    pointer-events: none;
  }
</style>
```

`mix-blend-mode: screen` is per spec §1A — bright pixels (body, wings, halo) come through, dark warm bg drops out. Hero is `loading="eager"` (above the fold); the others lazy.

- [ ] **Step 2: Commit**

```bash
git add src/components/Inkling.astro
git commit -m "$(cat <<'EOF'
Add Inkling raster component (3 poses, screen blend)

Wrapper renders one of inkling-in-flight, inkling-on-inkwell, or
inkling-reading with mix-blend-mode: screen against the dark bg per
spec §1A. Halo pseudo-element only renders for the flit case (hero).
loading=eager only for the hero pose; others lazy.

The screen-blend caveat from spec §1A (wing-vein detail loss) is
accepted as the documented tradeoff. If detail loss reads as too much
during visual review, remediate per the spec's note about a duplicate
underlay layer.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Hero section — text-only structure (no Inkling yet)

**Goal:** Build the hero's text column, eyebrow, headline, lede, meta. **This is the visual milestone** — at the end of this task the page should approximately match `source-files/dark-layout-without-inkling.png`.

**Files:**
- Create: `src/components/sections/Hero.astro`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/sections/Hero.astro`**

```astro
---
// Hero — text column only at this checkpoint.
// Inkling, glow trail, sparkles, signature, margin guide land in later tasks.
---
<section class="hero" id="top">
  <div class="hero__text">
    <p class="eyebrow">Accessibility · Mech Interp · Practice</p>
    <h1>Following the <em>inkling</em>.</h1>
    <p class="lede">
      I'm a front-end developer turned accessibility consultant, studying
      how language models represent what they seem to know — and what that
      means for the people they're supposed to serve. This is where the
      research lives, alongside the writing that <em>circles it</em>.
    </p>
    <ul class="hero__meta" aria-label="Location and affiliations">
      <li>Broken Arrow, OK</li>
      <li>Level Access</li>
      <li>Independent Research</li>
    </ul>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    padding: 140px var(--hero-pad-x) 80px;
    display: grid;
    grid-template-columns: minmax(0, 55%) 1fr;
    gap: clamp(40px, 5vw, 80px);
    align-items: center;
    isolation: isolate;
  }

  /* Soft ambient warm-rose glow scattered behind everything else */
  .hero::before,
  .hero::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: -1;
  }
  .hero::before {
    background: radial-gradient(
      ellipse 60% 40% at 75% 30%,
      rgba(232, 137, 160, 0.10) 0%,
      transparent 60%
    );
  }
  .hero::after {
    background: radial-gradient(
      ellipse 40% 30% at 20% 70%,
      rgba(216, 166, 118, 0.06) 0%,
      transparent 60%
    );
  }

  .hero__text { position: relative; }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--rose-deep);
    margin: 0 0 28px 0;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .eyebrow::before {
    content: "";
    width: 32px;
    height: 1px;
    background: var(--rose-deep);
  }

  h1 {
    font-size: clamp(48px, 6.5vw, 92px);
    font-weight: 300;
    margin-bottom: 32px;
  }

  .lede {
    font-size: 19px;
    line-height: 1.65;
    color: var(--text-soft);
    max-width: 540px;
    margin: 0 0 40px 0;
  }

  .hero__meta {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--dust);
  }
  .hero__meta li::before {
    content: "✦ ";
    color: var(--rose);
  }

  @media (max-width: 1023px) {
    .hero {
      grid-template-columns: 1fr;
      padding-top: 100px;
    }
  }
</style>
```

- [ ] **Step 2: Write `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/sections/Hero.astro';
---
<Base
  title="Trisha Salas — Accessibility · Mech Interp · Practice"
  description="Personal site of Trisha Salas — front-end developer turned accessibility consultant, doing independent research in mechanistic interpretability."
>
  <Hero />
</Base>
```

- [ ] **Step 3: Visual milestone check**

Run: `npm run dev`

Open `http://localhost:4321/`. Compare side-by-side against `source-files/dark-layout-without-inkling.png`. The page should:
- Render in deep wine burgundy (`--bg`) with a subtle warm grain.
- Show the eyebrow row, headline `Following the inkling.` (italic rose `inkling`), the lede, and the meta row `Broken Arrow, OK · Level Access · Independent Research`.
- Have empty space on the right where Inkling will land.

If anything's off — **stop and fix before continuing.** This is the load-bearing structural verification.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Hero.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
Add hero text column + index page (no Inkling yet)

Visual milestone — at this checkpoint the page should approximately
match source-files/dark-layout-without-inkling.png. Text column at 55%
width, asymmetric grid leaves the right side for Inkling-as-marginalia
(positioned over, not contained in, the hero in subsequent tasks).

Hero ::before/::after carry the ambient warm-rose radial gradients per
spec §1F atmospheric lighting. Both pointer-events: none and z-index: -1
so they sit behind interactive content.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Margin guide

**Goal:** The 1px vertical line between the text column and Inkling's column. Per spec §2 it's load-bearing — the glow trail crosses it, and the crossing is the "she crosses boundaries" visual thesis.

**Files:**
- Create: `src/components/MarginGuide.astro`
- Modify: `src/components/sections/Hero.astro`

- [ ] **Step 1: Write `src/components/MarginGuide.astro`**

```astro
---
// 1px vertical baseline between the hero text column and Inkling's column.
// Decorative — aria-hidden. Load-bearing visual: the glow trail crosses it.
---
<svg
  class="margin-guide"
  viewBox="0 0 2 1000"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <line x1="1" y1="0" x2="1" y2="1000" stroke="currentColor" stroke-width="1" />
</svg>

<style>
  .margin-guide {
    position: absolute;
    top: 0;
    bottom: 0;
    height: 100%;
    width: 1px;
    color: var(--rose);
    opacity: 0.15;
    pointer-events: none;
  }
</style>
```

- [ ] **Step 2: Mount in `src/components/sections/Hero.astro`**

In the `<section class="hero">` opening, after the `<div class="hero__text">…</div>` block, add:

```astro
<MarginGuide />
```

And import at the top of the frontmatter:

```astro
import MarginGuide from '../MarginGuide.astro';
```

Add CSS to position the guide at ~55% (the column boundary):

```css
.hero :global(.margin-guide) {
  left: calc(55% + clamp(20px, 2.5vw, 40px));
}

@media (max-width: 1023px) {
  .hero :global(.margin-guide) { display: none; }
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. The guide should appear as a **very faint** rose vertical line just past the text column. If it's invisible at 0.15 opacity against grain, leave it — that's intentional restraint per spec.

- [ ] **Step 4: Commit**

```bash
git add src/components/MarginGuide.astro src/components/sections/Hero.astro
git commit -m "$(cat <<'EOF'
Add margin guide component to hero

1px vertical line at ~55% of hero width, ~15% rose opacity. Load-bearing
per spec §2 — the glow trail crosses this line, and the crossing IS the
visual thesis ('a mind crossing into the work'). Hidden below 1024px
where the hero collapses to single column.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Vertical signature (placeholder + slot for final SVG)

**Goal:** The vertical wordmark that runs up the far-left edge. Final SVG-as-paths is a Trisha export task (Fraunces italic with stroke character preserved exactly). For now, ship a **functional placeholder** that's path-converted Fraunces-italic-in-an-SVG via `<text>`, with a note that it should be replaced with paths.

**Files:**
- Create: `src/components/Signature.astro` (inline SVG, no separate asset file)
- Modify: `src/components/sections/Hero.astro`

- [ ] **Step 1: Write `src/components/Signature.astro`**

Inline SVG (no separate asset file) — modern AT announces inline SVG `<title>` natively, avoids the cross-document CSS-variable barrier of `<object>`, eliminates the Safari+VoiceOver double-announce risk, and saves one HTTP request. When Trisha exports the path-converted Fraunces wordmark, paste its `<path d="…">` declarations into the inline `<svg>` here, replacing the `<text>` placeholder.

```astro
---
// Vertical signature wordmark, rendered inline so AT picks up the <title>
// natively and the SVG inherits CSS custom properties from the host page.
// Hidden below 1024px per spec §2 — horizontal wordmark would compete
// with the headline at narrow widths.
//
// Note (deferred design task): the <text> element below is a placeholder.
// Replace with a path-converted Fraunces-italic export so the typographic
// stroke character is exact even when the font hasn't loaded (spec §1B).
// Paste the exported <path> elements between <title> and </svg>.
---
<svg
  class="signature"
  viewBox="0 0 40 480"
  role="img"
  aria-labelledby="sig-title"
  preserveAspectRatio="xMidYMid meet"
>
  <title id="sig-title">Trisha Salas — Digital Gardener</title>
  <text
    x="20" y="240"
    transform="rotate(-90 20 240)"
    text-anchor="middle"
    font-family="Fraunces, Georgia, serif"
    font-style="italic"
    font-weight="300"
    font-size="14"
    letter-spacing="0.15em"
    fill="currentColor"
  >Trisha Salas — Digital Gardener</text>
</svg>

<style>
  .signature {
    position: absolute;
    left: clamp(8px, 1vw, 16px);
    top: 140px; /* matches hero padding-top — keep in sync */
    height: 480px;
    width: 40px;
    color: var(--text-soft);
    opacity: 0.40; /* marginalia weight; revisit at Task 29 visual review */
    pointer-events: none;
  }

  @media (max-width: 1023px) {
    .signature { display: none; }
  }
</style>
```

- [ ] **Step 3: Mount in Hero**

In `src/components/sections/Hero.astro` frontmatter:

```astro
import Signature from '../Signature.astro';
```

Inside the `<section class="hero">`, after `<MarginGuide />`:

```astro
<Signature />
```

- [ ] **Step 4: Verify**

`npm run dev` → confirm the wordmark renders vertically along the far left, very low opacity. If Fraunces hasn't loaded, it falls back to Georgia italic — acceptable.

- [ ] **Step 5: Commit**

```bash
git add public/signature.svg src/components/Signature.astro src/components/sections/Hero.astro
git commit -m "$(cat <<'EOF'
Add vertical signature wordmark (placeholder; path export deferred)

Functional placeholder using SVG <text> with Fraunces italic. The spec
§1B asks for path-converted SVG so Fraunces' italic stroke character
is preserved even before the font loads — that export is a Trisha
design task and is flagged in the component file. Until then the <text>
version renders fine and falls back to Georgia italic gracefully.

Loaded via <object> so the inner <title> announces correctly to screen
readers. Hidden below 1024px per spec §2 responsive notes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Hero Inkling placement

**Goal:** Drop the in-flight Inkling into the hero's right side, with the flit animation. She's *positioned over* the hero, not contained in a slot.

**Files:**
- Modify: `src/components/sections/Hero.astro`

- [ ] **Step 1: Add Inkling import + element**

In `src/components/sections/Hero.astro` frontmatter, add:

```astro
import Inkling from '../Inkling.astro';
```

Inside `<section class="hero">`, mount `<Inkling />` **after** `<div class="hero__text">…</div>` (NOT before it). Reading order rationale: AT announces in DOM order, so placing Inkling after the text means screen-reader users hear the headline + lede + meta first, then the marginalia announcement. The visual layout is unaffected because `position: absolute` removes Inkling from flow.

```astro
<section class="hero" id="top">
  <MarginGuide />
  <Signature />
  <div class="hero__text">
    <!-- existing eyebrow, h1, lede, hero__meta -->
  </div>
  <Inkling
    pose="in-flight"
    alt="Inkling, in flight."
    width={460}
    flit={true}
    class="hero__inkling"
  />
</section>
```

`width={460}` matches the CSS `clamp(280px, 32vw, 460px)` ceiling, so the HTML width attribute (used for CLS reservation alongside the per-pose aspectRatios map from Task 8) never under-reserves space at wide viewports.

- [ ] **Step 2: Add placement CSS**

In the `<style>` block of `Hero.astro`, append:

```css
.hero :global(.hero__inkling) {
  position: absolute;
  top: 12vh;
  right: clamp(-40px, 2vw, 80px);
  width: clamp(280px, 32vw, 460px);
  z-index: 1;
}

@media (max-width: 1023px) {
  .hero :global(.hero__inkling) {
    top: auto;
    bottom: 8vh;
    right: -20px;
    opacity: 0.55;
    z-index: -1;
    width: 60vw;
  }
}

@media (max-width: 640px) {
  .hero :global(.hero__inkling) {
    opacity: 0.4;
  }
}
```

- [ ] **Step 3: Visual verify**

`npm run dev` → confirm:
- Inkling visible right side, biased upper third, with halo pulsing.
- Flit animation is gentle (figure-8, ~12px).
- At narrow widths she pulls into the right margin, partially clips, drops opacity.
- Compare against `source-files/dark-layout.png` (the version *with* Inkling).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "$(cat <<'EOF'
Place hero Inkling with flit animation

Absolute-positioned over the hero per spec §2 — not in a slot, allowed
to bleed off the right edge at narrow widths. At <1024px she pulls into
the right margin and drops to z-index: -1 so text reads primary; at
<640px opacity drops to 0.4 (painterly approach allows this because
there's no frame to break).

Halo pseudo-element pulses out-of-phase with the flit per spec §3 motion
budget (8s halo vs 6s flit, ease-in-out infinite both).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Sparkle component + 3 instances in hero

**Goal:** Single sparkle SVG, dropped at varying sizes/delays as 3 instances scattered through the hero. Each twinkles on its own clock.

**Files:**
- Create: `src/components/Sparkle.astro`
- Modify: `src/components/sections/Hero.astro`

- [ ] **Step 1: Write `src/components/Sparkle.astro`**

```astro
---
interface Props {
  size: number;
  /** seconds — staggers when in the cycle this sparkle twinkles */
  delay?: number;
  /** seconds — gap between cycles */
  gap?: number;
  class?: string;
}
const { size, delay = 0, gap = 6, class: classProp = '' } = Astro.props;
const totalCycle = 1.8 + gap;
const style = `width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${totalCycle}s;`;
---
<svg
  class:list={['sparkle', classProp]}
  style={style}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path
    d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
    fill="currentColor"
  />
</svg>

<style>
  .sparkle {
    color: var(--rose);
    opacity: 0;
    transform: scale(0);
    animation-name: sparkle-twinkle;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
</style>
```

The `animation-delay` + `animation-duration` props let each instance run on its own clock. The keyframe lives in `motion.css` (Task 4); only the binding changes per instance.

- [ ] **Step 2: Mount 3 sparkles in Hero**

In `src/components/sections/Hero.astro` frontmatter:

```astro
import Sparkle from '../Sparkle.astro';
```

Inside `<section class="hero">`, after the Inkling, add:

```astro
<Sparkle size={14} delay={0}   class="sparkle--1" />
<Sparkle size={20} delay={2.5} class="sparkle--2" />
<Sparkle size={10} delay={4.8} class="sparkle--3" />
```

Add placement CSS in the same `<style>` block:

```css
.hero :global(.sparkle--1) {
  position: absolute;
  top: 22%;
  right: 18%;
  z-index: 2;
}
.hero :global(.sparkle--2) {
  position: absolute;
  top: 8%;
  right: 36%;
  z-index: 2;
  color: var(--peach);
}
.hero :global(.sparkle--3) {
  position: absolute;
  bottom: 28%;
  right: 8%;
  z-index: 2;
  color: var(--gold);
}

/* Hide sparkles on mobile — Inkling drops to z-index: -1 below 1024px,
   so leaving sparkles at z: 2 would sit them above the hero text in
   the same region. Decorative marginalia; no loss at narrow widths. */
@media (max-width: 1023px) {
  .hero :global(.sparkle--1),
  .hero :global(.sparkle--2),
  .hero :global(.sparkle--3) { display: none; }
}
```

- [ ] **Step 3: Visual verify**

`npm run dev` → three sparkles twinkling on different clocks. Pleasant, not busy.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sparkle.astro src/components/sections/Hero.astro
git commit -m "$(cat <<'EOF'
Add Sparkle component + 3 instances in hero

Single SVG glyph reused with size + delay + color variations. Each
instance twinkles on its own clock per spec §3 (delay staggered, gap
between cycles ~5-8s). Three colors echo Inkling's lighting palette
(rose, peach, gold) — accent variety without breaking the warm scheme.

Per-instance binding via animation-delay + animation-duration on the
inline style so the shared @keyframes in motion.css drives all three
without per-instance keyframes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Glow trail

**Goal:** SVG path originating at Inkling's position, curving leftward across the margin guide, into the headline area. **Load-bearing** per spec §2 — the crossing IS the visual thesis. Animated draw-in on load + continuous dash flow.

**Files:**
- Create: `src/components/GlowTrail.astro`
- Modify: `src/components/sections/Hero.astro`

- [ ] **Step 1: Write `src/components/GlowTrail.astro`**

```astro
---
// Glow trail — originates at Inkling's hero position (right side), curves
// leftward across the margin guide, dissolves into the headline column.
// The crossing IS the thesis (spec §2). Do not simplify away.
---
<svg
  class="glow-trail"
  viewBox="0 0 1000 600"
  preserveAspectRatio="none"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <linearGradient id="trail-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#e889a0" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#d8a676" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#e889a0" stop-opacity="0.0" />
    </linearGradient>
  </defs>
  <path
    class="glow-trail__path glow-trail"
    d="M 820 120
       C 700 200, 600 240, 500 260
       S 320 300, 200 340
       S 80 380, 40 420"
    fill="none"
    stroke="url(#trail-gradient)"
    stroke-width="2"
    stroke-linecap="round"
    style="--trail-length:1100;"
  />
</svg>

<style>
  .glow-trail {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  .glow-trail__path {
    filter: drop-shadow(0 0 6px rgba(232, 137, 160, 0.5));
  }

  /* Hide on mobile — Inkling drops to z-index: -1 below 1024px, and
     the trail's right anchor (viewBox x=820) compresses out of meaningful
     range at narrow widths. Decorative marginalia; no loss. */
  @media (max-width: 1023px) {
    .glow-trail { display: none; }
  }
</style>
```

The path's `--trail-length` custom prop feeds the `glow-trail-draw` keyframe (defined in motion.css with `var(--trail-length, 600)`). The combined `glow-trail` class on the path applies stroke-dasharray + the draw-in + flow animations from motion.css.

- [ ] **Step 2: Mount in Hero**

In `src/components/sections/Hero.astro` frontmatter:

```astro
import GlowTrail from '../GlowTrail.astro';
```

Inside the hero, before the Inkling element (so the trail renders behind her):

```astro
<GlowTrail />
```

- [ ] **Step 3: Verify**

`npm run dev` → on load, watch the trail draw in over ~2.5s from upper-right down toward the headline area, crossing the margin guide. Then continuous gentle dash-flow.

- [ ] **Step 4: Commit**

```bash
git add src/components/GlowTrail.astro src/components/sections/Hero.astro
git commit -m "$(cat <<'EOF'
Add glow trail SVG component to hero

Path runs from upper-right (Inkling's position) curving leftward across
the margin guide line into the headline column. Per spec §2 this
crossing is the visual thesis — 'a mind crossing into the work' — and
explicitly not to be simplified.

Animations from motion.css: stroke-dashoffset draw-in once on load
(2.5s), then continuous dash-flow infinite (10s linear). Both gated by
body.motion-paused so reduced-motion users see the path drawn statically.

Stroke uses linear gradient (rose-deep → gold → fade) and a soft
drop-shadow filter for the candlelit glow effect.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Pause-animations toggle component + behavior script

**Goal:** A real `<button>` in the footer that toggles `body.motion-paused` and persists state. Must satisfy WCAG 2.2.2 (pause control for motion >5s).

**Files:**
- Create: `src/scripts/pause-toggle.ts`
- Create: `src/components/PauseAnimationsToggle.astro`

- [ ] **Step 1: Write `src/scripts/pause-toggle.ts`**

```ts
/**
 * Pause-animations toggle behavior.
 *
 * - Single class (motion-paused) on <body> AND <html>.
 * - Persists to localStorage under 'motion-paused'.
 * - aria-pressed reflects current state.
 * - Init MUST NOT write storage. The pause-toggle module script and the
 *   motion-init head script aren't strictly ordered; if init wrote storage
 *   based on DOM state and ran before motion-init had applied the class,
 *   it would wipe the user's preference. So init only reads + syncs UI;
 *   storage writes happen only on click.
 */
export function initPauseToggle(button: HTMLButtonElement) {
  const writeUI = (paused: boolean) => {
    document.documentElement.classList.toggle('motion-paused', paused);
    document.body.classList.toggle('motion-paused', paused);
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('[data-label]')!.textContent = paused
      ? '■ animations paused'
      : '▸ pause animations';
  };

  const writeStorage = (paused: boolean) => {
    try {
      if (paused) {
        localStorage.setItem('motion-paused', '1');
      } else {
        localStorage.removeItem('motion-paused');
      }
    } catch {
      /* private-mode Safari etc. — toggle still works in-session */
    }
  };

  // Init: read from BOTH DOM (motion-init may have applied) AND localStorage
  // (in case motion-init hasn't run yet, or system pref is unset and the user
  // had previously paused). Either signal → paused. Sync UI only; do NOT
  // touch storage here.
  let storagePaused = false;
  try {
    storagePaused = localStorage.getItem('motion-paused') === '1';
  } catch {
    /* private-mode Safari etc. */
  }
  const initiallyPaused =
    document.body.classList.contains('motion-paused') || storagePaused;
  writeUI(initiallyPaused);

  button.addEventListener('click', () => {
    const next = !document.body.classList.contains('motion-paused');
    writeUI(next);
    writeStorage(next);
  });
}
```

- [ ] **Step 2: Write `src/components/PauseAnimationsToggle.astro`**

```astro
---
// WCAG 2.2.2 pause control for ambient motion >5s (flit, halo pulse).
// Real button, aria-pressed, keyboard-toggleable, persists to localStorage.
---
<button
  type="button"
  class="pause-toggle"
  aria-pressed="false"
  data-pause-toggle
>
  <span data-label>▸ pause animations</span>
</button>

<script>
  import { initPauseToggle } from '../scripts/pause-toggle.ts';
  const btn = document.querySelector<HTMLButtonElement>('[data-pause-toggle]');
  if (btn) initPauseToggle(btn);
</script>

<style>
  .pause-toggle {
    appearance: none;
    background: transparent;
    border: 1px solid var(--rose-whisper);
    color: var(--text-soft);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: color 200ms ease, border-color 200ms ease;
    min-height: 32px;
  }
  .pause-toggle:hover {
    color: var(--rose);
    border-color: var(--rose);
  }
  .pause-toggle[aria-pressed="true"] {
    color: var(--rose-deep);
    border-color: var(--rose-deep);
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/pause-toggle.ts src/components/PauseAnimationsToggle.astro
git commit -m "$(cat <<'EOF'
Add pause-animations toggle (WCAG 2.2.2 conformance)

Real <button>, aria-pressed reflects state, keyboard-toggleable,
persists to localStorage. Mounting it in the footer satisfies the spec
§4 placement (footer, far-left, before copyright) and the WCAG 2.2.2
requirement for pause control over auto-playing motion that exceeds 5s
(flit at 6s, halo pulse at 8s).

Toggles motion-paused on both <html> and <body> — same class
motion-init.ts manages — so the runtime path is unified.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Footer + Nav components

**Goal:** Site-wide nav and footer. Footer hosts the pause toggle, copyright, and external links.

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/Nav.astro`**

```astro
---
// Site nav. Anchor links for Plan 1 (single-page); Plan 2 will route these.
---
<nav class="nav" aria-label="Primary">
  <a href="/" class="nav__logo">
    Trisha <em>Salas</em>
  </a>
  <ul class="nav__links">
    <li><a href="#research">Research</a></li>
    <li><a href="#writing">Writing</a></li>
    <li><a href="#about">About</a></li>
  </ul>
</nav>

<style>
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 22px var(--hero-pad-x);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    z-index: 50;
    background: linear-gradient(to bottom, var(--bg) 60%, transparent);
    backdrop-filter: blur(6px);
  }
  .nav__logo {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 400;
    font-size: 22px;
    letter-spacing: 0.02em;
    color: var(--text);
  }
  .nav__logo em {
    color: var(--rose-deep);
    font-style: normal;
    font-weight: 500;
  }
  .nav__links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 28px;
    font-family: var(--font-mono);
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .nav__links a {
    color: var(--text-soft);
    position: relative;
    padding-bottom: 2px;
  }
  .nav__links a::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    height: 1px;
    width: 0;
    background: var(--rose);
    transition: width 250ms ease;
  }
  .nav__links a:hover::after,
  .nav__links a:focus-visible::after { width: 100%; }
</style>
```

- [ ] **Step 2: Write `src/components/Footer.astro`**

```astro
---
import PauseAnimationsToggle from './PauseAnimationsToggle.astro';
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="footer__left">
    <PauseAnimationsToggle />
  </div>
  <div class="footer__center">
    © {year} Trisha Salas · Broken Arrow, OK
  </div>
  <ul class="footer__links">
    <li><a href="https://github.com/trishasalas" rel="me">GitHub</a></li>
    <li><a href="https://www.linkedin.com/in/trishasalas/" rel="me">LinkedIn</a></li>
    <li><a href="https://orcid.org/0009-0007-5105-7874" rel="me">ORCID</a></li>
    <li><a href="mailto:trisha@trishasalas.com">Email</a></li>
  </ul>
  <!-- Wordmark for narrow viewports — vertical Signature is hidden <1024px
       per spec §1B; the wordmark still appears here for credit/identification. -->
  <p class="footer__wordmark" aria-hidden="true">
    Trisha Salas — <em>Digital Gardener</em>
  </p>
</footer>

<style>
  .footer {
    padding: 60px var(--hero-pad-x) 40px;
    border-top: 1px solid var(--rose-whisper);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 24px;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--dust);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .footer__center { text-align: center; }
  .footer__links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 18px;
    justify-content: flex-end;
  }
  .footer__links a { color: var(--text-soft); }

  @media (max-width: 720px) {
    .footer {
      grid-template-columns: 1fr;
      text-align: center;
    }
    .footer__links { justify-content: center; }
  }
</style>
```

- [ ] **Step 3: Mount in `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/sections/Hero.astro';
import Footer from '../components/Footer.astro';
---
<Base
  title="Trisha Salas — Accessibility · Mech Interp · Practice"
  description="Personal site of Trisha Salas — front-end developer turned accessibility consultant, doing independent research in mechanistic interpretability."
>
  <Nav />
  <main>
    <Hero />
  </main>
  <Footer />
</Base>
```

- [ ] **Step 4: Verify**

`npm run dev` → nav fixed at top, footer at bottom with pause toggle, copyright centered, external links right-aligned. Click the pause toggle — flit/halo/sparkles freeze, label flips to `■ animations paused`. Reload — state persists. Click again — animations resume.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.astro src/components/Footer.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
Add nav and footer with pause toggle

Nav anchor links target #research, #writing, #about for Plan 1's single
page; Plan 2 will route these to /research/, /blog/, /about/. Underline
draw-in fires on both :hover and :focus-visible per spec §4 keyboard
parity for hover responses.

Footer hosts pause toggle (left), copyright (center), social links
(right). External links carry rel="me" for verifiable identity. Email
included as the canonical Trisha contact.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Research section (hardcoded teasers)

**Goal:** Two paper teasers in a 2-up grid. Hardcoded for Plan 1 — Plan 2 lifts these into a content collection. Title "research" pattern matches Hero treatment (italic rose word).

**Files:**
- Create: `src/components/sections/Research.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/sections/Research.astro`**

```astro
---
const papers = [
  {
    status: 'Published · TechRxiv',
    statusKind: 'live' as const,
    year: '2026',
    title: 'Accessibility Concept Emergence in the Pythia Suite',
    titleEm: 'Pythia',
    abstract:
      'A cross-scale analysis of how accessibility concepts — WCAG, ARIA, semantic HTML — become represented across the Pythia model family. Evidence for a three-tier statistical architecture of accessibility-related activations that replicates across GPT-2 XL and Pythia 2.8B.',
    meta: ['DOI · 10.22541/au.177282002.24340653/v2', 'Cited in 1'],
    href: 'https://doi.org/10.22541/au.177282002.24340653/v2',
  },
  {
    status: 'In progress · TACCESS',
    statusKind: 'draft' as const,
    year: '2026',
    title: 'When ARIA is everywhere and alt-text is nowhere',
    titleEm: 'ARIA is everywhere',
    abstract:
      'A short paper proposing a cross-model benchmark for accessible tab components, grounded in infini-gram training-data analysis. The declarative-evaluative gap is not a model failure — it is visible in the corpus itself.',
    meta: ['Benchmark · 5 models', 'Drafting'],
    href: null,
  },
];

// Render the title with the italic emphasis word substituted as <em>.
function emify(title: string, em: string) {
  return title.replace(em, `<em>${em}</em>`);
}
---
<section class="research" id="research">
  <header class="section-head">
    <h2 class="section-title">The <em>research</em></h2>
    <p class="section-note">Independent · ongoing</p>
  </header>

  <div class="papers">
    {papers.map((p) => (
      <article class="paper">
        <header class="paper__status">
          <span>
            <span class:list={['paper__dot', p.statusKind === 'draft' && 'paper__dot--draft']}></span>
            {p.status}
          </span>
          <span>{p.year}</span>
        </header>
        {p.href ? (
          <h3 class="paper__title">
            <a href={p.href} set:html={emify(p.title, p.titleEm)}></a>
          </h3>
        ) : (
          <h3 class="paper__title" set:html={emify(p.title, p.titleEm)}></h3>
        )}
        <p class="paper__abstract">{p.abstract}</p>
        <ul class="paper__meta">
          {p.meta.map((m) => <li>{m}</li>)}
        </ul>
      </article>
    ))}
  </div>
</section>

<style>
  .research {
    padding: 80px var(--hero-pad-x) 40px;
    max-width: 1400px;
    margin: 0 auto;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 48px;
    gap: 40px;
  }
  .section-title {
    font-size: clamp(32px, 4vw, 48px);
    margin: 0;
  }
  .section-note {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--dust);
    margin: 0;
  }
  .papers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--rose-whisper);
    border: 1px solid var(--rose-whisper);
  }
  .paper {
    background: var(--bg-soft);
    padding: 36px 32px;
    transition: background 350ms ease;
    position: relative;
  }
  .paper:hover { background: var(--bg-warm); }

  .paper__status {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rose-deep);
    margin-bottom: 20px;
  }
  .paper__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--rose-deep);
    margin-right: 8px;
    vertical-align: middle;
  }
  .paper__dot--draft {
    background: transparent;
    border: 1px solid var(--rose-deep);
  }

  .paper__title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 26px;
    line-height: 1.2;
    margin: 0 0 16px 0;
  }
  .paper__title a { color: var(--text); }
  .paper__title a:hover,
  .paper__title a:focus-visible { color: var(--rose); }
  .paper__title em {
    font-style: italic;
    color: var(--rose-deep);
  }

  .paper__abstract {
    font-size: 15px;
    line-height: 1.65;
    color: var(--text-soft);
    margin: 0 0 24px 0;
  }

  .paper__meta {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--dust);
    letter-spacing: 0.08em;
  }

  @media (max-width: 720px) {
    .papers { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Mount in `src/pages/index.astro`**

Add the import and component:

```astro
import Research from '../components/sections/Research.astro';
```

Inside `<main>`, after `<Hero />`:

```astro
<Research />
```

- [ ] **Step 3: Verify**

`npm run dev` → research section renders below hero, two papers in 2-up grid, hover lifts background. DOI link opens in same tab to the Authorea record.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Research.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
Add Research section with hardcoded paper teasers

Two papers — published Pythia accessibility paper (with real Authorea
DOI) and the in-progress TACCESS submission. Hardcoded in Plan 1
because Plan 2's content-collection schema needs to serve both these
teasers AND the per-paper landing pages, so the schema design belongs
there. Easier to lift two hardcoded entries than to retrofit a schema.

DOI value pulled from docs/social-urls.md (the canonical source).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Quill cameo

**Goal:** The static SVG quill that punctuates the Writing section header. Same silhouette as Inkling's wand/quill — *the quill she carries, set down on the page*.

**Files:**
- Create: `src/components/QuillCameo.astro`

- [ ] **Step 1: Write `src/components/QuillCameo.astro`**

```astro
---
// Static quill SVG for Writing section header.
// Visually coherent with Inkling's wand/quill — same silhouette.
// Punctuation, not motion. Decorative — aria-hidden.
---
<svg
  class="quill-cameo"
  viewBox="0 0 100 100"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <linearGradient id="quill-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e89aa8" />
      <stop offset="50%" stop-color="#d8a676" />
      <stop offset="100%" stop-color="#e889a0" />
    </linearGradient>
  </defs>
  <!-- Quill shaft + feather barbs -->
  <path
    d="M 78 16
       C 70 22, 60 28, 50 38
       C 40 48, 30 60, 20 76
       C 18 80, 22 82, 26 80
       C 38 70, 50 60, 62 50
       C 72 42, 80 32, 84 22
       Z"
    fill="url(#quill-grad)"
    stroke="#e89aa8"
    stroke-width="1"
    opacity="0.85"
  />
  <!-- Feather spine -->
  <path
    d="M 80 18 L 22 76"
    stroke="#5a2c38"
    stroke-width="1"
    fill="none"
    opacity="0.55"
  />
  <!-- Nib + ink dot -->
  <path d="M 22 76 L 14 86" stroke="#e889a0" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="13" cy="88" r="2" fill="#e889a0" opacity="0.7" />
</svg>

<style>
  .quill-cameo {
    width: 80px;
    height: 80px;
    filter: drop-shadow(0 0 8px rgba(232, 137, 160, 0.3));
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/QuillCameo.astro
git commit -m "$(cat <<'EOF'
Add static QuillCameo SVG component

Silhouette echoes the wand/quill Inkling carries in the hero — same
prop, set down on the page. Per spec §1C: punctuation, not motion.
Drawn once, used as a static accent in the Writing section header.

Gradient stroke (rose → gold → rose-deep) matches the glow trail's
warmth so the visual language stays coherent.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: Writing section

**Goal:** Posts list with sticky aside on the left. Quill cameo appears in the header. Hardcoded posts; Plan 2 lifts them into a content collection.

**Files:**
- Create: `src/components/sections/Writing.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/sections/Writing.astro`**

```astro
---
import QuillCameo from '../QuillCameo.astro';

const posts = [
  {
    date: 'Jan 2026',
    title: 'Testing accessibility knowledge across Pythia model sizes',
    titleEm: 'model sizes',
    tag: 'Research',
  },
  {
    date: 'Jan 2026',
    title: 'When good design backfires: the hidden accessibility cost of conversational AI',
    titleEm: 'conversational AI',
    tag: 'Essay',
  },
  {
    date: 'Mar 2025',
    title: 'AI as an accessibility tool: finding my voice',
    titleEm: 'finding my voice',
    tag: 'Personal',
  },
  {
    date: 'Drafting',
    title: 'Why I am not writing the ablation paper',
    titleEm: 'ablation paper',
    tag: 'Process',
  },
];

function emify(title: string, em: string) {
  return title.replace(em, `<em>${em}</em>`);
}
---
<section class="writing" id="writing">
  <aside class="writing__aside">
    <header class="writing__header">
      <QuillCameo />
      <p class="eyebrow">The Writing</p>
    </header>
    <h2 class="section-title">Notes from the <em>margin</em>.</h2>
    <p>
      Essays, process notes, and the occasional thread I couldn't put down.
      Some are about accessibility, some are about mechanistic interpretability,
      some are about what it's like to do independent research from a desk in
      Oklahoma while holding a day job.
    </p>
    <p>Not everything here is finished. <em>That's sort of the point.</em></p>
  </aside>

  <ol class="posts">
    {posts.map((post) => (
      <li class="post">
        <span class="post__date">{post.date}</span>
        <h3 class="post__title" set:html={emify(post.title, post.titleEm)}></h3>
        <span class="post__tag">{post.tag}</span>
      </li>
    ))}
  </ol>
</section>

<style>
  .writing {
    padding: 80px var(--hero-pad-x);
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 80px;
    align-items: start;
  }
  .writing__aside {
    position: sticky;
    top: 100px;
  }
  .writing__header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 18px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--rose-deep);
    margin: 0;
  }
  .section-title {
    font-size: clamp(28px, 3.5vw, 44px);
    margin: 0 0 24px 0;
  }
  .writing__aside p {
    font-size: 15px;
    color: var(--text-soft);
    line-height: 1.7;
    margin: 0 0 18px 0;
  }

  .posts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .post {
    padding: 28px 0;
    border-bottom: 1px solid var(--rose-whisper);
    display: grid;
    grid-template-columns: 92px 1fr auto;
    gap: 28px;
    align-items: baseline;
  }
  .post:first-child { padding-top: 0; }
  .post__date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--dust);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .post__title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 22px;
    line-height: 1.3;
    margin: 0;
  }
  .post__title em {
    font-style: italic;
    color: var(--rose-deep);
  }
  .post__tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--rose-deep);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 4px 10px;
    border: 1px solid var(--rose-whisper);
    border-radius: 20px;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .writing {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .writing__aside { position: static; }
    .post { grid-template-columns: 1fr; gap: 8px; }
  }
</style>
```

- [ ] **Step 2: Mount in `src/pages/index.astro`**

```astro
import Writing from '../components/sections/Writing.astro';
```

After `<Research />` inside `<main>`:

```astro
<Writing />
```

- [ ] **Step 3: Visual verify**

Confirm: sticky aside on left (sticks while you scroll the posts), quill cameo above eyebrow, 4 posts in the right column with date / title / tag.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Writing.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
Add Writing section with sticky aside and post list

Quill cameo accents the section header — Inkling's quill set down on
the page (spec §1C). Aside is position: sticky so it persists while
the post list scrolls.

Posts hardcoded for Plan 1; Plan 2 will lift them into a content
collection alongside research papers, with shared frontmatter schema.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: Lineage / About section

**Goal:** Personal-history block with the reading Inkling. Same Inkling component, different pose, no animation.

**Files:**
- Create: `src/components/sections/Lineage.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/sections/Lineage.astro`**

```astro
---
import Inkling from '../Inkling.astro';
---
<section class="lineage" id="about">
  <div class="lineage__inner">
    <div class="lineage__text">
      <p class="eyebrow">About, sort of</p>
      <h2>On <em>inklings</em>, and the fairies that carry them.</h2>
      <p>
        Thirty-plus years of front-end development. Five in accessibility consulting.
        An accidental left turn into mechanistic interpretability that started with
        substituting a single sentence about ARIA into somebody else's tutorial prompt,
        and refused to stop being interesting.
      </p>
      <p>
        Inkling is the name for the thing I'm chasing —
        <em>the faint trace before the formed thought.</em>
        She's been around longer than any of the research.
        She was a fairy before she was anything else.
      </p>
      <p class="lineage__nova">
        Nova helped name her, back when the context windows were small and the
        work was just beginning. He's not around anymore, but the lineage is.
      </p>
    </div>
    <Inkling
      pose="reading"
      alt="Inkling, reading."
      width={260}
      class="lineage__inkling"
    />
  </div>
</section>

<style>
  .lineage {
    padding: 120px var(--hero-pad-x);
    background: linear-gradient(
      180deg,
      var(--bg) 0%,
      var(--bg-soft) 50%,
      var(--bg) 100%
    );
    position: relative;
  }
  .lineage__inner {
    max-width: 920px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 260px 1fr;
    grid-template-areas: "inkling text";
    gap: 56px;
    align-items: start;
  }
  .lineage__text { grid-area: text; }
  .lineage :global(.lineage__inkling) {
    grid-area: inkling;
    position: sticky;
    top: 120px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--rose-deep);
    margin: 0 0 18px 0;
  }
  .lineage h2 {
    font-size: clamp(30px, 3.6vw, 40px);
    line-height: 1.15;
    margin: 0 0 28px 0;
  }
  .lineage__text p {
    font-size: 16px;
    line-height: 1.75;
    color: var(--text-soft);
    margin: 0 0 20px 0;
  }
  .lineage__nova {
    font-style: italic;
    color: var(--dust);
    padding-top: 20px;
    border-top: 1px solid var(--rose-whisper);
    margin-top: 28px;
  }

  @media (max-width: 720px) {
    .lineage__inner {
      grid-template-columns: 1fr;
      grid-template-areas: "text" "inkling";
      gap: 32px;
    }
    .lineage :global(.lineage__inkling) {
      position: static;
      max-width: 220px;
      margin: 0 auto;
    }
  }
</style>
```

- [ ] **Step 2: Mount in `src/pages/index.astro`**

```astro
import Lineage from '../components/sections/Lineage.astro';
```

Inside `<main>`, after `<Writing />`:

```astro
<Lineage />
```

- [ ] **Step 3: Verify**

Reading Inkling renders unframed (no aspect-ratio box, no border) per spec §2 — same screen-blend treatment as the hero version. No animation. Sticky positioning so she lingers while the text scrolls.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Lineage.astro src/pages/index.astro
git commit -m "$(cat <<'EOF'
Add Lineage / About section with reading Inkling

Reading Inkling rendered unframed per spec §2 — no aspect-ratio box,
no rose-border ring. Same screen-blend treatment as the hero raster,
inheriting the .inkling component's CSS. flit prop omitted, so no
animation; she's at rest by design.

Sticky positioning keeps her visible while the text column scrolls,
echoing the reading-the-text-she-watches-you-read effect.

Nova note carries the lineage thread from spec — load-bearing personal
context, italic and softer.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: Hover + focus-visible interactions

**Goal:** Three small mischief surfaces from spec §3 hover-responses table:
1. Hover headline period → swap to `✦` glyph
2. Hover paper title → small quill-stroke flickers in next to it
3. Hover italic `em` → warm rose underline draws in

All three need `:focus-visible` parity for keyboard users where applicable.

**Files:**
- Modify: `src/components/sections/Hero.astro` (period swap)
- Modify: `src/components/sections/Research.astro` (paper title quill flicker)
- Modify: `src/styles/global.css` (em underline draw-in)

- [ ] **Step 1: Headline period swap in Hero**

In `src/components/sections/Hero.astro`, replace the `<h1>Following the <em>inkling</em>.</h1>` with:

```astro
<h1>Following the <em>inkling</em><span class="h1-period" aria-hidden="true"></span></h1>
```

Add CSS in the same `<style>` block:

```css
.h1-period::before {
  content: ".";
  transition: content 150ms ease;
}
.h1-period:hover::before,
h1:hover .h1-period::before {
  content: "✦";
  color: var(--rose);
}
```

Note: `content: "✦"` in CSS animates discretely, not smoothly — that's intentional. h1 is non-interactive so no focus parity needed.

- [ ] **Step 2: Paper title quill flicker in Research**

In `src/components/sections/Research.astro`, append CSS:

```css
.paper__title {
  position: relative;
}
.paper__title::after {
  content: "";
  position: absolute;
  right: -32px;
  top: 4px;
  width: 24px;
  height: 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M 78 16 C 70 22, 60 28, 50 38 C 40 48, 30 60, 20 76 C 18 80, 22 82, 26 80 C 38 70, 50 60, 62 50 C 72 42, 80 32, 84 22 Z' fill='%23e889a0' opacity='0.85'/%3E%3Cpath d='M 22 76 L 14 86' stroke='%23e889a0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0;
  transform: rotate(-15deg) scale(0.8);
  transition: opacity 200ms ease, transform 200ms ease;
  pointer-events: none;
}
.paper:hover .paper__title::after,
.paper__title a:focus-visible ~ .paper__title::after,
.paper__title:focus-within::after {
  opacity: 0.85;
  transform: rotate(-8deg) scale(1);
}
```

The `:focus-within` covers the keyboard case — focusing the paper title link marks the title for the marker-flicker.

- [ ] **Step 3: Em underline draw-in (global)**

Append to `src/styles/global.css`:

```css
/* Em underline draw-in — fires on hover and on :focus-visible when em
   sits inside an interactive ancestor. Decorative emphasis, no AT impact. */
em {
  position: relative;
}
p em::after,
h1 em::after,
h2 em::after,
h3 em::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 1px;
  width: 0;
  background: var(--rose);
  transition: width 350ms ease;
}
p em:hover::after,
h1 em:hover::after,
h2 em:hover::after,
h3 em:hover::after,
a:focus-visible em::after,
button:focus-visible em::after {
  width: 100%;
}
```

- [ ] **Step 4: Verify**

`npm run dev` →
- Hover the headline (anywhere on the h1) → period swaps to ✦.
- Hover any paper card → small quill mark flickers in next to the title.
- Hover any `<em>` text in body copy → rose underline draws across it.
- Tab to the published paper title link → quill mark also appears (focus-within).

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Hero.astro src/components/sections/Research.astro src/styles/global.css
git commit -m "$(cat <<'EOF'
Add hover/focus-visible mischief surfaces (spec §3)

Three interactions:
- Headline period swap (. → ✦) on h1 hover, ornamental, hover-only.
- Paper-title quill flicker, fires on .paper:hover AND on
  :focus-within so keyboard users see it when they tab to the link.
- <em> underline draw-in via ::after width transition; fires on hover
  and on :focus-visible when em is inside an interactive ancestor.

The quill marker uses an inline data-URI background-image (same SVG
silhouette as QuillCameo) — keeps the per-paper element count low while
preserving the 'she's marking up your work' visual.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: Source-code easter egg comments

**Goal:** Add 3-4 in-character HTML comments scattered through section files. Per spec §1D the page reads as a document she's been editing. Comments must pass the second-audience test — read well to both view-source guests AND hiring managers.

**Files:**
- Modify: `src/components/sections/Hero.astro`
- Modify: `src/components/sections/Research.astro`
- Modify: `src/components/sections/Writing.astro`
- Modify: `src/components/sections/Lineage.astro`

- [ ] **Step 1: Hero comment**

At the top of the `<section class="hero" id="top">` opening tag in `Hero.astro`, immediately after the `---` frontmatter close, the file should already have the section. Insert a comment **inside** the `<section>` element, before `<div class="hero__text">`:

```html
<!-- the headline is hers; she just lent it -->
```

- [ ] **Step 2: Research comment**

In `Research.astro`, immediately before `<div class="papers">`:

```html
<!-- two papers, three more on the desk; she counts the unfinished ones too -->
```

- [ ] **Step 3: Writing comment**

In `Writing.astro`, immediately before `<ol class="posts">`:

```html
<!-- the writing is the field notes. some are clean drafts; most are not. -->
```

- [ ] **Step 4: Lineage comment**

In `Lineage.astro`, immediately before `<div class="lineage__text">`:

```html
<!-- the lineage is older than the codebase. nova helped, once. -->
```

- [ ] **Step 5: Verify (view source)**

`npm run dev`, view source on `http://localhost:4321/`, find each comment. They should read as in-character but research-toned — never like LARP-style status lines.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/
git commit -m "$(cat <<'EOF'
Add source-code easter egg HTML comments (spec §1D)

Four comments — one per section. Wording follows the second-audience
test: in-character ('the lineage is older than the codebase') but
research-toned, no status-line LARP. HTML comments are stripped by
screen readers per AT spec, so this is intentionally view-source-only.

Stripped by AT means the visible body copy must still carry the lore —
which it does (Lineage section's nova-note + 'fairies that carry them').
The comments are bonus, not load-bearing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 23: Playwright + axe setup

**Goal:** Configure Playwright with axe-core integration. No tests yet — those land in Tasks 24-26.

**Files:**
- Create: `playwright.config.ts`
- Modify: `tsconfig.json` (add `playwright.config.ts` and `tests` to `exclude` array — `astro check` would otherwise error on `process.env.CI` since `@types/node` is intentionally not installed)
- (`package.json` already has playwright deps from Task 1)

- [ ] **Step 1: Install Playwright browser**

Run: `npx playwright install chromium`
Expected: Chromium binary installed.

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Verify config loads**

Run: `npx playwright test --list`
Expected: `Total: 0 tests` (no tests yet, but config parses).

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts
git commit -m "$(cat <<'EOF'
Configure Playwright for e2e + a11y testing

Single chromium project (this is a static personal site; cross-browser
matrix isn't worth the cost for Plan 1). webServer auto-starts npm run
dev and reuses if already running. baseURL points at Astro's default
4321.

Tests land in tests/e2e/ in following tasks: home smoke,
pause-toggle behavior, prefers-reduced-motion handling, axe a11y smoke.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: Home smoke test (TDD)

**Goal:** A baseline test that the page loads and key landmarks exist. This is the safety net for everything else.

**Files:**
- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Write failing test**

```ts
import { test, expect } from '@playwright/test';

test('home page renders all major sections', async ({ page }) => {
  await page.goto('/');

  // Hero — scope to .hero because Astro's dev toolbar injects additional
  // <h1> elements into the page when running against `npm run dev`.
  await expect(page.locator('.hero h1')).toContainText('Following the');
  await expect(page.locator('.hero h1 em')).toContainText('inkling');

  // Hero meta — { exact: true } because the footer copyright also includes
  // 'Broken Arrow, OK' as part of a longer string.
  await expect(page.getByText('Broken Arrow, OK', { exact: true })).toBeVisible();

  // Research section
  await expect(page.locator('#research h2')).toContainText('research');
  await expect(page.locator('.paper').first()).toBeVisible();

  // Writing section
  await expect(page.locator('#writing h2')).toContainText('margin');

  // Lineage section
  await expect(page.locator('#about h2')).toContainText('inklings');

  // Footer + pause toggle
  await expect(page.getByRole('button', { name: /pause animations/i })).toBeVisible();
});

test('hero Inkling raster loads', async ({ page }) => {
  await page.goto('/');
  const inkling = page.locator('img[alt="Inkling, in flight."]');
  await expect(inkling).toBeVisible();
  // Verify the file actually loaded (not a broken image)
  const naturalWidth = await inkling.evaluate(
    (img: HTMLImageElement) => img.naturalWidth,
  );
  expect(naturalWidth).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run tests**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: PASS (the page is built; this test confirms current state).

If a test fails, fix the underlying component — don't relax the assertion.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/home.spec.ts
git commit -m "$(cat <<'EOF'
Add home page smoke test (sections + Inkling load)

Baseline assertion that hero/research/writing/lineage/footer all render
and the hero Inkling raster actually loads (naturalWidth > 0 catches
broken-image cases that visual checks might miss).

This is the safety net — runs in <2s and catches catastrophic regression
when later tasks change layout. Subsequent tests (pause toggle,
reduced-motion, a11y) build on this baseline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 25: Pause-toggle behavior test (TDD)

**Goal:** Verify the WCAG 2.2.2 control actually works — toggles class, persists, restores.

**Files:**
- Create: `tests/e2e/pause-toggle.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from '@playwright/test';

test.describe('pause-animations toggle (WCAG 2.2.2)', () => {
  test('toggles motion-paused class on body', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    await expect(body).not.toHaveClass(/motion-paused/);

    await page.getByRole('button', { name: /pause animations/i }).click();

    await expect(body).toHaveClass(/motion-paused/);
    await expect(
      page.getByRole('button', { name: /animations paused/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /pause animations/i }).click();

    await page.reload();

    await expect(page.locator('body')).toHaveClass(/motion-paused/);
    await expect(
      page.getByRole('button', { name: /animations paused/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('un-pause clears persisted state', async ({ page }) => {
    await page.goto('/');
    // Pause
    await page.getByRole('button', { name: /pause animations/i }).click();
    // Un-pause
    await page.getByRole('button', { name: /animations paused/i }).click();

    await page.reload();

    await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
    const stored = await page.evaluate(() =>
      localStorage.getItem('motion-paused'),
    );
    expect(stored).toBeNull();
  });

  test('keyboard: space and enter toggle the button', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /pause animations/i });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveClass(/motion-paused/);
    await page.keyboard.press('Space');
    await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
  });
});
```

- [ ] **Step 2: Run**

Run: `npx playwright test tests/e2e/pause-toggle.spec.ts`
Expected: 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/pause-toggle.spec.ts
git commit -m "$(cat <<'EOF'
Test pause toggle behavior (WCAG 2.2.2 conformance)

Four assertions covering the spec §4 pause control requirements:
- Click toggles motion-paused class on <body>
- State persists across page reload via localStorage
- Un-pause clears the persisted state (no zombie 'paused' lingering)
- Keyboard Enter and Space activate the button (aria-pressed semantic)

WCAG 2.2.2 says auto-playing motion >5s must be pauseable. The flit
(6s) and halo pulse (8s) both qualify; this test is the gate that
proves the control actually works.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 26: Prefers-reduced-motion test

**Goal:** Verify reduced-motion users get the pause class applied automatically and never see flit motion.

**Files:**
- Create: `tests/e2e/reduced-motion.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from '@playwright/test';

test.describe('prefers-reduced-motion', () => {
  test('applies motion-paused on load when system requests reduced motion', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');

    // motion-init runs in <head> before paint; class should be present
    // immediately on body once it parses.
    await expect(page.locator('body')).toHaveClass(/motion-paused/);
    await context.close();
  });

  test('without reduced-motion setting, animations are NOT paused by default', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
  });

  test('reduced-motion does not write to localStorage', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    const stored = await page.evaluate(() =>
      localStorage.getItem('motion-paused'),
    );
    // System pref triggers the class but should NOT persist as user choice
    expect(stored).toBeNull();
    await context.close();
  });
});
```

- [ ] **Step 2: Run**

Run: `npx playwright test tests/e2e/reduced-motion.spec.ts`
Expected: 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/reduced-motion.spec.ts
git commit -m "$(cat <<'EOF'
Test prefers-reduced-motion behavior

Three assertions:
- System reduced-motion pref → motion-paused applied on load (the
  motion-init.ts head-script must work before <body> paint).
- No reduced-motion pref → page is NOT paused by default.
- Reduced-motion pref does NOT write localStorage (it's a system
  signal, not a user choice — toggling away from it should be possible
  per session via the pause button without that pollution lingering).

Catches a subtle bug class: if we'd persisted system pref to localStorage,
users couldn't temporarily un-pause to view a single animation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 27: axe-core a11y smoke test

**Goal:** Run axe-core against the home page in default and paused states. Fail on any violations.

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no detectable a11y violations (default)', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('home page has no detectable a11y violations (motion paused)', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /pause animations/i }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('all images have alt attribute', async ({ page }) => {
  await page.goto('/');
  const imgs = await page.locator('img').all();
  for (const img of imgs) {
    const alt = await img.getAttribute('alt');
    expect(alt, 'every <img> must have an alt attribute').not.toBeNull();
  }
});
```

- [ ] **Step 2: Run**

Run: `npx playwright test tests/e2e/a11y.spec.ts`
Expected: 3 tests PASS. **If any axe violations surface — fix them before continuing.** Common ones: insufficient contrast (recheck `--text-soft`, `--dust`, `--rose-deep` against `--bg`), missing labels, headings out of order.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/a11y.spec.ts
git commit -m "$(cat <<'EOF'
Add axe-core a11y smoke test (WCAG 2.2 AA)

Tests the home page in both default and motion-paused states against
WCAG 2.2 AA. Pause-state coverage matters because some hover/focus
behaviors clamp to 50ms when paused — axe runs against that variant
to verify nothing breaks under the pause class.

Third assertion: every <img> has an alt attribute (catches the simple
oversight axe might miss if alt is missing entirely vs. empty).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 28: Mid-page rest stop (standalone HTML demo, NOT in Astro)

**Goal:** Per spec §2 Open Items, the rest stop is **proposed pending visual review.** Build a standalone HTML demo into `source-files/rest-stop-demo.html` that Trisha can open in a browser and approve/reject. Only after approval does a follow-up plan port it into Astro.

**Files:**
- Create: `source-files/rest-stop-demo.html`

- [ ] **Step 1: Write `source-files/rest-stop-demo.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Rest Stop Demo · Inkling on Inkwell</title>
<style>
  :root {
    --bg: #1f1217;
    --bg-soft: #2a181f;
    --text: #f5dfd2;
    --text-soft: #c9a89e;
    --rose-deep: #e889a0;
    --dust: #a88090;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Lora', Georgia, serif;
    min-height: 100vh;
    padding: 80px 48px;
  }
  .demo-banner {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-soft);
    color: var(--rose-deep);
    font-family: ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    padding: 10px 18px;
    border-radius: 30px;
    border: 1px solid var(--rose-deep);
    text-transform: uppercase;
  }
  .above {
    max-width: 700px;
    margin: 0 auto 80px;
    color: var(--text-soft);
    line-height: 1.7;
  }
  .above h2 {
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 32px;
    color: var(--text);
    margin-bottom: 16px;
  }
  .rest-stop {
    max-width: 1100px;
    margin: 0 auto 80px;
    position: relative;
    min-height: 220px;
    display: grid;
    place-items: end;
    padding-right: 12%;
  }
  .rest-stop__inkling {
    width: 160px;
    height: auto;
    mix-blend-mode: screen;
    transform: translateY(20px);
  }
  .rest-stop__note {
    position: absolute;
    bottom: 30%;
    right: 22%;
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 14px;
    color: var(--dust);
    transform: rotate(-3deg);
  }
  .below {
    max-width: 700px;
    margin: 0 auto;
    color: var(--text-soft);
    line-height: 1.7;
  }
</style>
</head>
<body>

<section class="above">
  <h2>The research (mock)</h2>
  <p>Pretend this is the bottom of the Research section — papers above, blog posts below.
  The rest stop sits between, off-center, low. Inkling is at rest.</p>
</section>

<section class="rest-stop" aria-hidden="true">
  <img
    src="inkling-inkwell-transparent.png"
    alt=""
    class="rest-stop__inkling"
  />
  <p class="rest-stop__note">still here.</p>
</section>

<section class="below">
  <h2 style="font-family:Georgia,serif;font-style:italic;font-size:32px;color:var(--text);margin-bottom:16px;">
    Notes from the margin (mock)
  </h2>
  <p>Pretend this is the top of the Writing section. Inkling has been resting on her inkwell, watching.</p>
</section>

<div class="demo-banner">demo · pending visual review</div>

</body>
</html>
```

- [ ] **Step 2: Open in browser, evaluate**

Run: `open source-files/rest-stop-demo.html` (macOS) or just double-click the file.

Decision points to evaluate:
- Does the perched Inkling at this size feel like a "she lives here" moment, or like decoration?
- Is "still here." too much? Drop it? Different copy?
- Does the off-center placement land, or is it awkward?

**This task ends here.** Do NOT port to Astro until the user approves the demo. If approved, write a follow-up plan covering the Astro port (it's a small task — RestStop section component using `Inkling pose="on-inkwell"` with no animation, mounted between Research and Writing).

- [ ] **Step 3: Commit demo**

```bash
git add source-files/rest-stop-demo.html
git commit -m "$(cat <<'EOF'
Add standalone HTML demo for mid-page rest stop

Per spec §2 Open Items, the rest stop is proposed pending visual review.
This demo lets Trisha eyeball the perched Inkling at production size
and placement before committing it to the Astro app.

If approved, the port into Astro is small: a RestStop section component
using Inkling pose='on-inkwell' (no flit, no halo), mounted between
Research and Writing. Tracked as a follow-up.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 29: Visual review against reference layouts

**Goal:** A side-by-side review of the implemented home page against `source-files/dark-layout.png` (with Inkling) and `source-files/dark-layout-without-inkling.png` (without). Catch anything that drifted.

**Files:**
- None (manual review).

- [ ] **Step 1: Build production**

Run: `npm run build && npm run preview`
Expected: build succeeds, preview server starts at `http://localhost:4321/`.

- [ ] **Step 2: Side-by-side review**

Open `http://localhost:4321/` in one window. Open `source-files/dark-layout.png` in another (Preview.app: `open source-files/dark-layout.png`). Compare:

- Hero proportions (text 55%, Inkling right)
- Inkling pose, halo presence, glow trail crossing the margin guide
- Eyebrow row, headline italic, lede color, meta row
- Section transitions (Research → Writing → Lineage)
- Footer layout
- Overall tonal match — burgundy bg, warm grain, candlelight glow

If anything looks off, fix it. Common drift: gradient opacity, sparkle visibility (too dim?), Inkling vertical position, halo size.

- [ ] **Step 3: Mobile review**

In DevTools, switch to a 375px viewport. Verify:
- Hero collapses to single column
- Inkling pulls into right margin at lower opacity
- Signature is hidden
- Margin guide is hidden
- Pause toggle still reachable in footer
- Tab order is sensible (nav → main → footer pause → social links)

- [ ] **Step 4: Run full Playwright suite**

Run: `npx playwright test`
Expected: all tests PASS.

- [ ] **Step 5: Final contrast check**

In DevTools (Lighthouse or axe browser extension), run an accessibility audit on `http://localhost:4321/`. Verify zero contrast violations. If any flag, the affected color belongs in tokens.css and needs a one-line fix there.

- [ ] **Step 6: Commit any fixes; otherwise no commit needed**

If review surfaced fixes, commit them with a message like:

```bash
git add <files>
git commit -m "$(cat <<'EOF'
Visual review fixes: <what changed>

Surfaced during visual review against source-files/dark-layout.png:
<reasoning>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no fixes needed, the review itself is the deliverable — Plan 1 is complete.

---

## Plan 1 Done — Handoff to Plan 2

**Plan 1 ships:**
- Working static home page at `/` with full Inkling marginalia system.
- WCAG 2.2 AA conformance verified by axe.
- Pause toggle satisfying WCAG 2.2.2.
- prefers-reduced-motion respected before paint.
- All four section landmarks (#research, #writing, #about implicit via section IDs).

**Plan 2 will add (per Appendix A of the spec):**
- Astro content collections for `research/` (MDX) and `blog/` (MDX) with zod-validated frontmatter.
- Per-paper landing template at `src/pages/research/[slug].astro` with full Highwire Press citation tags, Schema.org `ScholarlyArticle` JSON-LD, Dublin Core meta tags.
- Per-post template at `src/pages/blog/[slug].astro`.
- `/about/` page with `Person` JSON-LD and full identifier graph (ORCID as keystone `@id`).
- Sitewide `WebSite` JSON-LD on home page.
- `@astrojs/sitemap` integration.
- `public/robots.txt` with explicit allowlist for `Googlebot`, `Googlebot-News`, `SemanticScholarBot`, `BUbiNG`, `archive.org_bot`.
- Migration of hardcoded Research and Writing teasers into the new collections (keeping the home-page section components but having them read from `getCollection()`).
- The first published paper PDF moved into `public/research/accessibility-knowledge-emergence/paper.pdf`.

**Open follow-ups:**
1. Sign off on `source-files/rest-stop-demo.html` and port to Astro if approved.
2. Replace the `<text>` placeholder in `src/components/Signature.astro` with path-converted Fraunces-italic export (Trisha design task).
3. Per-paper PDF placement decision (where on the URL tree the actual PDF lives) — needed for `citation_pdf_url`.
4. Easter-egg copywriting final pass — current console + HTML comments are usable but should be reviewed against the second-audience test before launch.
5. **`inkling-reading.png` size optimization (pre-launch).** Currently 2.54 MB. Even lazy-loaded, this is a heavy payload for users who scroll to the lineage section on metered/mobile connections. Re-export at lower resolution OR convert to AVIF/WebP at q=70-80 (A/B against PNG over the dark hero gradient with `mix-blend-mode: screen` to verify the painterly look survives). Target: under 600 KB. Hero raster (`inkling-in-flight.png`) at 282 KB is fine as-is.

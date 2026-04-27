# Inkling Hero Design — trishasalas.com v2

**Date:** 2026-04-26 (revised same day after external feedback pass)
**Status:** Design approved; revisions integrated from spec-feedback.md; pending final user review
**Tech stack:** Astro
**Scope:** Home page hero design + findability metadata strategy. Inner page *layouts* are out of scope (designed separately); inner page *URL structure and metadata* are captured in Appendix A so the implementation plan has them.

---

## Why this exists

`trishasalas.com` is being rebuilt as the personal site of Trisha Salas — a senior front-end developer turned accessibility consultant doing independent research in mechanistic interpretability. The home page needs to carry a specific tension: **structure that reads as serious credibility** while **art that reads as a human mind behind the work**. The brief, distilled from her brainstorming notes: *"independent research with a visible mind behind it."*

The design centers on **Inkling** — a recurring fairy character. Inkling is Trisha's self-portrait: understated but mischievous, modeled in part on Ene from Kagerou Project (a cyber-girl character who lives inside computers and causes playful mischief). Inkling is **not a hero or mascot**. She is a *system that appears across the page* — marginalia, glow trails, quill cameos, easter eggs in the source code. The site is primary; she inhabits it.

Inner pages are deliberately minimal-professional so the whimsy of the home page reads as deliberate rather than tonal.

---

## Design intent (load-bearing)

> **The whimsy is non-negotiable. The defensive structure exists to make the whimsy legible, not to soften it.**

Every constraint in this spec — the minimal-professional inner pages, the explicit enumeration of mischief surfaces, the "Inkling-as-system not hero" framing, the WCAG-conformant pause toggle, the published-research-grade typography — exists to make the painterly hero, the marginalia, and the source-code easter eggs read as *deliberate craft* rather than as decoration that needs forgiving. Inkling is the evidence of a mind, not a flourish. The marginalia *is* the professionalism.

If, during implementation, something looks like it should be "simplified to look more professional," check this section first. The instinct to dismantle whimsy is the failure mode this spec is structured against. The whimsy holds; the seriousness comes from the structure around it.

---

## Section 1 — Asset inventory

### A. Painterly raster Inkling poses

Three poses, three placements across the home page, each characterizing a different state:

| Asset | Pose | Placement | State |
|---|---|---|---|
| `inkling-in-flight.png` | mid-flight, body angled, carrying her wand/quill (which glows warmly — single prop with double meaning: fairy's wand + writer's quill) | Hero, right side | Active mischief |
| `inkling-on-inkwell.png` | perched on inkwell | Mid-page rest stop (between Research and Writing) | *She lives here* |
| `inkling-reading.png` | sitting cross-legged, reading a glowing book | About / lineage section | Inward, contemplative |

**Asset state notes:**
- `inkling-on-inkwell.png` and `inkling-reading.png` already exist as clean transparent assets.
- `inkling-in-flight.png` will be hand-cleaned by Trisha in Figma from the ChatGPT-generated extract (`source-files/inkling-transparent.png`), removing the residual sparkle trail (which would otherwise compete with the animated SVG trail) and cropping tight to her bounding box plus ~60–80px halo padding.
- All three render with `mix-blend-mode: screen` against the dark page background — this lets the dark warm bg of the source images drop out and the bright pixels (body, wings, halo) come through cleanly without requiring pixel-perfect alpha extraction.
- **Wing-vein detail caveat.** `mix-blend-mode: screen` brightens dark pixels toward white, so the dark linework on Inkling's wing veins (visible especially in `inkling-reading.png`) will partially lift toward invisibility against `--bg`. Acceptable tradeoff for the painterly look; if the detail loss reads as too much during implementation, remediate with a duplicate Inkling layer at lower opacity using `mix-blend-mode: normal` underneath the screen-blended primary layer (preserves dark detail while still letting the screen layer do the bright glow work).

### B. Vertical signature wordmark

- **`signature.svg`** — wordmark reading *"Trisha Salas — Digital Gardener"*, set in Fraunces italic, exported as SVG paths (not `<text>`) so the typographic stroke character is preserved exactly. ~40px wide, runs vertically up the far-left edge of the hero.
- The "Digital Gardener" wording is a deliberate nod to Mosslight Nook and Trisha's plant collection — it carries personal meaning, not a generic tagline.
- Inside the SVG: `<title>Trisha Salas — Digital Gardener</title>` so screen readers announce it correctly.

### C. Marginalia primitives (inline `<svg>`, no separate files)

- **Glow trail.** Single SVG path, ~3–5 anchor curve, originating at Inkling's position in the hero and curving leftward toward the headline text — *crossing the margin guide line*. Animated via `stroke-dashoffset` (draw-in on load + continuous gentle dash flow).
- **Sparkle glyph.** A single 4-point star path. Dropped as `<svg>` instances at varying sizes (8–24px) and opacities. 3–5 instances scattered through the hero. Each twinkles on its own clock.
- **Quill cameo.** Small SVG illustration (~80–100px), visually coherent with the wand/quill Inkling carries in the hero (same silhouette, same warm glow tint). Drawn once, used as static accent in the Writing section header — the quill she carries, set down on the page. Punctuation, not motion.
- **Margin guide line.** 1px vertical baseline, ~15% opacity, full-page-height. The glow trail crosses it — that's the "she crosses boundaries" move.

### D. Source-code easter eggs (mischief surfaces)

- **`console.log` greeting** in-character on page load. Single line, witty.
- **HTML comments scattered through the source**, written *as Inkling* (small notes, observations, the occasional unicode doodle). Page reads as a document she's been editing. Literal "magic in the source code." Invisible to screen readers by definition (HTML comments are stripped by AT) — explicitly a view-source easter egg.
- **`@keyframes flit` is real** — the hero Inkling's flit animation (defined in Section 3) is named exactly `flit` to match the layout image's code panel, with a CSS comment over it (haiku or in-character note). The visible "code" in the comp becomes the actual implementation. Same animation, just deliberately named to wink at the source-of-truth.

**Wording standard for the easter eggs (second-audience test).** The console greeting and HTML-comment marginalia must read well to *both* audiences who will find them: (a) the developer-curious reader who view-sources for delight, AND (b) the hiring manager / paper reviewer / grant reader looking at this site after Trisha's CV crosses their desk. Lean toward in-character but research-toned — Inkling commenting on the work being done, the small observations of someone who lives in this codebase — rather than LARP-y status lines like *"wings: deployed, mischief: pending."* The whimsy itself is non-negotiable; the *wording* is. Cost of being misread is asymmetric: it delights some readers and quietly disqualifies others. Draft each line with both audiences imagined.

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
- **Glow trail (SVG)** originates at her position and curves leftward, crossing the margin guide line and entering the headline area. **Load-bearing detail:** this crossing IS the visual thesis statement of the page — *a mind crossing into the work, the character crossing into the research column.* Do not simplify it away during implementation. If something has to be cut for time, cut elsewhere; this stays.
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
- The vertical signature is **hidden on mobile** (< 1024px). Reasoning: at small viewport, a horizontal-flipped signature wordmark competes with the headline for attention; hiding it lets the hero breathe. The wordmark still appears in the page footer for credit/identification.

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
| Hover paper title | small quill-stroke SVG flickers in next to title (same quill silhouette as the cameo and as Inkling carries — *she's marking up your work*), fades on hover-end | Must also fire on `:focus-visible` |
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
    --rose-deep:    #e889a0;  /* bumped from #d97a92 — earlier value sat at ~4.8:1 vs --bg, borderline AA body. This sits comfortably above 5:1. */
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
- `--rose-deep` on `--bg`: expected ~5.5:1, AA body text ✓ (previous `#d97a92` sat at ~4.8:1, borderline; bumped to `#e889a0` in this revision).
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
2. **Final contrast verification** — run an automated checker on the full palette during implementation. Values are designed to pass AA but verify the actual rendered ratios on real type at real sizes.
3. **Easter-egg copywriting** — actual wording for the console.log greeting and HTML-comment marginalia, drafted per the second-audience test (Section 1D). Decide whether to draft now or at implementation time.

**Resolved during this revision** (previously open):
- `inkling-in-flight.png` cleanup ✓ (committed 2ac5f79).
- Mobile signature behavior ✓ (hidden < 1024px, see Section 2 responsive notes).
- `--rose-deep` color ✓ (bumped to `#e889a0`).

## Out of scope

- Inner pages (Research, Writing, About, Notes individual pages) — minimal-professional, designed separately.
- Content management for posts (will be MDX-driven; structure is part of the implementation plan, not this design).
- Analytics, comments, search.
- Animation on the mid-page perched and About/lineage Inklings — both are at rest by design.
- Cursor trail effects — explicitly out of scope (rejected as polarizing and against the "understated" half of the brief).

---

## Appendix A — Findability & Research Metadata

This appendix is a **forward-pointer to the implementation plan**, not a full design. It captures the metadata strategy that the implementation work will execute against. Lives here so it isn't lost between specs.

### Context

Trisha cannot use arXiv (no endorser available for cs.LG / cs.CL submissions). The site itself must do the work that arXiv normally does for academic discoverability: serve as the authoritative landing page for her research, expose machine-readable citation metadata, and connect to the cross-platform identifier graph (ORCID, Google Scholar, Semantic Scholar, DBLP). One paper is already published with a DOI on Authorea/TechRxiv and is already cited in the literature (Dung et al., 2026); two more papers are in progress. The site needs to support this from launch.

### URL structure (locked)

- `/research/<paper-slug>/` — formal paper landing page. One per paper. Stricter metadata, citation tags, direct PDF download, abstract on page.
- `/blog/<post-slug>/` — narrative posts and process notes. Lighter metadata, freer voice. Posts may link to research pages.
- Splitting these namespaces makes Google Scholar's pattern-matching reliable (it expects consistent paper landing-page structure) and keeps blog-style content out of academic crawlers' way.

### Layer 1 — Highwire Press citation tags (per `/research/<slug>/` page)

These are what **Google Scholar actually parses**. Without these, Scholar will not index the page no matter how good other SEO is.

```html
<meta name="citation_title"            content="Accessibility Concept Emergence in the Pythia Suite: Thresholds, Binding, and the Declarative-Evaluative Gap">
<meta name="citation_author"           content="Salas, Trisha">
<meta name="citation_publication_date" content="2026-01-18">
<meta name="citation_pdf_url"          content="https://trishasalas.com/research/accessibility-knowledge-emergence/paper.pdf">
<meta name="citation_abstract_html_url" content="https://trishasalas.com/research/accessibility-knowledge-emergence/">
<meta name="citation_journal_title"    content="TechRxiv">
<meta name="citation_doi"              content="10.22541/au.177282002.24340653/v2">
<meta name="citation_keywords"         content="mechanistic interpretability; accessibility; Pythia; emergence; WCAG; ARIA">
```

### Layer 2 — Schema.org JSON-LD (per `/research/<slug>/` page + sitewide)

`ScholarlyArticle` per paper, with `author` referencing a single `Person` whose `@id` is the ORCID URL. The ORCID URL becoming the canonical `@id` for "Trisha as author" is the keystone — it links every page on this site to her ORCID record, which links out to GS, SS, etc.

Per paper page (sketch):

```json
{
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": "Accessibility Concept Emergence in the Pythia Suite...",
  "datePublished": "2026-01-18",
  "author": {
    "@type": "Person",
    "@id": "https://orcid.org/0009-0007-5105-7874",
    "name": "Trisha Salas",
    "url": "https://trishasalas.com/about/"
  },
  "url": "https://trishasalas.com/research/accessibility-knowledge-emergence/",
  "identifier": "https://doi.org/10.22541/au.177282002.24340653/v2",
  "abstract": "...",
  "keywords": ["mechanistic interpretability", "accessibility", "WCAG", "Pythia"]
}
```

Sitewide `WebSite` JSON-LD on the home page; `Person` JSON-LD on the About page (with `sameAs` pointing to ORCID, GS, SS, DBLP, GitHub, LinkedIn).

### Layer 3 — Dublin Core (per research page)

Cheap to add, broadens reach into library aggregators (BASE) and enrichment pipelines.

```html
<meta name="DC.title"      content="...">
<meta name="DC.creator"    content="Salas, Trisha">
<meta name="DC.date"       content="2026-01-18">
<meta name="DC.identifier" content="https://doi.org/10.22541/au.177282002.24340653/v2">
<meta name="DC.subject"    content="mechanistic interpretability; accessibility; emergence">
<meta name="DC.description" content="...">
<meta name="DC.type"       content="Text">
```

### Sitewide metadata baseline

- **Open Graph** + **Twitter Cards** on every page (title, description, image, URL, type)
- **Canonical URL** on every page
- **`<meta name="robots" content="index, follow">`** by default
- **`sitemap.xml`** auto-generated via `@astrojs/sitemap`
- **`robots.txt`** with explicit allowlist for `Googlebot`, `Googlebot-News`, `SemanticScholarBot`, `BUbiNG` (BASE crawler), `archive.org_bot`

### Per-paper page minimum requirements (Google Scholar inclusion criteria, not optional)

- Paper has its own URL (`/research/<slug>/`), not a query parameter or anchor.
- PDF directly downloadable at the URL given in `citation_pdf_url` (stable; no auth required).
- **Title, author, abstract visible on the landing page in HTML** — not in an image, not in JS-rendered-only content. Astro renders these statically by default, so this is automatic if we put them in the page template.
- ≥100 words of text on the landing page (the abstract + a short summary section easily clears this).
- **Stable URLs.** Scholar caches once and gets sticky. URL changes after indexing cause indexing problems.

### Author identifier graph

ORCID is the keystone — every JSON-LD `Person` and metadata block references `https://orcid.org/0009-0007-5105-7874` as the canonical author `@id`. The other identifiers reference back to it. Source of truth for these values: `docs/social-urls.md`.

| Identifier | Status | Value |
|---|---|---|
| ORCID iD | exists | `0009-0007-5105-7874` |
| Paper #1 DOI (Authorea) | published v2 | `10.22541/au.177282002.24340653/v2` |
| arXiv | account linked to ORCID, no papers yet | (omit `sameAs` entry until first paper is submitted/endorsed) |
| OpenReview profile | exists | `https://openreview.net/profile?id=~Trisha_Salas1` |
| Google Scholar profile | exists, awaiting paper indexing | URL added post-launch once paper is indexed |
| Semantic Scholar Author ID | will auto-populate | claim post-launch |
| GitHub | exists | `trishasalas` (`https://github.com/trishasalas`) |
| LinkedIn | exists | `https://www.linkedin.com/in/trishasalas/` |
| DBLP | n/a | add only if peer-reviewed publication lands |

**Open question to resolve before launch:** the Authorea DOI cites version 2 of the paper (published Jan 2026). Local working copy is v3, extended with elicitation robustness experiments per `DECISIONS.md` in the research repo. v3 has not yet been pushed to Authorea. **Decision needed:** push v3 to Authorea before site launch (so metadata cites the most current version), or launch with v2 metadata and update post-v3-publication?

### Implementation hooks for Astro

- A `src/components/seo/Meta.astro` component that takes typed props and emits the appropriate `<meta>` tags. Layer 1 (Highwire) only renders on research pages; Layer 2 (JSON-LD) renders on all pages with appropriate `@type`; Layer 3 (DC) only on research pages.
- Astro **content collections** for `research/` and `blog/` MDX content, with frontmatter schemas validated against zod. The frontmatter declares the values that flow into the metadata component.
- `@astrojs/sitemap` integration for sitemap.xml generation.
- `robots.txt` as a static file in `public/`.

### Open metadata items (to resolve before launch)

- **Authorea DOI version question** (see Author identifier graph above): push v3 to Authorea pre-launch, or launch with v2 metadata and update later?
- **Privacy check:** confirm LinkedIn URL is OK to expose in public `sameAs` JSON-LD. GitHub at `trishasalas` is already public-by-nature, no concern. LinkedIn is public-by-default but worth a deliberate green light since it's exposed to crawlers more aggressively in JSON-LD than just as a hyperlink.
- **Post-launch follow-ups:** add Google Scholar profile URL to identifier graph once GS indexes paper #1; claim Semantic Scholar Author ID once SS auto-creates it.

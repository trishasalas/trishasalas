# 2026-05-10 — Mobile responsive pass and pre-publish hardening

## What this session was

Two-part session continuing from the 2026-05-09 layout work. First, a mobile responsive pass: hamburger menu, animation stopped on small viewports, hero painting hidden, tag pills constrained, and a couple of polish bugs (Lineage gradient banding, hero horizontal scroll at 390px). Second, the pre-publish foundations: OG tags, canonical, `Person` JSON-LD, 404 page, sitemap, robots.txt, favicon update, OG image. By session end the site is shippable; Plan 2 (Appendix A findability — per-paper landing pages) is the next deliverable.

## What changed

### Earlier in the day (already committed as `ce43723`)

`ce43723` — Left-anchored 3-column wrapper grid so the dashed margin rule stays at exactly 130px from viewport-left at every viewport width (a screenshot at 1920×1080 had shown drift to ~370px because `max-width: 1440px; margin: 0 auto` was adding centering offset). Full-bleed simplified from `100vw + calc(50% - 50vw)` to `grid-column: 1 / -1` now that the wrapper itself spans viewport width. Hero refactored to `grid-template-columns: subgrid` to inherit the new tracks.

### Mobile responsive pass

| Concern | Fix |
|---|---|
| Hamburger menu | New `<button data-nav-toggle>` in `Nav.astro`; aria-expanded is single source of truth; CSS attribute selector drives icon transform + dropdown panel visibility; closes on link tap, ESC, and viewport-grow above 768px. Visible at `≤768px`. |
| Animation off on small viewports | `motion.css` new `@media (max-width: 1024px)` block disables `.flit`, `.inkling`, `.halo-pulse`, `.sparkle`, `.glow-trail`. Pinned at 1024 because that's where the hero painting hides; nothing left to animate. |
| Painting + Inkling hidden | `Hero.astro` at `≤1024px` sets `.hero__painting { display: none }`. In-flight Inkling cascades away with it. Trisha plans a separate mobile Inkling later. |
| Tag pill width | `Writing.astro` at `≤900px`: `.post__tag { justify-self: start }` so the pill keeps its intrinsic width when the post grid collapses to one column. |
| Pause toggle on mobile | `PauseAnimationsToggle.astro` `display: none` at `≤1024px` — animation is force-stopped at this breakpoint, the WCAG 2.2.2 control has nothing to pause. |

### Polish bugs

| Concern | Fix |
|---|---|
| Lineage gradient banding | `Lineage.astro` swapped 3-stop `linear-gradient` (visible horizontal seam where bg met bg-soft, plus 8-bit color stepping along the line) for `radial-gradient(ellipse 90% 70% at center, bg-soft 0%, bg 75%)`. No straight color edge for the eye to lock onto. Mobile (`≤720px`) still flattens to solid `--bg`. |
| Hero overflow at 390px | `global.css` mobile full-bleed escape had `width: calc(100% + 2 * var(--hero-pad-x))` — but the wrapper only has `padding-left: var(--hero-pad-x)` (no right padding). The 2× overshot viewport-right by `hero-pad-x` (24px at 390px viewport, where `clamp(24px, 4vw, 48px)` floors to 24px). Corrected to single-side compensation. |

### Pre-publish SEO and findability foundations

| Concern | Fix |
|---|---|
| OG meta tags | `Base.astro` accepts an optional `ogImage` prop (defaults to `/og-image.jpg`). Emits `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width/height/alt`, `og:locale`. Twitter-specific tags deliberately skipped — Trisha doesn't use Twitter; the platform falls back to OG anyway. |
| Canonical URL | `Base.astro` emits `<link rel="canonical" href={canonicalUrl} />` derived from `Astro.url.pathname` + `Astro.site`. |
| Person JSON-LD | `index.astro` emits a Schema.org `Person` block with ORCID URL as `@id` (the keystone — every reference to "Trisha Salas" across the web resolves to the same canonical entity), name, url, image, jobTitle, description, knowsAbout array, and `sameAs` graph linking ORCID, GitHub, LinkedIn, OpenReview, and the Authorea DOI. |
| 404 page | New `src/pages/404.astro` using `Base` layout; Inkling-voiced copy ("Inkling can't *find* that one") with link back home. |
| Sitemap | `@astrojs/sitemap` integration added to `astro.config.mjs`. Build emits `sitemap-index.xml` + `sitemap-0.xml` to `dist/`. |
| robots.txt | New `public/robots.txt`: allow all, reference sitemap-index. |
| Favicon | `public/favicon.svg` updated. Was: dark `#1f1217` background (left over from original dark theme) with a rose sparkle. Now: transparent background, rose-deep sparkle (`#a44560` light mode, `#e889a0` dark mode via inline `prefers-color-scheme` media query). Apple-touch-icon and PNG fallbacks deliberately skipped — SVG favicons are universally supported in 2026, and the home-screen-icon use case is vanishingly rare for personal portfolio sites. |
| OG image | Generated via `sips --cropToHeightWidth 630 1200 light-bkg-fade.webp` — center crop from 1532×1161 → 1200×630, transcoded to JPEG at q=85. Output: `public/og-image.jpg`, 171 KB. |

## Decisions worth preserving

### Breakpoint strategy: 1024 / 900 / 768 / 720

Four mobile breakpoints map to four different concerns:

- **1024px** — hero painting hides, animation stops, pause toggle hides. The threshold where the painting's right-side features collide with content.
- **900px** — Writing two-column collapses (aside + posts → stacked).
- **768px** — hamburger menu kicks in. Nav links still fit comfortably above this.
- **720px** — Lineage gradient flattens, Lineage Inkling moves below text. Inherited from the original implementation.

The breakpoints are intentionally not unified. Each addresses a different layout-fitness question; collapsing them all to one threshold would change behavior just to be consistent.

### Hamburger architecture: `aria-expanded` as single source of truth

The button's `aria-expanded` attribute drives everything: the icon transformation (via `[aria-expanded="true"] .nav__toggle-bars span`), the dropdown panel visibility (via sibling selector `[aria-expanded="true"] ~ .nav`), and the script's open-state check. No state class kept in sync. Saves duplicate-state bugs. Trade-off: relies on Astro's component-scoped CSS recognizing the attribute selector and the sibling combinator (it does).

### Radial replaces linear gradient because of horizontal-seam dithering

Linear gradients between close-in-tone colors expose two problems: the strict horizontal seam where the two colors meet (eye locks onto the line), and 8-bit color stepping along that seam. Radial gradients dodge both — curved geometry breaks up the dithering and there's no straight edge to track. Choice was preferable to flattening the section entirely because the slight warm pool at center preserves the "this is a different atmosphere" feel of the about section.

### OG image: center crop, not Inkling-anchored

The painting's composition was already designed to support reading at multiple scales. A simple `sips --cropToHeightWidth` center crop captures the painted CSS in the center and a slice of Inkling on the upper-right without needing pixel-coordinate math. If the result looked wrong it would be re-cropped, but trusting the painting saved time and produced a coherent result on first try.

### Skipping apple-touch-icon and Twitter cards

Apple-touch-icon requires PNG; modern SVG favicons render fine in browser tabs and bookmarks. The iOS "Add to Home Screen" use case is vanishingly rare for a personal portfolio. Easy to add later if it ever matters. Twitter cards skipped because Trisha doesn't use Twitter and the platform falls back to OG anyway — same coverage on Bluesky, Mastodon, LinkedIn, Slack, iMessage, search engines.

### Person JSON-LD on home, not in Base layout

`Person` schema is page-scoped to the home page. Future per-paper pages (Plan 2) get their own `ScholarlyArticle` JSON-LD with the Person's `@id` referenced as `author` — that's the keystone that ties every paper back to the same canonical Trisha. Putting `Person` in Base would emit it on every page, but it semantically only belongs once.

## Open items (deferred to Plan 2 or beyond)

| Item | Where |
|---|---|
| Per-paper landing pages | Plan 2 (Appendix A — content collections, `/research/<slug>/`) |
| Highwire Press citation tags | Plan 2 |
| Schema.org `ScholarlyArticle` JSON-LD | Plan 2 |
| Dublin Core meta tags | Plan 2 |
| `/about/` standalone page | Plan 2 |
| External link verification (Trisha-side) | This week, manually |
| Lighthouse pass (Trisha-side) | This week, manually |
| Safari spot-check (subgrid, webp, hamburger) | This week, manually |
| Visual review of `og-image.jpg` | This week, manually |
| Spec revision | Pending. Trisha's call: "the spec is mine and was always just a starting point. I excel in discovery driven development." Memory note `spec_revision_approach.md` describes the approach. |
| Mobile-specific Inkling | Trisha-side asset work; will swap into `Hero.astro` mobile media query when ready |

## Tests

20 pre-existing e2e tests — all pass. No new tests added in this session (the changes were styling, head-content, and a presentational nav refactor; existing snapshot/a11y/pause-toggle coverage was sufficient).

## What this session was *not*

- Not Plan 2. Per-paper findability is its own planning + execution pass, scheduled for the 2026-05-16/17 weekend.
- Not a Lighthouse pass. Tools exist but only Trisha can run them against her local browser.
- Not a Netlify deployment. Trisha owns that side — the build is `npm run build`, publish dir is `dist/`, no environment variables required.

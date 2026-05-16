# /blog/ landing page — design spec

**Status:** Draft for review
**Author:** Trisha Salas (with Claude)
**Date:** 2026-05-16
**Supersedes URL fragment of:** `docs/superpowers/specs/2026-04-26-inkling-hero-design.md` (the `/research/<slug>/` + `/blog/<slug>/` split is replaced by a unified `/blog/<slug>/` model with tag-driven distinction)

## Goal

Build a discoverability hub for everything written on the site — research papers, essays, process notes, and personal posts — at `/blog/`. Today the home page's `Writing.astro` section is the only listing; individual posts have no shared parent route. The new index makes the archive scannable, gives the navigation a real destination, and lets the home-page section stay curated.

## Scope

**In scope**

- New page at `/blog/` (i.e., `src/pages/blog/index.astro`).
- Page header (eyebrow + display title + lede) matching the existing site chrome.
- Anchor-jump nav across the four tag groups.
- Posts grouped by `tag`, open-density cards (date + tag · title · description).
- Sort and draft-handling logic consistent with `src/components/sections/Writing.astro`.
- Empty-section handling (hide a section whose tag has zero posts).
- Page metadata (`<title>`, `description`, OG basics).

**Out of scope (deliberate, with notes)**

- **Per-tag pages** (e.g., `/blog/tag/research/`). Anchor sections satisfy navigation today. Revisit if Research-tag SEO becomes load-bearing once the corpus grows.
- **Filter UI** (chips, dropdowns, tabs). Sections + anchors do the same work without JS.
- **Pagination.** With current and near-term post counts, pagination is solving a non-problem. Revisit at ~30 posts per section.
- **Per-post `ScholarlyArticle` JSON-LD / Highwire `citation_*` tags.** Findability metadata for Research posts lives on the individual post detail pages (Plan 2 of the Inkling spec); the index itself doesn't need it.
- **Inkling marginalia.** Page chrome is restrained for the initial implementation; whimsy layered later as a separate pass.
- **Updating the home-page `Writing.astro` section** to a curated subset with a "Read all writing →" link. Worth doing later but separate scope.

## URL structure

- `/blog/` — this listing page (new).
- `/blog/<slug>/` — individual post detail (existing, unchanged).

The earlier plan to split research papers under `/research/<slug>/` is dropped. Distinction now lives entirely in the `tag` field on each post (the schema already supports it). This needs a corresponding update to the "URL structure" table in `CLAUDE.md`.

## Page structure

Top-to-bottom:

1. **`<Nav />`** — same as home.
2. **Page header** (left-aligned, inside `.site-wrapper`'s content column):
   - Eyebrow: `The Writing` (mono, rose-deep, uppercase, letter-spaced).
   - `<h1>`: `Notes from the <em>margin</em>.` Uses the existing rose-italic em treatment.
   - Lede paragraph (~2 sentences) orienting readers to what they'll find here. The `/blog/` page gets its own lede — it doesn't need to read identically to `Writing.astro`'s aside on the home page. They overlap thematically (same project, same voice) but don't share source text; if they drift, that's fine because each frames its surrounding context differently (home-page section vs. dedicated archive).
3. **Anchor-jump nav** — single row of links separated by middle-dots (`·`), below the lede and above the first section. Each link targets a section by `id`. Visually anchored by a dashed-rule underline consistent with the site's existing dashed-rule system.
4. **Sections** — one per tag value, in enum order: `Research`, `Essay`, `Process`, `Personal`. Each section has:
   - Section eyebrow (the tag name in mono caps).
   - `<h2>` section title, with `id="<tag-lower>"` and `tabindex="-1"` so anchor jumps land focus correctly.
   - Optional short subtitle (1 short phrase) per section. Subtitles are static, defined inline in the page (not in frontmatter).
   - List of post cards.
5. **`<Footer />`** — same as home.

## Card design (open density)

Per post, top-to-bottom within a `<li>`:

- **Meta row**: `<time datetime="...">{Month YYYY}</time>` + tag badge (small, mono caps). For drafts: `Drafting` instead of the date. The same `dateLabel(post)` helper from `Writing.astro` is the source of the rendered string — lift it to a small shared util (`src/utils/posts.ts`) rather than copy-pasting, since both the home section and the new index now call it.
- **Title**: `<h3>` with `<a>` to `/blog/<slug>/`. Honors `titleEm` for the rose-italic em treatment (same `emify` helper as `Writing.astro`).
- **Description**: post's `description` from frontmatter (already required by the schema).

No card border or background; each card is separated by a 1px rose-whisper bottom border (consistent with `.post` in `Writing.astro`).

## Sort & draft handling

Mirrors `Writing.astro`:

- Drafts hidden in production, visible in `dev`.
- Within a tag section: published posts sorted by `pubDate` descending; drafts pinned to the bottom of their tag's section with date label `Drafting`.

## Empty sections

A tag section is omitted entirely (heading and all) when its post count is zero in the current build. The anchor-jump nav also omits links to empty sections. Reasoning: an empty "Personal" heading with nothing under it is noise.

## Accessibility

- WCAG 2.2 AA, consistent with the rest of the site.
- Anchor-jump nav: plain `<a href="#research">` etc. No JS needed.
- Section `<h2>`s carry `id` + `tabindex="-1"` so keyboard focus lands on the heading when an anchor is activated.
- Tag badge is decorative-but-informative: it conveys taxonomy already implicit in the section it lives under, so it's plain text (not a separate landmark or list).
- All sizes in `rem`. No motion on this page in the initial implementation, so reduced-motion has nothing to honor — but the existing site-wide manual pause toggle in `<Footer />` still works for header animations elsewhere if any are added later.
- `<time datetime>` for machine-readable dates.

## SEO / metadata

- `<title>`: `The Writing — Trisha Salas`.
- `description`: short prose intro to the archive (~155 chars, distinct from the lede so it reads naturally in SERP snippets).
- OG title/description inherit from the above via the existing `Base.astro` plumbing.
- Sitemap: `@astrojs/sitemap` already configured at the project level; the new route will be picked up automatically.
- No JSON-LD on the listing itself. Per-post `ScholarlyArticle` metadata is a Plan 2 (Inkling spec, Appendix A) concern, scoped to individual post detail pages.

## Files affected

| File | Change |
|---|---|
| `src/pages/blog/index.astro` | **New.** Listing page implementation. |
| `src/utils/posts.ts` | **New.** Lift `getPublishedPosts()` (the filtered + sorted query) and `dateLabel()` / `emify()` helpers out of `Writing.astro` so both it and the new index share one source of truth. |
| `src/components/sections/Writing.astro` | Refactor only — call into the new shared helpers. No visible behavior change. |
| `src/pages/blog/[...slug].astro` | Change `← back to the writing` link from `/#writing` to `/blog/`. Single-line edit. |
| `CLAUDE.md` | Update "URL structure" section to reflect unified `/blog/<slug>/` model (drop `/research/<slug>/`). |

## Test plan

Playwright + Axe is the established pattern (`tests/e2e/a11y.spec.ts`). New tests:

- `tests/e2e/blog-index.spec.ts`:
  - Page loads at `/blog/`.
  - All four current published posts appear under their expected section.
  - Anchor-jump nav links resolve to in-page `id`s.
  - Activating an anchor lands keyboard focus on the section heading.
  - Empty section is not rendered (testable by reading the DOM and asserting no `<h2>` with the empty tag's text).
- Append `/blog/` to the existing Axe suite in `tests/e2e/a11y.spec.ts` (one new test, same structure as the home-page test).

## Open items

- **Section subtitles.** Each section can have a one-line italicized subtitle to give it character (e.g., Research: "Papers and preprints." Process: "Working notes."). Worth picking exact phrasing during implementation rather than now.
- **Card hover treatment.** Default to underline-on-hover for the title link (matching site convention). Confirm during implementation if anything more is wanted.
- **`Writing.astro` home section** — does it stay as-is (full list) or shrink to a curated 3-post preview now that the index exists? Out of scope for this spec; track as a follow-up.

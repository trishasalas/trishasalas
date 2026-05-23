# Scholarly & Findability Metadata — Design

**Date:** 2026-05-23
**Status:** Approved design, pre-implementation
**Origin:** Implements Appendix A ("Findability & Research Metadata") of `docs/superpowers/specs/2026-04-26-inkling-hero-design.md` — the "Plan 2" referenced in project memory. Appendix A is a forward-pointer; this is the full design.

## Context

Trisha cannot use arXiv (no endorser). Her site must do arXiv's discoverability job: be the authoritative, machine-readable landing page for her research and the hub of her cross-platform identifier graph (ORCID as keystone). One paper is published with a DOI and already cited in the literature; two more are in progress.

This design adds per-paper scholarly metadata (Highwire Press citation tags, Schema.org `ScholarlyArticle` JSON-LD, Dublin Core) and tidies the sitewide JSON-LD, so the site supports research discovery from launch.

## Drift resolved from Appendix A

Appendix A predates two later decisions. This design supersedes its implementation specifics (principles preserved):

| Appendix A said | This design does | Why |
|---|---|---|
| Papers live at `/research/<slug>/` (separate collection + route) | Papers are Research-category posts at `/blog/<category>/<slug>/` | CLAUDE.md retired the `/research/` split; the 2026-05-23 redirect work froze the `/blog/` URL shape. Reintroducing a route would re-break stable URLs. Scholar's inclusion criteria are satisfied on a blog detail page. |
| Layer 1/3 gate on "research pages" | Gate on presence of a `paper` frontmatter block | "Research" is a content taxonomy; "is a citable paper" is a publishing fact. The precursor post is Research-category but not a formal paper. |
| `citation_author content="Salas, Trisha"` | Natural order: `Trisha Salas` | Google Scholar accepts natural order; one representation serves both Highwire and Schema.org `name`. |
| Component named `seo/Meta.astro` | `seo/ScholarlyMeta.astro` | OG/canonical already live in `Base.astro`; this component owns only the scholarly layers, so the name should say so. |

## Scope

**In:** `paper` frontmatter block + identity module; `ScholarlyMeta.astro` emitting the three layers via a `<head>` slot; sitewide JSON-LD tidy (WebSite on home, Person on /about/); explicit `robots` meta; author byline on paper posts; forward-link on the precursor post; a metadata test.

**Out (flagged, not expanded):** the hardcoded paper data + "Cited in 1" string in `src/components/sections/Research.astro` (homepage teaser content — update when the OSF DOI lands); inner-page visual redesign; the broader audit of other orphaned v1 `/posts/` URLs (tracked separately, needs Search Console data).

## Architecture

Five units, each independently understandable:

1. **`src/utils/identity.ts`** — single source of truth for the keystone author. Exports the ORCID URL, the author's display name, the `/about/` URL, and the `sameAs[]` profile graph. Sourced from `docs/social-urls.md`. Every JSON-LD block imports from here; ORCID is never re-typed.
2. **`paper` block in `src/content/config.ts`** — optional zod object on the blog collection. Its presence is the on/off switch for scholarly metadata. All fields optional with fallbacks.
3. **`src/components/seo/ScholarlyMeta.astro`** — takes a post, emits Layer 1 (Highwire) + Layer 2 (`ScholarlyArticle` JSON-LD) + Layer 3 (Dublin Core). Pure presentation of resolved data.
4. **`<slot name="head" />` in `src/layouts/Base.astro`** — the injection point. Pages pass head content as a named slot; it renders inside `<head>`.
5. **Sitewide JSON-LD** — `WebSite` on `index.astro`, `Person` on `about.astro`, both from `identity.ts`.

### Data model

```ts
// src/content/config.ts — added to the blog schema
paper: z.object({
  authors: z.array(z.string()).default(['Trisha Salas']), // natural order
  publicationDate: z.coerce.date().optional(),            // falls back to pubDate
  doi: z.string().optional(),                             // bare "10.…/v2"; component builds https://doi.org/…
  pdf: z.string().optional(),                             // "/papers/<slug>.pdf" — self-hosted
  venue: z.string().optional(),                           // citation_journal_title — "TechRxiv" now, "OSF Preprints" after reposting
  abstract: z.string().optional(),                        // falls back to description
  keywords: z.array(z.string()).default([]),
}).optional(),
```

```ts
// src/utils/identity.ts — shape
export const ORCID = 'https://orcid.org/0009-0007-5105-7874';
export const AUTHOR = {
  name: 'Trisha Salas',
  orcid: ORCID,
  aboutUrl: 'https://trishasalas.com/about/',
  sameAs: [
    ORCID,
    'https://github.com/trishasalas',
    'https://www.linkedin.com/in/trishasalas/',
    'https://openreview.net/profile?id=%7ETrisha_Salas1',
    // Google Scholar / Semantic Scholar added post-indexing (one line each).
  ],
};
```

**Refinement:** the current home `Person.sameAs` includes the Authorea DOI. A DOI identifies the *paper*, not the person — it is dropped from `sameAs` here and instead carried by `ScholarlyArticle.identifier`, which this design adds. `sameAs` holds person-profile URLs only.

### The three layers (resolved example — the formal paper)

Rendered only when `post.data.paper` exists. For `accessibility-concept-emergence-pythia.mdx`:

```html
<!-- Layer 1 · Highwire Press — what Google Scholar parses -->
<meta name="citation_title" content="Accessibility Concept Emergence in the Pythia Suite: Thresholds, Binding, and the Declarative-Evaluative Gap">
<meta name="citation_author" content="Trisha Salas">
<meta name="citation_publication_date" content="2026/05/25">
<meta name="citation_pdf_url" content="https://trishasalas.com/papers/accessibility-concept-emergence-pythia.pdf">
<meta name="citation_abstract_html_url" content="https://trishasalas.com/blog/research/accessibility-concept-emergence-pythia/">
<meta name="citation_journal_title" content="TechRxiv">  <!-- tracks the canonical DOI's home; → "OSF Preprints" when reposted -->>
<meta name="citation_doi" content="10.…">
<meta name="citation_keywords" content="mechanistic interpretability; accessibility; Pythia; emergence; WCAG; ARIA">

<!-- Layer 2 · ScholarlyArticle JSON-LD (is:inline) -->
<script type="application/ld+json" is:inline>
{
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": "Accessibility Concept Emergence in the Pythia Suite…",
  "datePublished": "2026-05-25",
  "author": [{ "@type": "Person", "@id": "https://orcid.org/0009-0007-5105-7874",
               "name": "Trisha Salas", "url": "https://trishasalas.com/about/" }],
  "url": "https://trishasalas.com/blog/research/accessibility-concept-emergence-pythia/",
  "identifier": "https://doi.org/10.…",
  "abstract": "…",
  "keywords": ["mechanistic interpretability", "accessibility", "Pythia", "emergence", "WCAG", "ARIA"]
}
</script>

<!-- Layer 3 · Dublin Core -->
<meta name="DC.title" content="…">
<meta name="DC.creator" content="Trisha Salas">
<meta name="DC.date" content="2026-05-25">
<meta name="DC.identifier" content="https://doi.org/10.…">
<meta name="DC.subject" content="mechanistic interpretability; accessibility; emergence">
<meta name="DC.description" content="…">
<meta name="DC.type" content="Text">
```

**Author handling:** the `authors[]` array maps each name to a plain `Person`, except a name matching `AUTHOR.name`, which additionally gets the ORCID `@id` and `/about/` url. This credits future co-authors correctly while keeping Trisha the keystone. Each author also emits its own `citation_author` tag (Highwire repeats the tag per author).

**Correctness details:** `is:inline` on the JSON-LD script (prevents Astro bundling it as a module); `citation_publication_date` uses `YYYY/MM/DD`; the component derives canonical/abstract URLs from `Astro.url` (slotted content runs in the page's context, so this resolves to the page URL).

### Head-slot wiring

`Base.astro` gains `<slot name="head" />` inside `<head>` (after the OG block). The blog detail page renders, as a direct child of `<Base>`:

```astro
{post.data.paper && <ScholarlyMeta slot="head" post={post} />}
```

Non-paper pages pass nothing; the slot renders empty. This keeps `Base.astro` ignorant of scholarly concerns — it just offers a head extension point.

### Sitewide JSON-LD tidy

- **`index.astro`:** replace the `Person` block with `WebSite` JSON-LD (name, url, `inLanguage`, and `author` referencing the Person by `@id` = ORCID — not a duplicated Person object). No `SearchAction` (no site search).
- **`about.astro`:** add `Person` JSON-LD from `identity.ts` — `@id` = ORCID, `url` = `/about/`, full `sameAs`. This is the Person's canonical home per spec.
- **`Base.astro`:** add `<meta name="robots" content="index, follow">`. Twitter Cards remain omitted (existing OG-fallback decision stands).

### Template + content touches

- **Author byline** on posts with a `paper` block, rendered in the post header. Scholar's inclusion criteria want author + abstract visible in HTML; post bodies already clear the ≥100-word abstract bar, so this only surfaces the byline. Scoped addition to `[category]/[slug].astro`, not a redesign.
- **Forward-link on the precursor** (`testing-accessibility-knowledge-pythia.mdx`): a callout linking to the formal paper + its DOI, closing the citation-integrity loop from the 2026-05-23 redirect.

## Testing

Build the site and assert against the emitted HTML (static assertions, no browser — fast, aligned with the existing harness):

- **Paper page** (`/blog/research/accessibility-concept-emergence-pythia/`): contains each required `citation_*` tag; a `ScholarlyArticle` JSON-LD block whose author entry matching Trisha's name carries the ORCID `@id` (assert by name, not array position, so co-authored papers stay robust); the `DC.*` tags.
- **Non-paper post** (e.g. the precursor): emits *no* `citation_*` / `ScholarlyArticle` / `DC.*` tags.
- **Home:** contains `WebSite` JSON-LD and no longer the standalone `Person` block.
- **About:** contains `Person` JSON-LD with the ORCID `@id` and full `sameAs`.

Written test-first (TDD): the assertions exist and fail before the component does.

## Decisions log

- **PDF self-hosted** at `/papers/<slug>.pdf` → strongest Scholar signal (same-domain, stable, downloadable) and maximum independence.
- **`citation_doi` is a frontmatter value Trisha controls.** Plan: OSF becomes the canonical home (paper #1 posted there, Authorea DOI demoted to a prior version; future papers OSF-first). Until the OSF DOI exists, the Authorea DOI (`10.22541/au.177282002.24340653/v2`) is the stand-in — swapping it is a one-line edit. **`venue` is paired with it** and must name the same home: `"TechRxiv"` now, `"OSF Preprints"` after reposting.
- **Author strings in natural order**, single representation for Highwire + Schema.
- **Gate on `paper` block presence**, not category.
- **No Twitter Cards** (OG fallback), **no `SearchAction`** (no site search).

## Open items / follow-ups

1. Place the paper PDF at `public/papers/accessibility-concept-emergence-pythia.pdf` (Trisha — confirm it is the version matching the canonical DOI).
2. Finalize `citation_doi` **and** `venue` together once the OSF posting exists — both must name the same home (TechRxiv now → OSF Preprints after reposting).
3. Update `src/components/sections/Research.astro` (homepage teaser DOI + "Cited in 1") when the OSF DOI lands.
4. Audit remaining orphaned v1 `/posts/` URLs from Search Console; add a 301 per URL to `public/_redirects`.
5. Post-launch: add Google Scholar + Semantic Scholar profile URLs to `AUTHOR.sameAs`.

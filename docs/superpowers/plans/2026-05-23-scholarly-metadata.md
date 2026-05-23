# Scholarly & Findability Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit per-paper scholarly metadata (Highwire citation tags, Schema.org `ScholarlyArticle` JSON-LD, Dublin Core) on Research posts that declare a `paper` frontmatter block, and tidy the sitewide JSON-LD (WebSite on home, Person on /about/) — all single-sourced from one author-identity module.

**Architecture:** A `paper` frontmatter block gates a `ScholarlyMeta.astro` component that emits the three metadata layers into `<head>` via a named slot added to `Base.astro`. A shared `identity.ts` module holds the keystone ORCID author, consumed by the per-paper author block, the home `WebSite`, and the About `Person`.

**Tech Stack:** Astro 5 (content collections + zod), MDX, Playwright (e2e harness, dev server at `http://localhost:4321`).

**Spec:** `docs/superpowers/specs/2026-05-23-scholarly-metadata-design.md`

**Commit attribution:** Per CLAUDE.md, write multi-line messages that explain *why*, and append a `Co-Authored-By: Claude <your model name> <noreply@anthropic.com>` trailer naming the model that authored the change. (Commit subjects are given below; expand the body per convention.)

**Test runner note:** Run a single test with `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "<title>"`. Playwright auto-starts `npm run dev` and reuses a running server locally. The dev server shows drafts, but every page asserted here is non-draft, so dev and prod render identically for these assertions.

---

## File Structure

**Create:**
- `src/utils/identity.ts` — keystone author identity (ORCID, name, /about/ url, sameAs). Single source of truth.
- `src/components/seo/ScholarlyMeta.astro` — emits Highwire + ScholarlyArticle JSON-LD + Dublin Core for a post with a `paper` block.
- `tests/e2e/scholarly-metadata.spec.ts` — all assertions for this feature.

**Modify:**
- `src/content/config.ts` — add the optional `paper` block to the blog schema.
- `src/layouts/Base.astro` — add `<slot name="head" />` + `<meta name="robots">`.
- `src/pages/index.astro` — replace Person JSON-LD with WebSite JSON-LD.
- `src/pages/about.astro` — add Person JSON-LD (its canonical home).
- `src/pages/blog/[category]/[slug].astro` — render `<ScholarlyMeta slot="head">` and an author byline when `post.data.paper` exists.
- `src/content/blog/accessibility-concept-emergence-pythia.mdx` — add the `paper` frontmatter block.
- `src/content/blog/testing-accessibility-knowledge-pythia.mdx` — add a forward-link callout to the formal paper.

---

## Task 1: Head slot + robots meta in Base layout

**Files:**
- Modify: `src/layouts/Base.astro:38` (insert after the `og:locale` meta, still inside `<head>`)
- Test: `tests/e2e/scholarly-metadata.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/scholarly-metadata.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';

const ORCID = 'https://orcid.org/0009-0007-5105-7874';
const PAPER_URL = '/blog/research/accessibility-concept-emergence-pythia/';
const PRECURSOR_URL = '/blog/research/testing-accessibility-knowledge-pythia/';

function metaContent(page: Page, name: string) {
  return page.locator(`meta[name="${name}"]`).first().getAttribute('content');
}

async function jsonLdBlocks(page: Page): Promise<any[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((t) => JSON.parse(t));
}

test('home declares robots index,follow', async ({ page }) => {
  await page.goto('/');
  expect(await metaContent(page, 'robots')).toBe('index, follow');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "robots"`
Expected: FAIL — `metaContent` returns `null` (no robots meta yet).

- [ ] **Step 3: Add the slot and robots meta**

In `src/layouts/Base.astro`, immediately after the `og:locale` line (`<meta property="og:locale" content="en_US" />`), add:

```astro
  <meta name="robots" content="index, follow" />

  <!-- Per-page head extension point. Pages pass scholarly <meta>/JSON-LD here
       via `slot="head"`; <meta> tags must live in <head> to be valid. -->
  <slot name="head" />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "robots"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro tests/e2e/scholarly-metadata.spec.ts
git commit -m "feat: add head slot and robots meta to Base layout"
```

---

## Task 2: Author identity module + sitewide JSON-LD tidy

**Files:**
- Create: `src/utils/identity.ts`
- Modify: `src/pages/index.astro:11-47` (replace `personLd` block and its `<script>`)
- Modify: `src/pages/about.astro:1-11` (add `personLd` import/const and `<script>`)
- Test: `tests/e2e/scholarly-metadata.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/scholarly-metadata.spec.ts`:

```ts
test('home has WebSite JSON-LD crediting the ORCID author', async ({ page }) => {
  await page.goto('/');
  const blocks = await jsonLdBlocks(page);
  const website = blocks.find((b) => b['@type'] === 'WebSite');
  expect(website, 'a WebSite JSON-LD block exists').toBeTruthy();
  expect(website.author['@id']).toBe(ORCID);
  // The standalone Person block has moved to /about/.
  expect(blocks.find((b) => b['@type'] === 'Person')).toBeUndefined();
});

test('about has Person JSON-LD keyed on ORCID with profile sameAs', async ({ page }) => {
  await page.goto('/about/');
  const blocks = await jsonLdBlocks(page);
  const person = blocks.find((b) => b['@type'] === 'Person');
  expect(person, 'a Person JSON-LD block exists').toBeTruthy();
  expect(person['@id']).toBe(ORCID);
  expect(person.url).toBe('https://trishasalas.com/about/');
  expect(person.sameAs).toContain('https://github.com/trishasalas');
  // sameAs holds person profiles only — the paper DOI is NOT a person identifier.
  expect(person.sameAs).not.toContain('https://doi.org/10.22541/au.177282002.24340653/v2');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "WebSite|Person"`
Expected: FAIL — home currently has a Person block (not WebSite); about has no JSON-LD.

- [ ] **Step 3: Create the identity module**

Create `src/utils/identity.ts`:

```ts
// Single source of truth for the keystone author identity. ORCID is the
// canonical @id that links every "Trisha Salas" reference across the site
// (home WebSite, About Person, per-paper ScholarlyArticle author) to one
// ORCID record. Values mirror docs/social-urls.md.

export const ORCID = 'https://orcid.org/0009-0007-5105-7874';

export const AUTHOR = {
  name: 'Trisha Salas',
  orcid: ORCID,
  aboutUrl: 'https://trishasalas.com/about/',
  /** Person-profile URLs only — work identifiers (DOIs) live on the article. */
  sameAs: [
    ORCID,
    'https://github.com/trishasalas',
    'https://www.linkedin.com/in/trishasalas/',
    'https://openreview.net/profile?id=%7ETrisha_Salas1',
    // Add Google Scholar / Semantic Scholar profile URLs here post-indexing.
  ],
} as const;
```

- [ ] **Step 4: Swap home Person → WebSite**

In `src/pages/index.astro`, add the import (after the `Footer` import on line 9):

```astro
import { AUTHOR } from '../utils/identity';
```

Replace the entire `personLd` const (lines 11-40, the comment block + object) with:

```astro
// Schema.org WebSite — the home page identifies the site and credits its
// author by ORCID @id. The full descriptive Person record lives on /about/.
const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Trisha Salas',
  url: 'https://trishasalas.com',
  inLanguage: 'en',
  author: {
    '@type': 'Person',
    '@id': AUTHOR.orcid,
    name: AUTHOR.name,
    url: AUTHOR.aboutUrl,
  },
};
```

Then change the render line (was `<script type="application/ld+json" set:html={JSON.stringify(personLd)} />`) to:

```astro
  <script type="application/ld+json" set:html={JSON.stringify(websiteLd)} />
```

- [ ] **Step 5: Add Person JSON-LD to About**

In `src/pages/about.astro`, add the import after the `Inkling` import (line 5):

```astro
import { AUTHOR } from '../utils/identity';
```

Then add this const to the frontmatter (before the closing `---` on line 6):

```astro

// Schema.org Person — canonical author record. ORCID is the @id so every
// reference to "Trisha Salas" across the site resolves to one identity.
const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': AUTHOR.orcid,
  name: AUTHOR.name,
  url: AUTHOR.aboutUrl,
  image: 'https://trishasalas.com/og-image.jpg',
  jobTitle: 'Accessibility consultant and independent mechanistic interpretability researcher',
  description:
    'Front-end developer turned accessibility consultant, studying how language models represent what they seem to know.',
  knowsAbout: ['Accessibility', 'WCAG', 'ARIA', 'Mechanistic interpretability', 'Front-end development'],
  sameAs: AUTHOR.sameAs,
};
```

Then render it as the first child inside `<Base ...>` (immediately after the opening `<Base ...>` tag, before `<Nav />`):

```astro
        <script type="application/ld+json" set:html={JSON.stringify(personLd)} />
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "WebSite|Person"`
Expected: PASS (both).

- [ ] **Step 7: Commit**

```bash
git add src/utils/identity.ts src/pages/index.astro src/pages/about.astro tests/e2e/scholarly-metadata.spec.ts
git commit -m "feat: single-source author identity; WebSite on home, Person on about"
```

---

## Task 3: `paper` frontmatter contract (schema + data)

**Files:**
- Modify: `src/content/config.ts:6-26` (add `paper` block to the schema object)
- Modify: `src/content/blog/accessibility-concept-emergence-pythia.mdx:1-6` (frontmatter)

- [ ] **Step 1: Add the `paper` block to the schema**

In `src/content/config.ts`, inside the `z.object({ ... })` for the blog schema, add this field after the `tags` line (before `draft`):

```ts
    // Optional scholarly metadata. Presence of this block (not the category)
    // is the on/off switch for per-paper Highwire/Schema.org/Dublin Core tags.
    paper: z.object({
      authors: z.array(z.string()).default(['Trisha Salas']), // natural order
      publicationDate: z.coerce.date().optional(),            // falls back to pubDate
      doi: z.string().optional(),                             // bare "10.…/v2"; URL built downstream
      pdf: z.string().optional(),                             // "/papers/<slug>.pdf" — self-hosted
      venue: z.string().optional(),                           // citation_journal_title (DOI's home)
      abstract: z.string().optional(),                        // falls back to description
      keywords: z.array(z.string()).default([]),
    }).optional(),
```

- [ ] **Step 2: Populate the paper's frontmatter**

In `src/content/blog/accessibility-concept-emergence-pythia.mdx`, add this to the frontmatter (after the `category: Research` line, before the closing `---`):

```yaml
paper:
  authors:
    - Trisha Salas
  doi: 10.22541/au.177282002.24340653/v2
  pdf: /papers/accessibility-concept-emergence-pythia.pdf
  venue: TechRxiv
  keywords:
    - mechanistic interpretability
    - accessibility
    - Pythia
    - emergence
    - WCAG
    - ARIA
```

- [ ] **Step 3: Verify schema + data validate**

Run: `npm run build`
Expected: build completes with exit 0 (the `paper` block validates; no zod errors). If `astro check` is desired: `npm run check` is clean.

- [ ] **Step 4: Commit**

```bash
git add src/content/config.ts src/content/blog/accessibility-concept-emergence-pythia.mdx
git commit -m "feat: add paper frontmatter block and populate the Pythia paper"
```

---

## Task 4: ScholarlyMeta component — the three layers

**Files:**
- Create: `src/components/seo/ScholarlyMeta.astro`
- Modify: `src/pages/blog/[category]/[slug].astro:1-30` (import + conditional slot render)
- Test: `tests/e2e/scholarly-metadata.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/scholarly-metadata.spec.ts`:

```ts
test('paper page emits Highwire citation tags', async ({ page }) => {
  await page.goto(PAPER_URL);
  expect(await metaContent(page, 'citation_title')).toContain('Accessibility Concept Emergence');
  expect(await metaContent(page, 'citation_author')).toBe('Trisha Salas');
  expect(await metaContent(page, 'citation_doi')).toBe('10.22541/au.177282002.24340653/v2');
  expect(await metaContent(page, 'citation_pdf_url')).toBe(
    'https://trishasalas.com/papers/accessibility-concept-emergence-pythia.pdf',
  );
  expect(await metaContent(page, 'citation_journal_title')).toBe('TechRxiv');
  expect(await metaContent(page, 'citation_publication_date')).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  expect(await metaContent(page, 'citation_keywords')).toContain('mechanistic interpretability');
});

test('paper page emits ScholarlyArticle JSON-LD with ORCID author', async ({ page }) => {
  await page.goto(PAPER_URL);
  const blocks = await jsonLdBlocks(page);
  const article = blocks.find((b) => b['@type'] === 'ScholarlyArticle');
  expect(article, 'a ScholarlyArticle block exists').toBeTruthy();
  const trisha = article.author.find((a) => a.name === 'Trisha Salas');
  expect(trisha['@id']).toBe(ORCID);
  expect(article.identifier).toBe('https://doi.org/10.22541/au.177282002.24340653/v2');
});

test('paper page emits Dublin Core tags', async ({ page }) => {
  await page.goto(PAPER_URL);
  expect(await metaContent(page, 'DC.title')).toContain('Accessibility Concept Emergence');
  expect(await metaContent(page, 'DC.creator')).toBe('Trisha Salas');
  expect(await metaContent(page, 'DC.type')).toBe('Text');
});

test('non-paper post emits no citation/article/DC metadata', async ({ page }) => {
  await page.goto(PRECURSOR_URL);
  expect(await page.locator('meta[name="citation_title"]').count()).toBe(0);
  const blocks = await jsonLdBlocks(page);
  expect(blocks.find((b) => b['@type'] === 'ScholarlyArticle')).toBeUndefined();
  expect(await page.locator('meta[name="DC.title"]').count()).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "Highwire|ScholarlyArticle|Dublin Core|non-paper"`
Expected: FAIL — no `citation_*`/`DC.*`/`ScholarlyArticle` yet. (The "non-paper" test may already pass; that's fine — it guards the gate.)

- [ ] **Step 3: Create the component**

Create `src/components/seo/ScholarlyMeta.astro`:

```astro
---
// Emits per-paper findability metadata for a blog post that declares a `paper`
// frontmatter block: Layer 1 Highwire citation tags, Layer 2 ScholarlyArticle
// JSON-LD, Layer 3 Dublin Core. Rendered via `slot="head"` so the <meta> tags
// land in <head>. Caller guarantees `post.data.paper` exists.
import type { CollectionEntry } from 'astro:content';
import { AUTHOR } from '../../utils/identity';

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const paper = post.data.paper!;

const canonical = new URL(Astro.url.pathname, Astro.site).toString();
const pubDate = paper.publicationDate ?? post.data.pubDate;
const abstract = paper.abstract ?? post.data.description;
const doiUrl = paper.doi ? `https://doi.org/${paper.doi}` : undefined;
const pdfUrl = paper.pdf ? new URL(paper.pdf, Astro.site).toString() : undefined;
const keywordList = paper.keywords.join('; ');

// Highwire dates are YYYY/MM/DD; Schema.org + Dublin Core use ISO YYYY-MM-DD.
const hwDate = pubDate
  ? `${pubDate.getUTCFullYear()}/${String(pubDate.getUTCMonth() + 1).padStart(2, '0')}/${String(pubDate.getUTCDate()).padStart(2, '0')}`
  : undefined;
const isoDate = pubDate ? pubDate.toISOString().slice(0, 10) : undefined;

// The keystone author (name match) carries the ORCID @id + /about/ url;
// co-authors get a plain Person.
const authorLd = paper.authors.map((name) =>
  name === AUTHOR.name
    ? { '@type': 'Person', '@id': AUTHOR.orcid, name, url: AUTHOR.aboutUrl }
    : { '@type': 'Person', name },
);

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  headline: post.data.title,
  ...(isoDate && { datePublished: isoDate }),
  author: authorLd,
  url: canonical,
  ...(doiUrl && { identifier: doiUrl }),
  abstract,
  keywords: paper.keywords,
};
---
{/* Layer 1 — Highwire Press citation tags (what Google Scholar parses) */}
<meta name="citation_title" content={post.data.title} />
{paper.authors.map((name) => <meta name="citation_author" content={name} />)}
{hwDate && <meta name="citation_publication_date" content={hwDate} />}
{pdfUrl && <meta name="citation_pdf_url" content={pdfUrl} />}
<meta name="citation_abstract_html_url" content={canonical} />
{paper.venue && <meta name="citation_journal_title" content={paper.venue} />}
{paper.doi && <meta name="citation_doi" content={paper.doi} />}
{keywordList && <meta name="citation_keywords" content={keywordList} />}

{/* Layer 2 — Schema.org ScholarlyArticle JSON-LD */}
<script type="application/ld+json" is:inline set:html={JSON.stringify(articleLd)} />

{/* Layer 3 — Dublin Core */}
<meta name="DC.title" content={post.data.title} />
{paper.authors.map((name) => <meta name="DC.creator" content={name} />)}
{isoDate && <meta name="DC.date" content={isoDate} />}
{doiUrl && <meta name="DC.identifier" content={doiUrl} />}
{keywordList && <meta name="DC.subject" content={keywordList} />}
<meta name="DC.description" content={abstract} />
<meta name="DC.type" content="Text" />
```

- [ ] **Step 4: Wire it into the blog detail page**

In `src/pages/blog/[category]/[slug].astro`, add the import after the `Footer` import (line 5):

```astro
import ScholarlyMeta from '../../../components/seo/ScholarlyMeta.astro';
```

Then, as the first child inside the opening `<Base ...>` tag (before `<Nav />` on line 31), add:

```astro
    {post.data.paper && <ScholarlyMeta slot="head" post={post} />}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "Highwire|ScholarlyArticle|Dublin Core|non-paper"`
Expected: PASS (all four).

- [ ] **Step 6: Commit**

```bash
git add src/components/seo/ScholarlyMeta.astro "src/pages/blog/[category]/[slug].astro" tests/e2e/scholarly-metadata.spec.ts
git commit -m "feat: emit Highwire, ScholarlyArticle, and Dublin Core for papers"
```

---

## Task 5: Author byline on paper posts

**Files:**
- Modify: `src/pages/blog/[category]/[slug].astro:39` (add byline in header) + `<style>` block
- Test: `tests/e2e/scholarly-metadata.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/scholarly-metadata.spec.ts`:

```ts
test('paper page shows a visible author byline', async ({ page }) => {
  await page.goto(PAPER_URL);
  const byline = page.locator('.post-detail__byline');
  await expect(byline).toBeVisible();
  await expect(byline).toContainText('Trisha Salas');
});

test('non-paper post shows no byline', async ({ page }) => {
  await page.goto(PRECURSOR_URL);
  expect(await page.locator('.post-detail__byline').count()).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "byline"`
Expected: FAIL — `.post-detail__byline` does not exist yet.

- [ ] **Step 3: Add the byline to the header**

In `src/pages/blog/[category]/[slug].astro`, immediately after the `<h1 class="post-detail__title" ...></h1>` line (line 39), add:

```astro
          {post.data.paper && (
            <p class="post-detail__byline">By {post.data.paper.authors.join(', ')}</p>
          )}
```

Then add this rule inside the component's `<style>` block (after the `.post-detail__title` rule):

```css
  .post-detail__byline {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    letter-spacing: 0.08em;
    color: var(--text-soft);
    margin: 16px 0 0;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "byline"`
Expected: PASS (both).

- [ ] **Step 5: Commit**

```bash
git add "src/pages/blog/[category]/[slug].astro" tests/e2e/scholarly-metadata.spec.ts
git commit -m "feat: show author byline on paper posts"
```

---

## Task 6: Forward-link the precursor article to the formal paper

**Files:**
- Modify: `src/content/blog/testing-accessibility-knowledge-pythia.mdx` (add callout after frontmatter)
- Test: `tests/e2e/scholarly-metadata.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/e2e/scholarly-metadata.spec.ts`:

```ts
test('precursor article links forward to the formal paper', async ({ page }) => {
  await page.goto(PRECURSOR_URL);
  const link = page.locator(`.post-detail__body a[href="${PAPER_URL}"]`);
  await expect(link.first()).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "links forward"`
Expected: FAIL — no link to the paper URL in the precursor body.

- [ ] **Step 3: Add the forward-link callout**

In `src/content/blog/testing-accessibility-knowledge-pythia.mdx`, immediately after the closing frontmatter `---` (before the first body paragraph), insert:

```mdx

> **Update:** This exploration was formalized into a paper — [Accessibility Concept Emergence in the Pythia Suite](/blog/research/accessibility-concept-emergence-pythia/) ([DOI](https://doi.org/10.22541/au.177282002.24340653/v2)).
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts -g "links forward"`
Expected: PASS.

- [ ] **Step 5: Run the full suite + build**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts`
Expected: all tests PASS.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/content/blog/testing-accessibility-knowledge-pythia.mdx tests/e2e/scholarly-metadata.spec.ts
git commit -m "docs(content): link the precursor article to the formal paper"
```

---

## Post-implementation follow-ups (not tasks — handed to Trisha)

1. Drop the paper PDF at `public/papers/accessibility-concept-emergence-pythia.pdf` (confirm it matches the canonical DOI version). `citation_pdf_url` already points there.
2. When the OSF posting exists, update **both** `doi` and `venue` in the paper's frontmatter (TechRxiv → OSF Preprints).
3. Update the hardcoded DOI + "Cited in 1" in `src/components/sections/Research.astro` when the OSF DOI lands.
4. Audit remaining orphaned v1 `/posts/` URLs from Search Console; add a 301 per URL to `public/_redirects`.
5. Post-launch: add Google Scholar + Semantic Scholar profile URLs to `AUTHOR.sameAs` in `src/utils/identity.ts`.

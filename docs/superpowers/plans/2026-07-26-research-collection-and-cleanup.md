# Plan A — Research Collection & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move scholarly artifact metadata out of blog frontmatter into a dedicated routeless `research` collection, derive the home-page Research section from it, and clear four latent defects (2 red specs, a 404 PDF link, indexed empty category pages, two silent-failure schema holes).

**Architecture:** A new `research` content collection holds citable artifacts (papers, software). It generates **no routes** — it is a data collection consumed by `Research.astro` (cards) and by `blog/[category]/[slug].astro` (which reverse-looks-up an artifact by its `post` field and passes it to `ScholarlyMeta`). Blog posts stay posts; only artifact metadata moves. The `paper` block is deleted from the blog schema.

**Tech Stack:** Astro 7.1.3, Zod (via `astro:content`), MDX, Playwright + axe-core.

## Global Constraints

- **Rendered output of the Research section must be visually identical** to current production, modulo the deliberate card swap (TACCESS → thatDangCircuit). This is a wiring change.
- **Preserve this comment verbatim** in `Research.astro`, unmoved in intent:
  `<!-- two papers, three more on the desk; she counts the unfinished ones too -->`
- **No rendered strings in frontmatter.** Frontmatter holds structured values (`citedBy: 1`, `scope: "Benchmark · 5 models"`); components own formatting and order.
- **Field naming:** name the domain concept, not the UI container. `shortTitle`, never `cardTitle`.
- **Canonical DOI policy:** Zenodo primary. Authorea is recorded in `docs/social-urls.md` as a superseded prior version, and must not appear in any emitted citation tag.
- **Zenodo concept DOI, not version DOI.** thatDangCircuit is `10.5281/zenodo.21604592` (concept — resolves to latest), NOT `...593` (v1.0.0 pin).
- **No scholarly tag may be lost.** See Task 3's acceptance gate.
- Sizes in `rem`, WCAG 2.2 AA, `prefers-reduced-motion` honored — repo standard, unchanged by this plan.
- **Commit attribution:** every commit whose content Claude authored gets `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` naming the model that actually did the work. Subagents use their own model name.

## Environment note (read before running tests)

Astro 7 runs `astro dev` as a **persistent daemon**. `npm run dev` returns immediately when a server is already running, which makes Playwright's `webServer` block report `Process from config.webServer exited early.`

Check and use the running server:

```bash
npx astro dev status        # is one already up?
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/   # expect 200
npx playwright test         # reuseExistingServer is already true in playwright.config.ts
```

If no server is running, start one with `npx astro dev` first, then run Playwright.

## Baseline (measured 2026-07-26, before any change)

- `npm run build` — **passes**.
- `npx playwright test` — **33 passed, 2 failed**. Both failures are stale DOI assertions in `tests/e2e/scholarly-metadata.spec.ts`. Task 1 fixes them. **Do not** start Task 2 until the suite is 35/35 green.

## File Structure

| File | Responsibility |
|---|---|
| `src/content.config.ts` | Modify — add `research` collection; delete `paper` block from `blog`; add `titleEm` refine; tighten `description`; drop `The-Notes` from the category enum. |
| `src/content/research/accessibility-concept-emergence-pythia.md` | Create — the Pythia paper's citable record. Links to its post. |
| `src/content/research/that-dang-circuit.md` | Create — software artifact. External home. |
| `src/utils/research.ts` | Create — collection accessors + label/meta derivation. One responsibility: turning research entries into render-ready values. |
| `src/utils/posts.ts` | Modify — remove `The-Notes` from `CATEGORIES`; add `getPopulatedCategories()`. |
| `src/components/seo/ScholarlyMeta.astro` | Modify — driven by a research entry instead of a blog post. |
| `src/pages/blog/[category]/[slug].astro` | Modify — reverse-lookup artifact by post id. |
| `src/pages/blog/[category]/index.astro` | Modify — `getStaticPaths` and sidebar nav filter to populated categories. |
| `src/components/sections/Research.astro` | Modify — derive from collection; delete local `emify`. |
| `src/content/blog/accessibility-concept-emergence-pythia.mdx` | Modify — `paper` block removed. |
| `src/content/blog/i-am-the-paper.mdx` | Modify — non-empty `description`. |
| `public/papers/accessibility-concept-emergence-pythia.pdf` | Rename from `accessibility-concept-emergence.pdf` — fixes the 404. |
| `docs/social-urls.md` | Modify — Zenodo primary, Authorea superseded, thatDangCircuit added. |
| `tests/e2e/scholarly-metadata.spec.ts` | Modify — Zenodo DOI, plus new artifact-invariant tests. |
| `tests/e2e/home.spec.ts` | Modify — assert both research cards. |
| `src/components/seo/Plausible.astro` | Delete. |

---

### Task 1: Green the baseline — DOI, PDF 404, metadata source of truth

The suite is red before you touch anything, and `citation_pdf_url` points at a file that does not exist. Google Scholar follows that link; this may be why the paper has not indexed. Fix the facts before refactoring around them.

**Files:**
- Rename: `public/papers/accessibility-concept-emergence.pdf` → `public/papers/accessibility-concept-emergence-pythia.pdf`
- Modify: `docs/social-urls.md`
- Test: `tests/e2e/scholarly-metadata.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a green 35/35 baseline. Every later task's verification depends on it.

- [ ] **Step 1: Confirm the failures are exactly the two expected**

Run: `npx playwright test tests/e2e/scholarly-metadata.spec.ts`

Expected: 2 failures — `citation_doi` and `article.identifier`, both expecting `10.22541/au.177282002.24340653/v2`, both receiving `10.5281/zenodo.20360787`.

- [ ] **Step 2: Confirm the PDF 404**

```bash
grep -n 'pdf:' src/content/blog/accessibility-concept-emergence-pythia.mdx
ls public/papers/
```

Expected: frontmatter says `/papers/accessibility-concept-emergence-pythia.pdf`; the directory contains only `accessibility-concept-emergence.pdf`. The names differ.

- [ ] **Step 3: Rename the PDF to match the frontmatter and the post id**

```bash
git mv public/papers/accessibility-concept-emergence.pdf \
       public/papers/accessibility-concept-emergence-pythia.pdf
```

Renaming the file (rather than editing the frontmatter to the shorter name) keeps the PDF filename aligned with the post id and the existing test assertion. The current URL 404s, so no working inbound link is broken either way.

- [ ] **Step 4: Update the three stale DOI assertions**

In `tests/e2e/scholarly-metadata.spec.ts`, replace:

```ts
  expect(await metaContent(page, 'citation_doi')).toBe('10.22541/au.177282002.24340653/v2');
```

with:

```ts
  expect(await metaContent(page, 'citation_doi')).toBe('10.5281/zenodo.20360787');
```

Replace:

```ts
  expect(await metaContent(page, 'citation_journal_title')).toBe('TechRxiv');
```

with:

```ts
  expect(await metaContent(page, 'citation_journal_title')).toBe('Zenodo');
```

Replace:

```ts
  expect(article.identifier).toBe('https://doi.org/10.22541/au.177282002.24340653/v2');
```

with:

```ts
  expect(article.identifier).toBe('https://doi.org/10.5281/zenodo.20360787');
```

And in the `/about/` test, the assertion that a paper DOI is *not* a person identifier must reference the current DOI to stay meaningful. Replace:

```ts
  expect(person.sameAs).not.toContain('https://doi.org/10.22541/au.177282002.24340653/v2');
```

with:

```ts
  expect(person.sameAs).not.toContain('https://doi.org/10.5281/zenodo.20360787');
```

- [ ] **Step 5: Add a test that the cited PDF actually exists**

The bug this task fixes had no test. Add one at the end of `tests/e2e/scholarly-metadata.spec.ts`:

```ts
test('citation_pdf_url resolves to a real file', async ({ page, request }) => {
  await page.goto(PAPER_URL);
  const pdfUrl = await metaContent(page, 'citation_pdf_url');
  expect(pdfUrl, 'paper declares a citation_pdf_url').toBeTruthy();
  // The tag is absolute (https://trishasalas.com/...); fetch the same path
  // off the dev server so the assertion tests this build, not production.
  const path = new URL(pdfUrl!).pathname;
  const res = await request.get(path);
  expect(res.status(), `${path} must not 404`).toBe(200);
});
```

- [ ] **Step 6: Run the suite and verify 35/35**

Run: `npx playwright test`
Expected: `35 passed`. Zero failures.

- [ ] **Step 7: Update `docs/social-urls.md` — metadata source of truth first, per CLAUDE.md**

Replace the `Authorea DOI` row and add two rows, so the table reads:

```markdown
| Item             |                             | Value                                              |
| ---------------- | --------------------------- | -------------------------------------------------- |
| Orcid ID         | exists                      | 0009-0007-5105-7874                                |
| Zenodo DOI (paper) | primary — Pythia paper    | https://doi.org/10.5281/zenodo.20360787            |
| Authorea DOI     | superseded by Zenodo        | https://doi.org/10.22541/au.177282002.24340653/v2  |
| Zenodo DOI (software) | concept DOI — thatDangCircuit | https://doi.org/10.5281/zenodo.21604592     |
| thatDangCircuit record | v1.0.0                | https://zenodo.org/records/21604593                |
| thatDangCircuit repo | exists                  | https://github.com/trishasalas/thatDangCircuit     |
| arXiv            | account exists, no papers   |                                                    |
| OpenReview       | profile exists              | https://openreview.net/profile?id=%7ETrisha_Salas1 |
| Google Scholar   | will populate post-indexing | profile url tbd                                    |
| Semantic Scholar | will auto populate          | claim later                                        |
| GitHub           | exists                      | trishasalas                                        |
| LinkedIn         | exists                      | https://www.linkedin.com/in/trishasalas/           |
| DBLP             | n/a                         | will add when peer reviewed                        |
```

Note under the table:

```markdown
**Concept vs version DOI.** thatDangCircuit's citable identifier is the *concept*
DOI `10.5281/zenodo.21604592`, which always resolves to the latest release. The
version DOI `...593` pins v1.0.0 specifically and must not be used for citation.
Software Heritage and OpenAIRE mirror the record.
```

- [ ] **Step 8: Commit**

```bash
git add public/papers docs/social-urls.md tests/e2e/scholarly-metadata.spec.ts
git commit -m "fix(metadata): repair the cited PDF path and realign DOI records

citation_pdf_url pointed at /papers/accessibility-concept-emergence-pythia.pdf
while the file on disk was accessibility-concept-emergence.pdf. Google Scholar
follows that tag to fetch full text, so the paper has been advertising a 404 as
its full-text location — a plausible cause of its non-indexing. Renamed the file
rather than shortening the frontmatter path, keeping the PDF name aligned with
the post id.

The scholarly-metadata specs still asserted the Authorea DOI after content moved
to Zenodo in 0260bc1, so the suite has been two-red. Zenodo is now primary in
docs/social-urls.md with Authorea recorded as superseded; the specs follow the
source of truth rather than the other way around.

Added a test that citation_pdf_url resolves, because the original bug was
invisible to the suite.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The `research` collection

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/research/accessibility-concept-emergence-pythia.md`
- Create: `src/content/research/that-dang-circuit.md`
- Create: `src/utils/research.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Collection `research` with entry ids `accessibility-concept-emergence-pythia`, `that-dang-circuit`.
  - `type ResearchArtifact = CollectionEntry<'research'>`
  - `getResearchArtifacts(): Promise<ResearchArtifact[]>` — newest first
  - `getArtifactForPost(postId: string): Promise<ResearchArtifact | undefined>`
  - `statusLabel(a: ResearchArtifact): string`
  - `metaItems(a: ResearchArtifact): string[]`
  - `artifactHref(a: ResearchArtifact): string`
  - `artifactYear(a: ResearchArtifact): string`

- [ ] **Step 1: Add the `research` collection to `src/content.config.ts`**

Insert after the `blog` definition, before the `export`:

```ts
// Citable research outputs — papers, software, datasets. Deliberately NOT a
// blog category and NOT a blog frontmatter block:
//
//   * An artifact may have no post at all (thatDangCircuit is software).
//   * The post is not the citable record. The record has its own title,
//     authors, date and DOI, and outlives any prose written about it.
//   * This collection generates NO routes. It is read by Research.astro for
//     the home-page cards and by blog/[category]/[slug].astro to attach
//     scholarly metadata to a post. Adding entries adds no URLs.
const research = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/research" }),
  schema: z
    .object({
      // Full scholarly title — what Highwire, Dublin Core and Schema.org publish.
      title: z.string().min(1),
      // Short title, in the scholarly sense (what a journal requests alongside
      // the full title, cf. running head). Used for the home-page card.
      shortTitle: z.string().min(1),
      // Substring of `shortTitle` to wrap in <em> for the rose-italic treatment.
      // Optional — omitting it must render the title unemphasized and intact.
      shortTitleEm: z.string().optional(),
      abstract: z.string().min(1),
      authors: z.array(z.string()).default(['Trisha Salas']), // natural order
      publicationDate: z.coerce.date(),
      // Bare DOI ("10.5281/..."); URL built downstream. For Zenodo software use
      // the CONCEPT doi, which resolves to the latest version — not the
      // version-pinned one.
      doi: z.string().optional(),
      pdf: z.string().optional(),                    // "/papers/<name>.pdf"
      venue: z.string().optional(),                  // citation_journal_title
      // Drives the status label's voice. Zenodo types software as Software, and
      // it should not read in the same register as a journal-style paper card.
      resourceType: z.enum(['Paper', 'Software']).default('Paper'),
      keywords: z.array(z.string()).default([]),
      // Structured values only — the component renders "Cited in {n}".
      citedBy: z.number().int().positive().optional(),
      scope: z.string().optional(),                  // e.g. "Software · v1.0.0"
      // Exactly one of these. `post` is a blog entry id whose page is this
      // artifact's home on the site; `hostedAt` is an external canonical home.
      post: z.string().optional(),
      hostedAt: z.string().url().optional(),
    })
    .refine((d) => !d.shortTitleEm || d.shortTitle.includes(d.shortTitleEm), {
      message: 'shortTitleEm must be a substring of shortTitle',
      path: ['shortTitleEm'],
    })
    .refine((d) => Boolean(d.post) !== Boolean(d.hostedAt), {
      message: 'a research entry needs exactly one of `post` or `hostedAt`',
      path: ['post'],
    }),
});
```

Change the export line from:

```ts
export const collections = { blog };
```

to:

```ts
export const collections = { blog, research };
```

- [ ] **Step 2: Create the Pythia paper's record**

Create `src/content/research/accessibility-concept-emergence-pythia.md`. Values are lifted verbatim from the blog frontmatter being retired, plus the card copy currently hardcoded in `Research.astro`:

```markdown
---
title: 'Accessibility Concept Emergence in the Pythia Suite: Thresholds, Binding, and the Declarative-Evaluative Gap'
shortTitle: Accessibility Concept Emergence in the Pythia Suite
shortTitleEm: Pythia
abstract: A cross-scale analysis of how accessibility concepts — WCAG, ARIA, semantic HTML — become represented across the Pythia model family. Evidence for a three-tier statistical architecture of accessibility-related activations that replicates across GPT-2 XL and Pythia 2.8B.
authors:
  - Trisha Salas
publicationDate: 2026-05-24
doi: 10.5281/zenodo.20360787
pdf: /papers/accessibility-concept-emergence-pythia.pdf
venue: Zenodo
resourceType: Paper
keywords:
  - mechanistic interpretability
  - accessibility
  - Pythia
  - emergence
  - WCAG
  - ARIA
citedBy: 1
post: accessibility-concept-emergence-pythia
---
```

The body is intentionally empty — this collection generates no pages, so nothing renders it.

- [ ] **Step 3: Create the thatDangCircuit record**

Create `src/content/research/that-dang-circuit.md`:

```markdown
---
title: 'thatDangCircuit v1.0.0 — compound binding is distributed'
shortTitle: thatDangCircuit
abstract: A negative localization result for noun-noun compound binding across GPT-2 and Pythia — probed by head ablation, residual-stream cosine, and projection steering. Binding proves distributed and redundant rather than circuit-localized: ablating the top-scoring heads shifts it by roughly 1%, with compensation elsewhere in the network, and the pre-registered steering prediction was falsified. The redundancy is the finding.
authors:
  - Trisha Salas
publicationDate: 2026-07-26
doi: 10.5281/zenodo.21604592
venue: Zenodo
resourceType: Software
keywords:
  - mechanistic interpretability
  - compound binding
  - GPT-2
  - Pythia
  - ablation
  - activation steering
scope: Software · v1.0.0
hostedAt: https://zenodo.org/records/21604593
---
```

Note three deliberate choices, all one-line reversals:
- **`shortTitleEm` omitted.** "thatDangCircuit" is a single camelCase identifier and the package name; splitting it mid-token would read as a rendering bug. Step 6 tests that the omitted path renders cleanly.
- **`doi` is the concept DOI** (`...592`), `hostedAt` is the version record URL (`...593`). The citable identifier tracks the latest release; the human-facing link lands on a concrete version with its citation block and license.
- **No `citedBy`.** Omitted, not zero — the component only renders the chip when the field is present.

- [ ] **Step 4: Create `src/utils/research.ts`**

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type ResearchArtifact = CollectionEntry<'research'>;

/** Citable artifacts, newest first. */
export async function getResearchArtifacts(): Promise<ResearchArtifact[]> {
  const all = await getCollection('research');
  return all.sort(
    (a, b) => b.data.publicationDate.getTime() - a.data.publicationDate.getTime(),
  );
}

/**
 * The artifact record for a blog post, if one exists. Reverse lookup on the
 * `post` field — this is how a post page finds the scholarly metadata that
 * used to live in its own frontmatter.
 */
export async function getArtifactForPost(
  postId: string,
): Promise<ResearchArtifact | undefined> {
  const all = await getCollection('research');
  return all.find((r) => r.data.post === postId);
}

/**
 * "Published · Zenodo" for papers, "Software · Zenodo" for software. Zenodo
 * types software distinctly and it should not read in the same voice as a
 * journal-style paper card.
 */
export function statusLabel(a: ResearchArtifact): string {
  const kind = a.data.resourceType === 'Software' ? 'Software' : 'Published';
  return a.data.venue ? `${kind} · ${a.data.venue}` : kind;
}

/**
 * Card meta chips, in render order. The CSS is a wrapping flex list, so this
 * is an ordered array of N items, not fixed slots. Frontmatter holds the
 * structured values; the formatting and the order are the component's business.
 */
export function metaItems(a: ResearchArtifact): string[] {
  const items: string[] = [];
  if (a.data.doi) items.push(`DOI · ${a.data.doi}`);
  if (a.data.scope) items.push(a.data.scope);
  if (a.data.citedBy) items.push(`Cited in ${a.data.citedBy}`);
  return items;
}

/** Where the card points: this site's post, or the artifact's external home. */
export function artifactHref(a: ResearchArtifact): string {
  // The schema's XOR refine guarantees exactly one of these is set.
  return a.data.post ? `/blog/research/${a.data.post}/` : a.data.hostedAt!;
}

/** Four-digit publication year for the card's right-hand status slot. */
export function artifactYear(a: ResearchArtifact): string {
  return String(a.data.publicationDate.getUTCFullYear());
}
```

- [ ] **Step 5: Verify the collection validates and both entries load**

Run: `npm run build`
Expected: build passes. No route is added — confirm:

```bash
find dist -type d -name research -not -path '*/blog/*'
```

Expected: no output. The collection generates no pages.

- [ ] **Step 6: Verify the XOR refine and the optional `shortTitleEm` path**

Temporarily add `post: accessibility-concept-emergence-pythia` to `that-dang-circuit.md` (giving it both `post` and `hostedAt`), then:

Run: `npm run build`
Expected: FAIL with `a research entry needs exactly one of 'post' or 'hostedAt'`.

Remove the line again and re-run `npm run build`. Expected: PASS.

Then confirm the optional-em path in a node one-liner rather than by eye:

```bash
node -e "
const emify = (t, em) => em ? t.replace(em, '<em>'+em+'</em>') : t;
const out = emify('thatDangCircuit', undefined);
if (out !== 'thatDangCircuit') { console.error('FAIL:', out); process.exit(1); }
console.log('OK:', out);
"
```

Expected: `OK: thatDangCircuit`.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content/research src/utils/research.ts
git commit -m "feat(content): add a routeless research collection for citable artifacts

Scholarly metadata has been living in an optional \`paper\` block on blog
frontmatter, which assumed every research output is also a post. thatDangCircuit
breaks that assumption: it is software with a Zenodo DOI and no prose on this
site. Squeezing it into the blog collection would have put it in the writing
stream, generated an empty post page for it, and filed thin content in the
sitemap.

The collection generates no routes — it is read at build time by the home-page
Research section and by the post page. Adding an artifact adds no URLs.

An XOR refine on post/hostedAt encodes the real invariant: an artifact has
exactly one canonical home. A malformed entry now fails the build instead of
rendering a card that links nowhere.

thatDangCircuit cites the Zenodo concept DOI (...592), which resolves to the
latest release, rather than the version-pinned ...593.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Rewire `ScholarlyMeta` to the research collection

**This task carries the plan's hardest acceptance gate.** The `paper` block is the on/off switch for every Highwire, Schema.org and Dublin Core tag on the post page. Those tags are the propagation mechanism for a site whose stated purpose is findability. Silently dropping them while refactoring would be worse than the 404 Task 1 fixed.

**Files:**
- Modify: `src/components/seo/ScholarlyMeta.astro`
- Modify: `src/pages/blog/[category]/[slug].astro`
- Modify: `src/content.config.ts` (delete the `paper` block)
- Modify: `src/content/blog/accessibility-concept-emergence-pythia.mdx`
- Test: `tests/e2e/scholarly-metadata.spec.ts`

**Interfaces:**
- Consumes: `getArtifactForPost(postId)`, `type ResearchArtifact` from Task 2.
- Produces: `ScholarlyMeta` with prop `artifact: CollectionEntry<'research'>` (was `post: CollectionEntry<'blog'>`).

- [ ] **Step 1: Capture the current `<head>` as the comparison baseline**

Before changing anything, record what production emits. With the dev server running:

```bash
curl -s http://localhost:4321/blog/research/accessibility-concept-emergence-pythia/ \
  | grep -Eo '<meta name="(citation|DC)[^>]*>' \
  | sort > /tmp/scholarly-before.txt
curl -s http://localhost:4321/blog/research/accessibility-concept-emergence-pythia/ \
  | grep -A2 'application/ld+json' > /tmp/jsonld-before.txt
wc -l /tmp/scholarly-before.txt
```

Expected: 13 meta tags (8 Highwire + 7 Dublin Core, minus any absent optional). Keep both files — Step 7 diffs against them.

- [ ] **Step 2: Rewrite `src/components/seo/ScholarlyMeta.astro`**

Replace the file entirely:

```astro
---
// Emits per-artifact findability metadata: Layer 1 Highwire citation tags,
// Layer 2 Schema.org JSON-LD, Layer 3 Dublin Core. Rendered via slot="head"
// so the <meta> tags land in <head>.
//
// Driven by a `research` collection entry, not by blog frontmatter. The post
// is prose about the artifact; the artifact is the citable record and owns its
// own title, authors, date and DOI. That inversion also deletes the fallback
// chain this component used to carry (paper.abstract ?? post.data.description).
import type { CollectionEntry } from 'astro:content';
import { AUTHOR } from '../../utils/identity';

interface Props {
  artifact: CollectionEntry<'research'>;
}

const { artifact } = Astro.props;
const a = artifact.data;

const canonical = new URL(Astro.url.pathname, Astro.site).toString();
const doiUrl = a.doi ? `https://doi.org/${a.doi}` : undefined;
const pdfUrl = a.pdf ? new URL(a.pdf, Astro.site).toString() : undefined;
const keywordList = a.keywords.join('; ');

// Highwire dates are YYYY/MM/DD; Schema.org + Dublin Core use ISO YYYY-MM-DD.
const d = a.publicationDate;
const hwDate = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
const isoDate = d.toISOString().slice(0, 10);

// The keystone author (name match) carries the ORCID @id + /about/ url;
// co-authors get a plain Person.
const authorLd = a.authors.map((name) =>
  name === AUTHOR.name
    ? { '@type': 'Person', '@id': AUTHOR.orcid, name, url: AUTHOR.aboutUrl }
    : { '@type': 'Person', name },
);

const articleLd = {
  '@context': 'https://schema.org',
  '@type': a.resourceType === 'Software' ? 'SoftwareSourceCode' : 'ScholarlyArticle',
  headline: a.title,
  datePublished: isoDate,
  author: authorLd,
  url: canonical,
  ...(doiUrl && { identifier: doiUrl }),
  abstract: a.abstract,
  keywords: a.keywords,
};
---
{/* Layer 1 — Highwire Press citation tags (what Google Scholar parses) */}
<meta name="citation_title" content={a.title} />
{a.authors.map((name) => <meta name="citation_author" content={name} />)}
<meta name="citation_publication_date" content={hwDate} />
{pdfUrl && <meta name="citation_pdf_url" content={pdfUrl} />}
<meta name="citation_abstract_html_url" content={canonical} />
{a.venue && <meta name="citation_journal_title" content={a.venue} />}
{a.doi && <meta name="citation_doi" content={a.doi} />}
{keywordList && <meta name="citation_keywords" content={keywordList} />}

{/* Layer 2 — Schema.org JSON-LD */}
<script type="application/ld+json" is:inline set:html={JSON.stringify(articleLd)} />

{/* Layer 3 — Dublin Core */}
<meta name="DC.title" content={a.title} />
{a.authors.map((name) => <meta name="DC.creator" content={name} />)}
<meta name="DC.date" content={isoDate} />
{doiUrl && <meta name="DC.identifier" content={doiUrl} />}
{keywordList && <meta name="DC.subject" content={keywordList} />}
<meta name="DC.description" content={a.abstract} />
<meta name="DC.type" content="Text" />
```

- [ ] **Step 3: Wire the reverse lookup in `src/pages/blog/[category]/[slug].astro`**

Change the import line from:

```ts
import { dateLabel, categorySlug, emify } from '../../../utils/posts';
```

to:

```ts
import { dateLabel, categorySlug, emify } from '../../../utils/posts';
import { getArtifactForPost } from '../../../utils/research';
```

After the existing `const { Content } = await render(post);` line, add:

```ts
// Scholarly metadata lives in the `research` collection, keyed back to this
// post by id. A post with no artifact record simply emits nothing.
const artifact = await getArtifactForPost(post.id);
```

Replace:

```astro
    {post.data.paper && <ScholarlyMeta slot="head" post={post} />}
```

with:

```astro
    {artifact && <ScholarlyMeta slot="head" artifact={artifact} />}
```

Replace the byline block:

```astro
          {post.data.paper && (
            <p class="post-detail__byline">By {post.data.paper.authors.join(', ')}</p>
          )}
```

with:

```astro
          {artifact && (
            <p class="post-detail__byline">By {artifact.data.authors.join(', ')}</p>
          )}
```

- [ ] **Step 4: Delete the `paper` block from the blog schema**

In `src/content.config.ts`, delete this entire block from the `blog` schema (the whole `paper: z.object({...}).optional(),` including its leading comment):

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

- [ ] **Step 5: Remove the `paper` block from the Pythia post's frontmatter**

In `src/content/blog/accessibility-concept-emergence-pythia.mdx`, delete the `paper:` key and everything nested under it. The frontmatter should end up as:

```yaml
---
title: 'Accessibility Concept Emergence in the Pythia Suite: Thresholds, Binding, and the Declarative-Evaluative Gap'
titleEm: Declarative-Evaluative Gap
description: Sustained deep-network binding of accessibility compounds appears to be a necessary structural condition for behavioral capability — present in every model that correctly defines core concepts, absent in every model that fails.
pubDate: 2026-05-24
category: Research
tags:
- accessibility
---
```

Leave the post body untouched.

- [ ] **Step 6: Add the drift guard and the "no artifact, no tags" test**

The paper title now exists in two files. Drift between `citation_title` and the page `<h1>` is a silent findability bug, so make it a build-visible one. Add to `tests/e2e/scholarly-metadata.spec.ts`:

```ts
test('artifact title matches its linked post title (drift guard)', async ({ page }) => {
  await page.goto(PAPER_URL);
  // citation_title comes from the research entry; the <h1> comes from the post.
  // They are separate files and must not drift apart.
  const citationTitle = await metaContent(page, 'citation_title');
  const h1 = await page.locator('h1.post-detail__title').textContent();
  expect(citationTitle).toBe(h1?.trim());
});
```

- [ ] **Step 7: ACCEPTANCE GATE — diff the rendered `<head>` against the baseline**

This is the criterion, not a step to skim. With the dev server running:

```bash
curl -s http://localhost:4321/blog/research/accessibility-concept-emergence-pythia/ \
  | grep -Eo '<meta name="(citation|DC)[^>]*>' \
  | sort > /tmp/scholarly-after.txt
diff /tmp/scholarly-before.txt /tmp/scholarly-after.txt
```

**Expected: empty diff.** Not "mostly the same" — byte-identical. If any line is missing, stop and fix before continuing; a lost tag is the failure mode this whole task exists to prevent.

Then confirm the five required tags are individually present and correct:

```bash
for tag in citation_title citation_author citation_doi citation_pdf_url citation_publication_date; do
  printf '%s: ' "$tag"
  curl -s http://localhost:4321/blog/research/accessibility-concept-emergence-pythia/ \
    | grep -o "<meta name=\"$tag\" content=\"[^\"]*\"" || echo "MISSING"
done
```

Expected, all five present:
- `citation_title` — the full "Accessibility Concept Emergence in the Pythia Suite: Thresholds, Binding, and the Declarative-Evaluative Gap"
- `citation_author` — `Trisha Salas`, exactly one occurrence
- `citation_doi` — `10.5281/zenodo.20360787`
- `citation_pdf_url` — `https://trishasalas.com/papers/accessibility-concept-emergence-pythia.pdf`
- `citation_publication_date` — `2026/05/24`

And the JSON-LD:

```bash
curl -s http://localhost:4321/blog/research/accessibility-concept-emergence-pythia/ \
  | grep -A2 'application/ld+json' | diff - /tmp/jsonld-before.txt
```

Expected: empty diff.

- [ ] **Step 8: Run the full suite**

Run: `npx playwright test`
Expected: `36 passed` (35 from Task 1 + the drift guard). Zero failures.

Confirm specifically that `non-paper post emits no citation/article/DC metadata` still passes — `testing-accessibility-knowledge-pythia` has no research entry, so the lookup returns `undefined` and nothing renders.

- [ ] **Step 9: Commit**

```bash
git add src/components/seo/ScholarlyMeta.astro \
        'src/pages/blog/[category]/[slug].astro' \
        src/content.config.ts \
        src/content/blog/accessibility-concept-emergence-pythia.mdx \
        tests/e2e/scholarly-metadata.spec.ts
git commit -m "refactor(seo): drive scholarly metadata from the research collection

The paper block was the on/off switch for every Highwire, Schema.org and Dublin
Core tag on a post page. Moving it out of blog frontmatter meant rebuilding that
switch as a reverse lookup: the post finds its artifact by id, and emits nothing
when there isn't one.

Verified by diffing the rendered <head> before and after — byte-identical for
all 13 citation/DC tags and the JSON-LD block. On a site whose purpose is
findability, quietly dropping a propagation tag while refactoring would have
been a worse bug than the 404 it followed.

The inversion also deleted this component's fallback chain. paper.abstract ??
post.data.description existed only because the data was squatting in a schema
that wasn't shaped for it; a self-contained artifact record supplies everything
directly.

The paper title now lives in two files, so there is a test asserting
citation_title matches the post <h1>. Drift between what Scholar reads and what
humans read is exactly the kind of thing that fails silently for months.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `Research.astro` derives from the collection

**Files:**
- Modify: `src/components/sections/Research.astro`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `getResearchArtifacts`, `statusLabel`, `metaItems`, `artifactHref`, `artifactYear` from Task 2; `emify` from `src/utils/posts.ts`.
- Produces: nothing consumed downstream.

- [ ] **Step 1: Write the failing test first**

Add to `tests/e2e/home.spec.ts`:

```ts
test('research cards derive from the research collection', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.paper');
  await expect(cards).toHaveCount(2);

  // Card 1 — the Pythia paper, newest first by publication date.
  const pythia = cards.nth(0);
  await expect(pythia.locator('.paper__status')).toContainText('Published · Zenodo');
  await expect(pythia.locator('.paper__status')).toContainText('2026');
  await expect(pythia.locator('.paper__title')).toContainText(
    'Accessibility Concept Emergence in the Pythia Suite',
  );
  // shortTitleEm renders as rose italic.
  await expect(pythia.locator('.paper__title em')).toHaveText('Pythia');
  await expect(pythia.locator('.paper__meta li')).toContainText([
    'DOI · 10.5281/zenodo.20360787',
    'Cited in 1',
  ]);
  await expect(pythia.locator('.paper__title a')).toHaveAttribute(
    'href',
    '/blog/research/accessibility-concept-emergence-pythia/',
  );

  // Card 2 — thatDangCircuit. Software voice, external home, no shortTitleEm.
  const circuit = cards.nth(1);
  await expect(circuit.locator('.paper__status')).toContainText('Software · Zenodo');
  await expect(circuit.locator('.paper__title')).toHaveText('thatDangCircuit');
  // shortTitleEm is omitted — the title must render intact and unemphasized.
  await expect(circuit.locator('.paper__title em')).toHaveCount(0);
  await expect(circuit.locator('.paper__meta li')).toContainText([
    'DOI · 10.5281/zenodo.21604592',
    'Software · v1.0.0',
  ]);
  await expect(circuit.locator('.paper__title a')).toHaveAttribute(
    'href',
    'https://zenodo.org/records/21604593',
  );
});

test('no paper card data is hardcoded in the component', async ({ page }) => {
  await page.goto('/');
  // Guards the wiring: if someone re-inlines a DOI, this still passes — but
  // the grep in the plan's acceptance criteria will not. Kept as a render
  // check that both cards resolved from data rather than rendering empty.
  const abstracts = page.locator('.paper__abstract');
  await expect(abstracts).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await expect(abstracts.nth(i)).not.toBeEmpty();
  }
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: FAIL. The second card still reads `In progress · TACCESS`, and `.paper__title` on card 2 contains "When ARIA is everywhere and alt-text is nowhere".

- [ ] **Step 3: Replace the component's frontmatter**

In `src/components/sections/Research.astro`, replace everything between the opening `---` and closing `---` (the hardcoded `papers` array and the local `emify`) with:

```ts
import {
  getResearchArtifacts,
  statusLabel,
  metaItems,
  artifactHref,
  artifactYear,
} from '../../utils/research';
import { emify } from '../../utils/posts';

const papers = await getResearchArtifacts();
```

The local `emify(title, em)` is deleted. `utils/posts.ts` already exports the same function one directory away, with the better signature — `em` is optional there, which is what the omitted-`shortTitleEm` path needs.

- [ ] **Step 4: Rewrite the markup block**

Replace the `<section>` body's `.papers` div with the version below. The desk comment is load-bearing and stays exactly as written:

```astro
  <!-- two papers, three more on the desk; she counts the unfinished ones too -->
  <div class="papers">
    {papers.map((p) => (
      <article class="paper">
        <header class="paper__status">
          <span>
            <span class="paper__dot"></span>
            {statusLabel(p)}
          </span>
          <span>{artifactYear(p)}</span>
        </header>
        <h3 class="paper__title">
          <a
            href={artifactHref(p)}
            set:html={emify(p.data.shortTitle, p.data.shortTitleEm)}
          ></a>
        </h3>
        <p class="paper__abstract">{p.data.abstract}</p>
        <ul class="paper__meta">
          {metaItems(p).map((m) => <li>{m}</li>)}
        </ul>
      </article>
    ))}
  </div>
```

Two notes on what changed and why:
- Every artifact now has a home (`post` or `hostedAt`), so the `href ? … : …` branch is gone — the title is always a link.
- `class:list` on the dot is gone with it, since nothing is `draft` anymore. **Leave the `.paper__dot--draft` CSS rule in place.** This is a wiring change; deleting design vocabulary is not wiring, and an in-progress artifact will want it back.

- [ ] **Step 5: Annotate the parked CSS rule**

So the unused rule does not read as cruft to the next reader, change:

```css
  .paper__dot--draft {
```

to:

```css
  /* Parked deliberately: no in-progress artifact is on the page today, but the
     hollow dot is the established vocabulary for one. Re-applied by the
     component when the research schema grows an in-progress state. */
  .paper__dot--draft {
```

- [ ] **Step 6: Run the tests and verify they pass**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: PASS, including the pre-existing `home page renders all major sections`.

- [ ] **Step 7: Acceptance — no paper data left in components**

```bash
grep -rn "10.5281/zenodo" src/components/ src/pages/ ; echo "exit: $?"
```

Expected: no matches, exit 1.

```bash
grep -rn "10.5281/zenodo" src/content/
```

Expected: matches in `src/content/research/*.md` only.

Confirm the comment survived:

```bash
grep -n "three more on the desk" src/components/sections/Research.astro
```

Expected: exactly one match.

- [ ] **Step 8: Run the full suite and build**

Run: `npm run build && npx playwright test`
Expected: build passes; `38 passed`.

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/Research.astro tests/e2e/home.spec.ts
git commit -m "refactor(home): derive research cards from the collection

The papers array was hardcoded in the component while the same paper existed as
an MDX entry one directory away — and the DOI lived in the copy that was not the
content collection. The cards now read from the research collection, so adding
an artifact is a content change, not a code change.

Replaced the TACCESS placeholder with thatDangCircuit. TACCESS was never
started: no post, no artifact, no date. thatDangCircuit is real, has a Zenodo
concept DOI, and reads in the Software voice rather than the journal voice
because Zenodo types it that way.

Deleted the component's local emify. utils/posts.ts exported the same function
with a better signature — em optional rather than required — which is exactly
what an artifact with no shortTitleEm needs.

Kept the hollow-dot draft CSS, annotated as parked. This was a wiring change;
deleting design vocabulary is not wiring.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Close the two silent-failure schema holes

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/content/blog/i-am-the-paper.mdx`
- Move: `src/content/template.mdx` → `docs/content-template.mdx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Prove the `titleEm` hole exists before fixing it**

`emify()` uses `String.replace()`. A `titleEm` that is not a substring of `title` returns the title unchanged — no error, build passes, the rose italic silently is not there.

Temporarily change `titleEm` in `src/content/blog/golden-gate-claude.mdx` from `Bridge Boy` to `Bridge boy` (lowercase b), then:

Run: `npm run build`
Expected: **PASS** — this is the bug. The emphasis is now silently gone.

Revert the typo before continuing.

- [ ] **Step 2: Add the substring refine to the blog schema**

In `src/content.config.ts`, change the `blog` collection's schema from `z.object({ … })` to `z.object({ … }).refine(…)` by appending after the closing brace of the object:

```ts
  }).refine(
    (d) => !d.titleEm || d.title.includes(d.titleEm),
    { message: 'titleEm must be a substring of title', path: ['titleEm'] },
  ),
```

The `research` collection already carries the equivalent refine for `shortTitleEm` from Task 2.

- [ ] **Step 3: Verify the refine catches the typo**

Re-apply the `Bridge boy` typo from Step 1, then:

Run: `npm run build`
Expected: **FAIL** with `titleEm must be a substring of title`.

Revert the typo. Run `npm run build`. Expected: PASS.

- [ ] **Step 4: Tighten `description`**

`description: z.string()` accepts `''`, producing an empty `<meta name="description">` and empty `og:description`. In the `blog` schema, change:

```ts
    description: z.string(),
```

to:

```ts
    description: z.string().min(1),
```

- [ ] **Step 5: Run the build and let it fail**

Run: `npm run build`
Expected: FAIL on `i-am-the-paper.mdx` — `description` is `''`. The failure is the point.

- [ ] **Step 6: Give `i-am-the-paper.mdx` a real description**

In `src/content/blog/i-am-the-paper.mdx`, change:

```yaml
description: ''
```

to:

```yaml
description: On being the instrument as well as the author — what it means to run the study you are also inside of.
```

- [ ] **Step 7: Move the template out of the content directory**

`src/content/template.mdx` also has `description: ''`, but it sits outside the glob base (`./src/content/blog`) so it is never validated. Leaving an unvalidated file that looks like content next to real content is a trap for the next person.

```bash
git mv src/content/template.mdx docs/content-template.mdx
```

- [ ] **Step 8: Verify**

Run: `npm run build && npx playwright test`
Expected: build passes; `38 passed`.

- [ ] **Step 9: Commit**

```bash
git add src/content.config.ts src/content/blog/i-am-the-paper.mdx docs/content-template.mdx
git commit -m "fix(schema): turn two silent content failures into build failures

emify() is a String.replace(). A titleEm that isn't a substring of title — a
typo, a case mismatch, a curly apostrophe against a straight one — returned the
title unchanged, passed the build, and dropped the rose italic with no signal
anywhere. Verified the hole by lowercasing one character in golden-gate-claude
and watching the build stay green.

description: z.string() accepted the empty string, which shipped as an empty
meta description and an empty og:description. i-am-the-paper had exactly that
and now has a real one.

Moved template.mdx to docs/. It lives outside the blog glob base so it was never
validated — an unvalidated file that looks like content, sitting next to
content, is a trap.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Stop indexing empty category pages

**Files:**
- Modify: `src/utils/posts.ts`
- Modify: `src/pages/blog/[category]/index.astro`
- Modify: `src/content.config.ts`
- Test: `tests/e2e/blog-index.spec.ts`

**Interfaces:**
- Consumes: `getPublishedPosts` (existing).
- Produces: `getPopulatedCategories(): Promise<Category[]>`.

**Verified category distribution** (all eight blog entries read, 2026-07-26):

| Category | Entries | Published (prod) |
|---|---|---|
| Research | 2 | 2 |
| Essay | 4 (1 draft) | 3 |
| Claude-isms | 1 | 1 |
| Process | 1 (draft) | **0** |
| Personal | 0 | **0** |
| The-Notes | 0 | **0** |

So `/blog/process/` is populated in dev and empty in prod — the class of bug that never shows up locally. `/blog/personal/` and `/blog/the-notes/` are empty everywhere.

- [ ] **Step 1: Write the failing test**

Add to `tests/e2e/blog-index.spec.ts`:

```ts
test('empty category pages are not built', async ({ request }) => {
  // Personal has no posts at all — in dev or prod. It must not exist as a page,
  // because an indexable "Nothing here yet." is a soft-404 on a site whose
  // stated purpose is findability.
  const res = await request.get('/blog/personal/');
  expect(res.status()).toBe(404);
});

test('category sidebar links only to categories that exist', async ({ page, request }) => {
  await page.goto('/blog/research/');
  const hrefs = await page.locator('.category-nav a').evaluateAll((links) =>
    links.map((l) => l.getAttribute('href')).filter((h): h is string => !!h),
  );
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `${href} must not 404`).toBe(200);
  }
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npx playwright test tests/e2e/blog-index.spec.ts`
Expected: FAIL — `/blog/personal/` returns 200 with body "Nothing here yet."

- [ ] **Step 3: Drop `The-Notes` from the category enum**

Notes become their own collection in Plan B, so the category was always the wrong shape for them. In `src/content.config.ts`, change:

```ts
    category: z.enum([
      "Research",
      "Essay",
      "Personal",
      "Process",
      "Claude-isms",
      "The-Notes"
    ]),
```

to:

```ts
    category: z.enum([
      "Research",
      "Essay",
      "Personal",
      "Process",
      "Claude-isms",
    ]),
```

And in `src/utils/posts.ts`, change:

```ts
export const CATEGORIES = [
  'Research',
  'Essay',
  'Personal',
  'Process',
  'Claude-isms',
  'The-Notes',
] as const satisfies readonly Category[];
```

to:

```ts
export const CATEGORIES = [
  'Research',
  'Essay',
  'Personal',
  'Process',
  'Claude-isms',
] as const satisfies readonly Category[];
```

No content uses `The-Notes`, so nothing breaks. Confirm:

```bash
grep -rn "The-Notes" src/
```

Expected: no matches.

- [ ] **Step 4: Add `getPopulatedCategories()` to `src/utils/posts.ts`**

Append to the file:

```ts
/**
 * Categories with at least one post that survives the same prod/dev draft
 * filter getPublishedPosts() applies.
 *
 * This is draft-sensitive in a way getStaticPaths() cannot see on its own:
 * Process contains exactly one post and it is a draft, so the category is
 * populated in dev and empty in production. Building the page anyway ships an
 * indexable "Nothing here yet." — thin content and a soft-404 signal.
 */
export async function getPopulatedCategories(): Promise<Category[]> {
  const posts = await getPublishedPosts();
  const populated = new Set(posts.map((p) => p.data.category));
  return CATEGORIES.filter((c) => populated.has(c));
}
```

- [ ] **Step 5: Filter `getStaticPaths` and the sidebar nav**

In `src/pages/blog/[category]/index.astro`, change the import block from:

```ts
import {
  getPublishedPosts,
  dateLabel,
  emify,
  categorySlug,
  postHref,
  CATEGORIES,
  type Category,
} from '../../../utils/posts';
```

to:

```ts
import {
  getPublishedPosts,
  getPopulatedCategories,
  dateLabel,
  emify,
  categorySlug,
  postHref,
  type Category,
} from '../../../utils/posts';
```

Change `getStaticPaths` from:

```ts
export async function getStaticPaths() {
  return CATEGORIES.map((c) => ({
    params: { category: categorySlug(c) },
    props: { category: c },
  }));
}
```

to:

```ts
export async function getStaticPaths() {
  const categories = await getPopulatedCategories();
  return categories.map((c) => ({
    params: { category: categorySlug(c) },
    props: { category: c },
  }));
}
```

After the `const posts = …` line, add:

```ts
// The sidebar must not link to categories that no longer build — every link
// here would otherwise be a guaranteed 404.
const otherCategories = (await getPopulatedCategories()).filter((c) => c !== category);
```

Change the sidebar list from:

```astro
        {CATEGORIES.filter((c) => c !== category).map((c) => (
            <li><a href={`/blog/${categorySlug(c)}/`}>{c}</a></li>
        ))}
```

to:

```astro
        {otherCategories.map((c) => (
            <li><a href={`/blog/${categorySlug(c)}/`}>{c}</a></li>
        ))}
```

- [ ] **Step 6: Simplify the now-unreachable empty-state copy**

Because only populated categories build, `posts.length === 0` can no longer happen. Leaving the branch implies otherwise. Change:

```astro
        <p class="blog-index__lede">
          {posts.length === 0
            ? 'Nothing here yet.'
            : `Everything filed under ${category}. ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}.`}
        </p>
```

to:

```astro
        <!-- No empty state: getStaticPaths only builds populated categories. -->
        <p class="blog-index__lede">
          {`Everything filed under ${category}. ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}.`}
        </p>
```

And remove the now-always-true guard around the list, changing:

```astro
      {posts.length > 0 && (
        <ul class="blog-index__list">
```

to:

```astro
      <ul class="blog-index__list">
```

…deleting the matching `)}` after the closing `</ul>` so the markup stays balanced.

- [ ] **Step 7: Run the tests and verify they pass**

Run: `npx playwright test tests/e2e/blog-index.spec.ts`
Expected: PASS.

- [ ] **Step 8: Verify the prod-only case explicitly**

The dev server shows drafts, so `/blog/process/` exists in dev. Confirm it does **not** in a production build:

```bash
npm run build
ls dist/blog/
```

Expected: `research/`, `essay/`, `claude-isms/` and the post directories. **No** `process/`, **no** `personal/`, **no** `the-notes/`.

```bash
grep -c 'blog/personal' dist/sitemap-0.xml || echo "absent (good)"
```

Expected: `absent (good)`.

- [ ] **Step 9: Full suite**

Run: `npx playwright test`
Expected: `40 passed`.

- [ ] **Step 10: Commit**

```bash
git add src/utils/posts.ts 'src/pages/blog/[category]/index.astro' \
        src/content.config.ts tests/e2e/blog-index.spec.ts
git commit -m "fix(blog): stop building and indexing empty category pages

getStaticPaths mapped every category in the enum regardless of whether any
published post existed, so /blog/personal/ and /blog/the-notes/ shipped as
indexable pages reading 'Nothing here yet.' — thin content and a soft-404
signal on a site whose stated purpose is findability.

/blog/process/ was the interesting one: it holds exactly one post and that post
is a draft, so the category is populated in dev and empty in production. The
class of bug that never reproduces locally.

The sidebar nav had the same defect from the other direction — it linked to
every category in the enum, so trimming the built pages without trimming the nav
would have traded thin content for guaranteed 404s.

Dropped The-Notes from the enum. Notes are getting their own collection; the
category was always the wrong shape for content with no title and no
description.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Cruft

**Files:**
- Delete: `src/components/seo/Plausible.astro`
- Delete: `deno.lock`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm `Plausible.astro` is genuinely unused**

```bash
grep -rn "Plausible" src/ --include='*.astro' --include='*.ts'
```

Expected: exactly one match — the file's own internal comment. `Base.astro` imports `GoogleAnalytics`, not this.

- [ ] **Step 2: Delete it**

```bash
git rm src/components/seo/Plausible.astro
```

It is recoverable from git history if analytics ever move; an unreferenced component in `src/` reads as "in use" to everyone who greps.

- [ ] **Step 3: Confirm `deno.lock` is untracked, then remove it**

```bash
git ls-files --error-unmatch deno.lock 2>&1 | head -1
```

Expected: `error: pathspec 'deno.lock' did not match any file(s) known to git` — it is gitignored and untracked, so this is a working-tree deletion only.

```bash
rm -f deno.lock
```

- [ ] **Step 4: Fix the CLAUDE.md drift**

`CLAUDE.md` onboards the next assistant, so a stale field name there means someone reaches confidently for `post.data.tag` and finds nothing.

In the URL structure section, change:

```markdown
- `/blog/` — full writing archive, grouped by `tag` (`Research`, `Essay`, `Process`, `Personal`)
```

to:

```markdown
- `/blog/` — full writing archive. Posts carry a `category` (`Research`, `Essay`, `Personal`, `Process`, `Claude-isms`); `/blog/` is a flat chronological list and `/blog/<category>/` are the grouped indexes. Only categories with at least one published post are built. Note the field is `category`, not `tag` — `tags` is a separate free-string array, currently unrendered.
```

In the "Where things live" table, add a row after the `src/` row:

```markdown
| `src/content/research/` | Citable artifacts (papers, software) as a **routeless** collection. Generates no URLs — read by `Research.astro` for the home-page cards and by `blog/[category]/[slug].astro`, which reverse-looks-up by `post` id to attach Highwire/Schema.org/Dublin Core tags. An artifact has exactly one home: `post` (a page here) or `hostedAt` (external). |
```

- [ ] **Step 5: Verify nothing broke**

Run: `npm run build && npx playwright test`
Expected: build passes; `40 passed`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove unused analytics component and correct CLAUDE.md drift

Plausible.astro was never imported — Base.astro uses GoogleAnalytics. An
unreferenced component sitting in src/ reads as in-use to anyone grepping, and
it is recoverable from history if analytics ever move.

deno.lock was gitignored and untracked, left behind by a Netlify CLI deploy.

CLAUDE.md said /blog/ groups by 'tag' when the code has always used 'category',
and listed four categories against an enum of six. That file exists to onboard
the next assistant; a wrong field name there sends someone confidently reaching
for post.data.tag. Documented the research collection while in there.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Plan-level acceptance

Run all of these before calling Plan A done:

```bash
npm run build                    # passes
npm run check                    # astro check — no new errors
npx playwright test              # 40 passed, 0 failed
```

- [ ] `grep -rn "10.5281/zenodo" src/components/ src/pages/` returns nothing.
- [ ] `grep -n "three more on the desk" src/components/sections/Research.astro` returns exactly one match.
- [ ] `/tmp/scholarly-before.txt` and `/tmp/scholarly-after.txt` from Task 3 diff clean.
- [ ] `dist/blog/` contains no `personal/`, `process/`, or `the-notes/` directories.
- [ ] Home page renders two research cards; the second links to Zenodo and has no `<em>` in its title.
- [ ] `curl -sI http://localhost:4321/papers/accessibility-concept-emergence-pythia.pdf` returns 200.

## Decisions taken as defaults — reversible at review

Each is a one-line change; flagged so they are decisions, not accidents.

1. **thatDangCircuit's card links to the Zenodo version record** (`/records/21604593`), not the repo and not the concept-DOI URL. Rationale: it is the citable landing page and carries the citation block, license, and Software Heritage / OpenAIRE links. To change: edit `hostedAt` in `src/content/research/that-dang-circuit.md`.
2. **`shortTitleEm` omitted** for thatDangCircuit. To change: add the field; the schema refine enforces it is a real substring, and the Task 4 test asserting `toHaveCount(0)` on `.paper__title em` will need updating.
3. **The paper title is duplicated** between the post and the artifact record, guarded by a drift test, rather than made optional-with-fallback. Conditional validation would have been the clever that bites, and `hostedAt`-only entries need a title regardless.
4. **`.paper__dot--draft` CSS retained** and annotated rather than deleted.
5. **`scope: "Software · v1.0.0"`** on thatDangCircuit renders verbatim as a meta chip, per the structured-values rule.

## Out of scope

- **Phase 6 — the capture path** (Netlify link, GitHub Contents API, iOS Shortcut). The source spec calls it "separate session" and "not code in this repo." It also requires interactively linking Netlify and minting a fine-grained PAT, neither of which is verifiable from here. Follow-up after Plan B.
- **Self-hosting fonts via fontsource.** Low priority per spec; becomes marginally more load-bearing once Plan B puts mono on body text. Separate change.
- Everything in Plan B: the notes collection, the Notes section, `/notes/` routes, and RSS.

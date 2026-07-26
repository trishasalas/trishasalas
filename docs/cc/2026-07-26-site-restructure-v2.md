# Site restructure — publications, notes, and the red specs

**Date:** 2026-07-26
**Status:** Ready to implement
**Supersedes:** `2026-07-25-notes-collection-and-homepage-restructure.md` (do not read it — it contains a data model that was replaced and a requirement contradiction that was resolved)
**Branch:** in progress

---

**Punchline:** Three plans. **Plan A** fixes three broken things and moves research artifacts into their own collection. **Plan B** adds the notes stream. **Plan C** migrates the post URL space to `/writing/[slug]/` and puts redirects under version control. Plan A ships alone. Plan C should ship on its own deploy — see sequencing.

Read this document only. The v1 spec is retained for decision history, not for implementation.

---

## Motivation

Trisha captures research thoughts at odd hours. Publishing currently requires an editor and a terminal — appropriate friction for an essay, fatal friction for a twelve-word observation. Thoughts get discarded at the moment of having them.

Separately, the home page shows only finished work, which makes the research read as if it arrived fully formed. The hero copy already claims otherwise ("Not everything here is finished. *That's sort of the point.*") and that line currently sits above a list of finished things.

And three things are actually broken (see Plan A, phase 0).

---

## Home-page structure

`src/pages/index.astro` currently renders:

```
Hero → Research → Writing → Lineage
```

Becomes:

```
Hero → Research → Writing → Notes → Lineage
```

`Lineage` stays last — it is the closing About section, not a content stream.

| Section | Content | Type treatment |
|---|---|---|
| `Research` | Artifacts only. Cards, visually unchanged — but derived, not hardcoded. | Display serif |
| `Writing` | All long-form posts, all categories, one merged stream. | Display serif |
| `Notes` | Short-form capture. | **Monospace** |

### Naming migration

`Writing.astro` currently carries the eyebrow `The Writing` and the `<h2>` "Notes from the margin." Those swap ownership:

- `Writing` section takes **"The Writing"** as its heading.
- `Notes` section takes **"Notes from the margin."**

This is a correction, not a rename. Marginalia is short, reactive, and written alongside something else — which describes the notes and has never described the essays. The metaphor is already load-bearing (the vertical rail reads "Inkling doodles in the margins of the context window"); this points it at the right content.

### The Writing merge is a DISPLAY merge, not a taxonomy merge

Categories remain. They remain in post URLs. What changes is that Research stops having its own homepage *section* for posts — the section now shows artifacts instead. Do not "finish" this merge by flattening routes.

### Why Research stays as cards

The cards present **artifacts** — DOI, venue, status, citation count. That is credentialing, and it is the only thing on the page that tells a cold visitor "this person publishes." Flattening papers into a chronological post stream makes them read as blog entries.

Per `CLAUDE.md`, findability is load-bearing and the site partly does the discoverability job arXiv normally would. Do not merge Research into Writing.

---

# PLAN A — foundations

Shippable alone. Nothing in Plan B depends on it.

## Phase 0 — the three red specs (run FIRST, get to green before anything else)

A green baseline is what makes the rest of Plan A verifiable. Otherwise new breakage is indistinguishable from the two pre-existing test failures.

### 0a. `citation_pdf_url` is a 404

Frontmatter advertises `/papers/accessibility-concept-emergence-pythia.pdf`. The actual file is `public/papers/accessibility-concept-emergence.pdf`.

**Fix: rename the FILE to match the frontmatter.**

```
public/papers/accessibility-concept-emergence.pdf
  -> public/papers/accessibility-concept-emergence-pythia.pdf
```

That direction is correct whether or not Google Scholar has already indexed the advertised URL. The reverse fix only works if it hasn't.

This is the Highwire tag Scholar follows to fetch full text. It may be a concrete reason the paper isn't propagating. Treat as high priority.

### 0b. `docs/social-urls.md` lists the wrong canonical DOI

**Decision made: Zenodo is canonical.** Authorea is recorded as the preprint / related identifier, not as the paper DOI.

Update `docs/social-urls.md` to `10.5281/zenodo.20360787`. That matches shipped content, so both pre-existing test failures go green together.

### 0c. Confirm the suite is green before proceeding

---

## Phase 1 — `publications` collection

**Files:** `src/content.config.ts`, `src/content/publications/`, `src/utils/publications.ts` (new)

### Naming: NOT `research`

`research` collides with the existing `Research` blog category. Two different things at two different levels of the model, one name. `getCollection('research')` sitting next to `category === 'Research'` in the same file is a trap.

Use **`publications`**. No routes exist yet, so the cost of getting this right is zero today and nonzero forever after.

### Why a separate collection, not a `paper` block on `blog`

thatDangCircuit is a research output with **no post**. If it becomes a `blog` entry just to carry artifact metadata, three things happen that nobody wants:

- it renders as a post card in `Writing.astro` and `/blog/`
- `[slug].astro`'s `getStaticPaths` generates a post page with an empty body
- it lands in `/blog/research/` and the sitemap as thin content — the exact soft-404 problem Phase 4a exists to fix

Suppressing that with an optional `hostedAt` sentinel means every consumer of `getCollection('blog')` needs to know about an exception. That is the same pattern rejected for notes. Doing one and not the other is inconsistent.

**Three content types, three collections:**

| Collection | What it holds | Routes |
|---|---|---|
| `publications` | Artifacts. External, DOI'd, dated. May or may not have a write-up. | **none** |
| `blog` | Posts. Live here, have bodies. | `/blog/[category]/[slug]/` |
| `notes` | Capture. (Plan B) | `/notes/[slug]/` |

### Schema

```ts
const publications = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/publications" }),
  schema: z.object({
    title: z.string(),                  // full scholarly title
    shortTitle: z.string(),             // running head; what the card displays
    shortTitleEm: z.string().optional(),
    abstract: z.string(),
    doi: z.string(),
    venue: z.string(),                  // "Zenodo" — the DOI's home; card display, NOT a journal tag
    journalTitle: z.string().optional(),// citation_journal_title emitted IFF set (see note below); unset on both current entries
    kind: z.enum(['article', 'software']),
    publicationDate: z.coerce.date(),
    hostedAt: z.string().url(),
    citedBy: z.number().optional(),
    scope: z.string().optional(),
    post: z.string().optional(),        // slug of the write-up, if one exists
  }),
});
```

**On `shortTitle` vs `title`:** this is not duplication. Journals request a short title separately from the full one (cf. running head). `shortTitle` is what the card shows; `title` is what gets cited. Likewise `abstract` (scholarly prose) is not `description` (a ~155-char meta tag). Different artifacts that share a subject.

**Do not** name these `cardTitle` / `cardAbstract`. There is no "Card" concept in the codebase — the vocabulary is `paper` / `.paper__title` / `.paper__abstract`. And "short title" names the scholarly concept rather than the container, so it survives being rendered outside a card.

**On `journalTitle` (presence-driven `citation_journal_title`):** `ScholarlyMeta` emits `citation_journal_title` **if and only if `journalTitle` is set** — it is not derived from `venue`. Per Google Scholar's inclusion guidelines, `citation_journal_title` is reserved for journal/conference papers; the three universally required tags are `citation_title`, `citation_author`, `citation_publication_date`. A repository deposit (Zenodo) has no journal, so emitting the repository name there would falsely assert Zenodo is the journal. The rule is inverted deliberately — *emit only when a journal is explicitly named*, rather than *classify which venues count as repositories* (which would require maintaining a list). Both current entries leave `journalTitle` unset; adding a real journal later is a data change with no code change. **This already shipped** on the `blog` `paper` block ahead of this collection (the wrong tag was live in production asserting Zenodo-as-journal); Phase 3 only moves the existing presence-check from `paper.journalTitle` to the publications entry.

### Migration

Extract the `paper` block out of `accessibility-concept-emergence-pythia.mdx` into a `publications` entry with `post: 'accessibility-concept-emergence-pythia'`. The MDX stays a post; it stops carrying artifact metadata. **Drop the `paper` block from the blog schema entirely** once done.

### The two entries

**1. Pythia paper** — migrated from the existing hardcoded card. `kind: 'article'`, `citedBy: 1`, `post:` set.

**2. thatDangCircuit** — replaces the TACCESS entry, which is dropped entirely (it was never started; no post, no artifact, no date).

```
title:            thatDangCircuit v1.0.0 — compound binding is distributed
shortTitle:       thatDangCircuit
shortTitleEm:     (omitted — see open items)
doi:              10.5281/zenodo.21604592
venue:            Zenodo
kind:             software
publicationDate:  2026-07-26
hostedAt:         https://zenodo.org/records/21604593
scope:            Software · v1.0.0
post:             (omitted — no write-up exists)
```

**DOI note:** `...592` is the CONCEPT DOI and always resolves to the latest version. `...593` is v1.0.0 specifically. Use 592.

Repo: `https://github.com/trishasalas/thatDangCircuit`. Also mirrored to Software Heritage, indexed in OpenAIRE.

**Abstract** (register-matched to the Pythia card, all three sentences — "the redundancy is the finding" is the payoff and trimming it loses the point of the study):

> A negative localization result for noun-noun compound binding across GPT-2 and Pythia — probed by head ablation, residual-stream cosine, and projection steering. Binding proves distributed and redundant rather than circuit-localized: ablating the top-scoring heads shifts it by roughly 1%, with compensation elsewhere in the network, and the pre-registered steering prediction was falsified. The redundancy is the finding.

**Consequence:** both entries are `live` with real publication dates. The year-derivation problem that the TACCESS placeholder created does not arise. Do not invent a `pubDate`.

---

## Phase 2 — `Research.astro` derives

**File:** `src/components/sections/Research.astro`

Currently the `papers` array is hardcoded inline — title, abstract, `DOI · 10.5281/zenodo.20360787`, status, year. Derive from `getCollection('publications')` instead, sorted by `publicationDate` desc.

### Requirements

1. No inline publication data in the component.
2. **Rendered output visually unchanged.** Same card markup, same quill hover, same status dot, same two-column grid. The card-specific strings now live in `publications` frontmatter (`shortTitle`, `shortTitleEm`, `abstract`), so this is achievable — it is a wiring change, not a redesign.
3. `href` = `post` slug if present, else `hostedAt`.
4. Status line derives from `venue` + `kind`. thatDangCircuit reads **`Software · Zenodo`**, not `Published · Zenodo` — Zenodo types it as Software and it should not read in the same voice as the journal-style paper card.
5. **Delete the local `emify`; import from `src/utils/posts.ts`.** The local copy has signature `(title, em)` with `em` required; utils has `(title, em?)` with it optional. Same function, two signatures, one file away.

### The desk comment survives verbatim

```
<!-- two papers, three more on the desk; she counts the unfinished ones too -->
```

Hard constraint. It describes a hardcoded array that is about to stop existing, which is exactly the kind of thing a refactor silently eats. It is still true afterward.

---

## Phase 3 — rewire `ScholarlyMeta` (BLOCKING GATE)

**File:** `src/components/seo/ScholarlyMeta.astro`, `src/pages/blog/[category]/[slug].astro`

The `paper` block is load-bearing for scholarly metadata. Per the comment in `content.config.ts`, its presence is the on/off switch for per-paper Highwire / Schema.org / Dublin Core tags on the **post** page. Extracting it breaks that unless the lookup is rebuilt.

```ts
const artifact = (await getCollection('publications'))
  .find(p => p.data.post === slug);
// pass to ScholarlyMeta when present
```

The component's signature changes from `CollectionEntry<'blog'>` to the publications entry. It currently reads `post.data.title/description/pubDate` as fallbacks; a self-contained publications entry supplies all of them directly, so it gets simpler.

### Drift guard

`title` now exists in two files — the post's and the artifact's. Drift between `citation_title` and the page `<h1>` is exactly what quietly breaks Scholar indexing. Assert it.

**Assert against the rendered `<h1>` text content, not the raw frontmatter string.** The `<h1>` is `emify(title, titleEm)` and contains an `<em>`. A naive `publication.title === post.data.title` check can pass on a page whose visible heading does not match the citation tag.

```
stripTags(emify(post.data.title, post.data.titleEm)) === publication.data.title
```

**Before writing the guard:** confirm what the post page's `<h1>` actually renders today. `title` is the full scholarly title with subtitle. If the `<h1>` shows a short form and `citation_title` carries the long form, they are *already* mismatched in production — and the assertion should catch that on first run rather than being shaped to accommodate it. Report what you find. Do not fit the invariant to current output if current output is wrong.

**Do not** make `title` optional-with-fallback-to-post. That is the conditional-validation shape rejected elsewhere in this spec, and `hostedAt`-only entries would need a second branch anyway. Duplicate the string; test the invariant.

### Acceptance gate

Not a step — a gate. Plan A does not land until this passes.

1. Build, inspect the rendered `<head>` of `/blog/research/accessibility-concept-emergence-pythia/`
2. Confirm present and correct: `citation_title`, `citation_author`, `citation_doi`, `citation_pdf_url`, `citation_publication_date`
3. Head-diff against current production output — **no tag may be lost**
4. `citation_pdf_url` must **resolve to a real file**, not merely be present. It is currently a 404 (fixed in 0a). Present-but-broken passes a tag-presence check and fails the actual purpose.

---

## Phase 4 — cleanup

### 4a. Empty category pages — SUPERSEDED BY PLAN C

This phase is **removed**. Plan C deletes the category archive routes entirely, so the thin-content / soft-404 problem stops existing rather than being filtered. Do not implement a `getStaticPaths` filter that Plan C will delete.

One piece survives and moves here: **remove `The-Notes` from the category enum and from `CATEGORIES`.** It was an early guess at the notes feature and is now wrong — notes are their own collection.

### 4b. `titleEm` can silently do nothing

`emify()` does `title.replace(em, ...)`. If `titleEm` is not a substring of `title` — typo, case mismatch, curly vs straight apostrophe — `.replace()` returns unchanged. Build passes, rose italic silently absent.

```ts
.refine(
  (d) => !d.titleEm || d.title.includes(d.titleEm),
  { message: 'titleEm must be a substring of title', path: ['titleEm'] }
)
```

Apply the same refine to `shortTitleEm ⊆ shortTitle` on the publications schema.

### 4c. `description` accepts empty string

`description: z.string()` permits `''`. Empty descriptions become empty `<meta name="description">` and `og:description`. Change to `.min(1)`.

**This will fail the build on first run.** That is intentional — it catches `i-am-the-paper.mdx`. Fix the content, not the schema.

`src/content/template.mdx` also has `description: ''` but lives outside the glob base, so it is unvalidated. Leave it or move it to `docs/`.

### 4d. Minor

- `src/components/seo/Plausible.astro` is unused — `Base.astro` imports `GoogleAnalytics`. Delete, or comment that it is parked deliberately.
- `deno.lock` is gitignored *and* present, with a comment saying Netlify added it. Should disappear once the repo is git-linked; remove if so.

---

# PLAN B — notes

## Phase 5 — `notes` collection

**Files:** `src/content.config.ts`, `src/content/notes/`, `src/utils/notes.ts` (new)

`blog` requires `title` and `description`. Notes have neither by design — the point is that there is nothing to fill in but the body. Every required field is a decision made at 11pm with a thought that is already evaporating.

```ts
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    link: z.string().url().optional(),
  }),
});
```

- `.md`, not `.mdx`. If a note needs a component it has outgrown being a note.
- `pubDate` **required** here, unlike `blog` where it is optional. A note without a timestamp is not a note.
- No title, no description, no category, no draft. The collection is the category. Notes publish on commit.
- `tags` mirrors the blog field for future consistency. Unrendered for now.

**Filenames:** `YYYY-MM-DD-HHmm.md` (e.g. `2026-07-26-0914.md`). Derived from timestamp, so nothing is invented at capture time.

**Permalinks:** `/notes/<id>/`. A note will eventually need linking from the post that grew out of it, and the maturation path (note → essay → publication) is the structural argument this restructure makes. Retrofitting permalinks later breaks URLs.

**Utilities** in `src/utils/notes.ts`, mirroring `posts.ts`: `getPublishedNotes()`, `noteHref()`, `noteDateLabel()`.

## Phase 6 — `Notes.astro`

**Files:** `src/components/sections/Notes.astro`, `src/pages/notes/index.astro`, `src/pages/notes/[slug].astro`

### Typography is semantic, not decorative

**Notes render in the mono face (Fira Code). Long-form stays in the display serif (Fraunces).**

The site already has two typographic voices and uses only one for content: the serif is finished work, the mono is raw material (the hero code block, the letterspaced eyebrow labels). A reader scrolling past should be able to tell, without reading a word, that they have crossed from *things Trisha wrote* into *things Trisha thought*. The typeface is the label — no section header required, no tag pills.

**Do not add decoration to make this section match the rest of the page.** The plainness is load-bearing and looks like an oversight. Equally, do not strip marginalia elsewhere to make the page match the notes.

### Date granularity

| Content | Format | Example |
|---|---|---|
| Posts (`dateLabel`) | Month + year | `JUN 2026` |
| Notes (`noteDateLabel`) | Day + time | `JUL 26 · 09:14` |

Two words of metadata encoding what kind of object this is: one written at a specific moment, the other worked on over an indefinite stretch. Makes the "as they happen" claim structural rather than stated.

### Rail treatment

Notes hang off the existing dashed vertical rule (`--margin-w`, 130px), which currently carries only the marginalia text.

- Short horizontal tick connecting each note to the rail
- Note body indented ~28px from the rail at desktop
- Timestamp above the body: mono, muted, smaller than body
- No titles, no tag pills, no category chips

Reuse existing custom properties (`--rose-whisper`, `--dust`, `--text-soft`, `--font-mono`). Do not introduce new ones.

### Home page

Most recent 5–7 notes, with a link through to `/notes/`. Full stream at `/notes/`.

### CONTRAST CHECK — do this before building routes

Notes introduce mono body text at small sizes on the cream background. `--text-soft` and `--dust` may fail WCAG 2.2 AA contrast at that size. **Verify before phases 7 and 8 are built on top of it.** If mono body text fails, use full `--text`.

### Accessibility (repo standard: WCAG 2.2 AA, site must be exemplary)

- Notes list is an ordered list — it is chronological
- Timestamps use `<time datetime="...">` with machine-readable ISO values
- Rail and ticks are decorative: CSS only, not content, not announced
- Sizes in `rem`
- Add axe specs covering `/notes/` and a note detail page

## Phase 7 — routes

`/notes/` and `/notes/[slug]/`. Flat — **no category segment.** This deliberately breaks the `/blog/[category]/[slug]/` pattern. It is not an inconsistency to clean up later; it is the newer collection not inheriting the older one's coupling.

## Phase 8 — `index.astro` reorder + heading swap

Per "Home-page structure" above.

## Phase 9 — RSS

**Dependency:** `@astrojs/rss` (not installed; `@astrojs/sitemap` is)

| Feed | Path | Contents |
|---|---|---|
| Writing | `/rss.xml` | `blog`, published only |
| Notes | `/notes.xml` | `notes` |

Two feeds, deliberately. Different cadences and commitment levels — someone who wants three essays a year should not receive eleven thoughts about the B4 denominator.

Both need `<link rel="alternate" type="application/rss+xml">` discovery tags in `Base.astro` with distinct `title` attributes.

> Verify the API against the installed version. This repo runs Astro `^7.1.3`; confirm the `@astrojs/rss` surface from current docs rather than assuming.

## Phase 10 — remaining axe specs

---

# PLAN C — URL migration

Ship on its own deploy. See sequencing at the end of this section.

## Goal

Move from taxonomy-nested post URLs to post-type URLs, and put redirect configuration under version control.

```
BEFORE   /blog/[category]/[slug]/     taxonomy nested, hardcoded base
AFTER    /writing/[slug]/             post type as top-level segment
```

The URL space currently speaks two idioms. `/notes/[slug]/` (Plan B) is post-type-style: type at top level, flat underneath. `/blog/[category]/[slug]/` is taxonomy-nested. Nothing about a publication is *subordinate* to a blog, but the path says it is. After Plan C the top-level segment is always the content type:

```
/writing/[slug]/     posts
/notes/[slug]/       notes
(none)               publications — data only
```

`writing`, not `blog`: the nav already says WRITING and the section heading is "The Writing." Since the migration cost is being paid anyway, land on the site's own vocabulary rather than the generic word.

## Phase C1 — route move

- `src/pages/blog/[category]/[slug].astro` → `src/pages/writing/[slug].astro`
- `src/pages/blog/index.astro` → `src/pages/writing/index.astro`
- **Delete `src/pages/blog/[category]/index.astro`.** Category archives go away — with eight posts they are thin, and several are empty.
- Update `postHref()` in `src/utils/posts.ts` to emit `/writing/<slug>/`
- `category` remains in frontmatter and still renders as the tag pill on the writing list. It is metadata again, not an address.

If the corpus later justifies archives, they return at `/categories/[term]/` — parallel to the content type, not nested under it.

## Phase C2 — redirects into version control

### Current state (a problem in itself)

`/posts/` → `/blog/` redirects from a previous migration exist **only in the Netlify dashboard**. Evidence: `.netlify/netlify.toml` is a CLI-generated cache (`publishOrigin = "ui"`, `status = 301.0` as a float, publish path pointing at the pre-rename `trishasalasV2` directory), and `.netlify` is gitignored. Those rules are not reviewable, not in git, and would be lost if the site were rebuilt from scratch.

### Fix

Create **`public/_redirects`**. Files in `public/` copy verbatim into `dist/`, and Netlify reads `_redirects` from the publish root — real 301s, no adapter required.

> **Do NOT use Astro's `redirects` config for this.** In a static build with no adapter it emits `<meta http-equiv="refresh">` pages, which Google treats as soft redirects that pass link equity weakly. Scholar's crawler is fussier still. The whole point of this migration is preserving indexing.

```
# Legacy /posts/ URLs — point at FINAL destinations, not through /blog/
/posts/testing-accessibility-knowledge-across-pythia-model-sizes/   /writing/testing-accessibility-knowledge-pythia/   301
/posts/testing-accessibility-knowledge-across-pythia-model-sizes    /writing/testing-accessibility-knowledge-pythia/   301
/posts/    /writing/   301
/posts     /writing/   301

# 2026-07 migration: /blog/ -> /writing/
/blog/:category/:slug   /writing/:slug   301
/blog/:category         /writing/        301
/blog/                  /writing/        301
/blog                   /writing/        301
```

**Chain avoidance is the important part.** Leaving the old rules pointing at `/blog/` would produce `/posts/foo/` → `/blog/research/foo/` → `/writing/foo/`. Google follows chains but discounts equity through each hop. Rewrite the legacy rules to land in one.

Do not wildcard `/posts/*` — the slug changed in that migration (`testing-accessibility-knowledge-across-pythia-model-sizes` → `testing-accessibility-knowledge-pythia`), so a splat would generate wrong targets. Only the explicit rules that exist.

### After the file is verified live

**Delete the redirect rules from the Netlify UI.** One source of truth. Leaving both risks the UI rules shadowing the file in ways that are invisible from the repo.

### Verify

- `_redirects` lands at `dist/_redirects` after build
- Test against `trailingSlash: 'ignore'` + `build.format: 'directory'` — both slashed and unslashed forms must resolve
- Confirm 301 status codes on the deploy preview, not 200 or 302

## Phase C3 — internal references

Grep and update every hardcoded `/blog/` path:

- `Research.astro` → `href` for the Pythia entry (though after Plan A this derives from `post`)
- `Nav.astro`, `Footer.astro`
- `docs/social-urls.md`
- Any `.mdx` body content with inter-post links
- Playwright specs
- **`citation_pdf_url` and the ScholarlyMeta canonical** — these change with the post URL and must be re-verified against the Phase 3 head-diff gate

Sitemap regenerates automatically. Verify `/blog/` paths are absent from `dist/sitemap-0.xml` after build.

## Sequencing — read this before shipping

Phase 0a fixes `citation_pdf_url`. Plan C moves the canonical page URL. **Both change what Google Scholar sees.** Shipped together, a failure to index cannot be attributed to either one.

**Recommended:** land Plan A, deploy, wait roughly a week, then ship Plan C. Costs only patience and buys a clean attribution window.

If shipping together is preferred, that is a defensible call — Scholar follows 301s and the risk is modest — but make it deliberately rather than by default.

Plan B is independent of both and can land whenever.

---

## Out of scope

**Capture path (phone shortcut → GitHub Contents API).** Deferred. Requires the repo to be linked to Netlify for build-on-push; it currently deploys via Netlify CLI. Recorded as follow-up.

**Category-in-URL coupling.** Resolved by Plan C.

**Tag rendering.** `tags` already exists on `blog`, validated and defaulted and entirely unrendered. Display work, not data work, whenever it is wanted.

**Note → post backlinks.** Worth doing once there are enough notes for it to mean anything.

---

## Open items — Trisha's call, not the implementer's

- **`shortTitleEm` for thatDangCircuit.** Currently omitted. "thatDangCircuit" is one token and already distinctive; emphasis may want to sit elsewhere or be dropped. `shortTitleEm` is optional — **add an explicit test that the omitted path renders cleanly** rather than assuming it does.
- **Whether `/writing/` gets its own nav entry** — the nav currently says WRITING and points at `/blog/`. After Plan C that becomes `/writing/`, which is finally honest.
- **Whether `/notes/` gets its own nav entry** or is reachable only from the home page.

---

## Repo conventions

Per `CLAUDE.md`:

- Commit messages: conventional prose, multi-line, explains *why* not just *what*.
- **Commit attribution.** Any commit whose content Claude authored gets a `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` trailer naming the model that actually did the work. Solo commits get no trailer. Subagents must use their own model name — it does not propagate.
- Confirm before any push, force operation, `reset --hard`, branch deletion, or GitHub PR/issue action.
- **The whimsy is non-negotiable.**
- `CLAUDE.md` has drift worth fixing while in here: it says `/blog/` groups by `tag` (the code uses `category`) and lists four categories (the enum has six, becoming five once `The-Notes` is removed). That file exists to onboard the next assistant; a stale field name means someone confidently reaches for `post.data.tag` and finds nothing.

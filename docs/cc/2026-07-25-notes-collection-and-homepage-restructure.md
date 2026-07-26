# Notes collection + home-page restructure

> **SUPERSEDED** by `2026-07-26-site-restructure-v2.md`. Retained for decision history.
> Do not implement from this document — the data model was replaced and requirement 2 of
> Phase 1 contradicts requirement 1.

**Date:** 2026-07-25
**Status:** Superseded
**Origin:** Design + code-review conversation (Claude Opus 5, chat interface). Analysis done against the repo at commit-time-of-writing; implementation intentionally deferred to Claude Code so the build, `astro check`, and the Playwright/axe suite are in the loop.

---

## Punchline

Add a **short-form notes stream** to the home page and give it its own content collection — not a `blog` category. Along the way, fix four things the review surfaced: `Research.astro` duplicates collection data, empty category pages are being indexed, there is no RSS feed, and `titleEm` can silently fail.

Nothing here is a rethink. It is all "finish the thought."

---

## Motivation

Trisha captures research thoughts at odd hours — mid-session, mid-conversation, mid-plant-watering. Currently publishing anything requires opening an editor and a terminal, which is appropriate friction for an essay and fatal friction for a twelve-word observation. The thoughts get discarded at the moment of having them because there is nowhere for them to land.

The site also currently shows only the top and bottom of the work pipeline — finished papers and finished essays — which makes the research read as if it arrived fully formed. The hero copy already claims otherwise ("Not everything here is finished. _That's sort of the point._") and that line currently sits above a list of finished things. Notes close the gap between claim and structure.

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

### Section responsibilities after the change

| Section    | Content                                                    | Type treatment |
| ---------- | ---------------------------------------------------------- | -------------- |
| `Research` | Papers only. Cards, as today — but derived, not hardcoded. | Display serif  |
| `Writing`  | All long-form posts, all categories, one merged stream.    | Display serif  |
| `Notes`    | Short-form capture.                                        | **Monospace**  |

### Naming migration

`Writing.astro` currently carries the eyebrow `The Writing` and the `<h2>` "Notes from the margin." Those swap ownership:

- `Writing` section takes **"The Writing"** as its heading.
- `Notes` section takes **"Notes from the margin."**

This is a correction, not a rename. Marginalia is short, reactive, and written alongside something else — which describes the notes and has never accurately described the essays. The metaphor is already load-bearing on this site (the vertical rail text reads "Inkling doodles in the margins of the context window"); this points it at the right content.

### Why `Research` stays as cards — do not merge it into `Writing`

The original instinct in the conversation was to flatten research into a single post stream. Rejected, and the reasoning should survive:

The research cards present **artifacts** — DOI, venue, status, citation count. That is credentialing, and it is the only thing on the page that tells a cold visitor "this person publishes." The moment a paper with a DOI becomes a row in a chronological list above "Golden Gate Claude aka Bridge Boy," it stops reading as a publication.

This matters more than usual here: per `CLAUDE.md`, findability is load-bearing, and the site exists partly to do the discoverability job arXiv normally would. Flattening the papers makes the site _less_ legible to the audience it is trying to reach.

---

## Phase 1 — `Research.astro` derives from the collection

**File:** `src/components/sections/Research.astro`

### Current state

The `papers` array is hardcoded inline in the component — title, abstract, `DOI · 10.5281/zenodo.20360787`, status, year. But `href` points at `/blog/research/accessibility-concept-emergence-pythia/`, which is a real MDX entry in the `blog` collection.

So the Pythia paper exists in two places, and the DOI lives in the one that is _not_ the content collection.

### Why this is already solved in the schema

`src/content.config.ts` has an optional `paper` block with an existing comment:

> Presence of this block (not the category) is the on/off switch for per-paper Highwire/Schema.org/Dublin Core tags.

The contract is written. It just is not signed. Derive the section from it:

```ts
const papers = (await getCollection("blog"))
  .filter((p) => p.data.paper !== undefined)
  .sort(/* by paper.publicationDate ?? pubDate, desc */);
```

### Requirements

1. `Research.astro` reads from the collection. No inline paper data.
2. The **rendered output is visually unchanged.** Same card markup, same quill hover, same status dot, same two-column grid. This is a wiring change only.
3. The TACCESS paper ("When ARIA is everywhere and alt-text is nowhere") becomes an MDX entry with `draft: true` and a populated `paper` block, replacing the hardcoded object with `href: null`.
4. Status label (`Published · Zenodo` / `In progress · TACCESS`) and `statusKind` (`live` / `draft`) derive from existing frontmatter — `draft` plus `paper.venue` — rather than becoming new schema fields. Add fields only if derivation genuinely cannot express it.
5. Cards for `draft: true` papers must render on the home page. This is deliberate and differs from `getPublishedPosts()` behaviour — an in-progress paper is _part of the credentialing story_. Do not reuse `getPublishedPosts()` here; it filters drafts in prod.
6. A draft paper's card must not link anywhere (no post page exists to link to).

### Acceptance

- `astro build` passes.
- Home page renders two cards identical to current production output.
- Grepping the repo for `10.5281/zenodo.20360787` returns the MDX frontmatter and nothing in `src/components/`.

---

## Phase 2 — `notes` collection

**Files:** `src/content.config.ts`, `src/content/notes/`, `src/utils/notes.ts` (new)

### Decision: separate collection, NOT a `blog` category

`The-Notes` is currently sitting in the `category` enum in `src/content.config.ts` and mirrored in `CATEGORIES` in `src/utils/posts.ts`. **Remove it.** It was a reasonable early guess and it is the wrong shape.

The reasoning, because this is the thing that will be non-obvious in six months when someone finds `The-Notes` in the git history:

`blog` requires `title` and `description`. Notes have neither, by design — the entire point is that there is nothing to fill in but the body. Every required field is a decision that has to be made at 11pm with a thought that is already evaporating.

Accommodating notes inside `blog` would mean making `title` and `description` optional, which weakens validation on eight real posts to serve a content type that is not a post. The schema would be describing something less true than it does today.

There is already a precedent in this repo for the correct move: the `paper` block. Scholarly metadata was not scattered as nullable `doi` / `venue` / `abstract` fields across the blog schema — it was made a discrete optional object whose _presence_ is the switch. Same principle, one level up. A different content type gets its own shape.

**Do not** solve this with a Zod `superRefine` that conditionally requires `title` when `category !== 'The-Notes'`. It is the clever that bites.

### Schema

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

Notes:

- `.md`, not `.mdx`. Notes are prose. If one needs a component it has outgrown being a note.
- `pubDate` is **required** here (unlike `blog`, where it is optional to let undated drafts validate). A note without a timestamp is not a note.
- No `title`, no `description`, no `category`, no `draft`. The collection is the category. Notes publish on commit.
- `tags` mirrors the `blog` field for future consistency. Unrendered for now — see "Deferred" below.
- `link` is for the common case of a note that is a reaction to something external.

### Filenames and permalinks

Filename convention: `YYYY-MM-DD-HHmm.md` (e.g. `2026-07-25-0714.md`). Derived from timestamp, so nothing has to be invented at capture time.

**Notes get permalinks** at `/notes/<id>/`. Rationale: a note will eventually need to be linked from the post that grew out of it, and the maturation path (note → essay → paper) is the structural argument the whole restructure is making. Retrofitting permalinks later means breaking URLs.

### Utilities

New `src/utils/notes.ts` mirroring the shape of `posts.ts`:

- `getPublishedNotes()` — sorted by `pubDate` desc.
- `noteHref(note)` — `/notes/<id>/`.
- `noteDateLabel(note)` — see typography below.

---

## Phase 3 — `Notes.astro` section

**Files:** `src/components/sections/Notes.astro` (new), `src/pages/notes/index.astro` (new), `src/pages/notes/[slug].astro` (new)

### Typographic decision

**Notes render in the mono face (Fira Code). Long-form stays in the display serif (Fraunces).**

This is not decoration. The site already has two typographic voices and is only using one for content: the serif is finished work, the mono is raw material (the hero code block, the letterspaced eyebrow labels). A reader scrolling past should be able to tell, without reading a word, that they have crossed from _things Trisha wrote_ into _things Trisha thought_. The typeface is the label — no section header required, no tag pills, no explanation.

### Date granularity

| Content                 | Label format | Example          |
| ----------------------- | ------------ | ---------------- |
| Posts (`dateLabel`)     | Month + year | `JUN 2026`       |
| Notes (`noteDateLabel`) | Day + time   | `JUL 25 · 07:14` |

Two words of metadata that encode what kind of object this is: one was written at a specific moment, the other was worked on over an indefinite stretch. It also makes the "as they happen" claim structural rather than stated.

### Rail treatment

Notes hang off the existing dashed vertical rule. The page already coordinates from `--margin-w` (130px dashed rule) per `CLAUDE.md`; the rail currently carries the marginalia text and nothing else.

- Each note gets a short horizontal tick connecting it to the rail.
- Note body indented from the rail (~28px at desktop).
- Timestamp above the body, mono, muted, smaller than the body.
- No titles. No tag pills. No category chips.

Reuse existing custom properties (`--rose-whisper`, `--dust`, `--text-soft`, `--font-mono`) rather than introducing new ones.

### Home-page display

Show the most recent **5–7** notes on the home page with a link through to `/notes/`. The full stream lives at `/notes/`.

### Accessibility

Per repo standard (WCAG 2.2 AA, site must be exemplary):

- The notes list is an ordered list — it is chronological.
- Timestamps use `<time datetime="...">` with a machine-readable ISO value.
- The rail and ticks are decorative; they must be CSS, not content, and must not be announced.
- Mono at small sizes needs contrast checked against the cream background — verify `--text-soft` and `--dust` against `--bg` at the chosen size. If mono body text fails, use full `--text`.
- Sizes in `rem`, per repo standard.
- Run the existing axe suite; add a spec covering `/notes/` and a note detail page.

---

## Phase 4 — RSS

**Dependency:** `@astrojs/rss` (not currently installed; `@astrojs/sitemap` is)

Two feeds, deliberately separate:

| Feed    | Path         | Contents                          |
| ------- | ------------ | --------------------------------- |
| Writing | `/rss.xml`   | `blog` collection, published only |
| Notes   | `/notes.xml` | `notes` collection                |

**Why two:** different cadences and different commitment levels. Someone who wants three essays a year should not receive eleven thoughts about the B4 denominator. Let people pick their firehose.

RSS matters disproportionately for this site's audience — independent researchers, a11y practitioners, the mech-interp crowd are all heavy feed users — and a microblog with no feed is a microblog nobody can follow.

Both feeds need `<link rel="alternate" type="application/rss+xml">` discovery tags in `Base.astro`, with distinct `title` attributes so a reader can tell them apart.

> **Verify the API against the installed version.** This repo runs Astro `^7.1.3`; the `@astrojs/rss` surface should be confirmed from current docs rather than assumed.

---

## Phase 5 — Cleanup

### 5a. Empty category pages are indexed

**File:** `src/pages/blog/[category]/index.astro`

`getStaticPaths()` maps over all of `CATEGORIES` regardless of whether any published posts exist. Those pages build with body content "Nothing here yet.", inherit `<meta name="robots" content="index, follow">` from `Base.astro`, and land in the sitemap.

That is thin content and a soft-404 signal, on a site whose stated purpose is findability.

It is also draft-sensitive in a way `getStaticPaths` cannot see: `not-writing-the-ablation-paper` is `draft: true` and appears to be the only `Process` post, so **Process is likely empty in production but populated in dev** — the class of bug that never shows up locally.

**Fix:** filter `getStaticPaths()` to categories with at least one post that survives the same prod/dev draft filter `getPublishedPosts()` applies.

> **Unverified:** only three of eight blog frontmatters were read during review (`golden-gate-claude`, `i-am-the-paper`, `not-writing-the-ablation-paper`). Confirm actual category distribution before assuming which pages are empty.

### 5b. `titleEm` can silently do nothing

**File:** `src/content.config.ts`

`emify()` does `title.replace(em, ...)`. If `titleEm` is not a substring of `title` — typo, case mismatch, curly vs straight apostrophe — `.replace()` returns the string unchanged. No error. The build passes and the rose italic simply is not there.

```ts
.refine(
  (d) => !d.titleEm || d.title.includes(d.titleEm),
  { message: 'titleEm must be a substring of title', path: ['titleEm'] }
)
```

Turns a silent visual regression into a build failure.

### 5c. `description` accepts empty string

`description: z.string()` permits `''`, and at least two files already have it. Empty descriptions become empty `<meta name="description">` and empty `og:description`.

Change to `.min(1)`. Fix any existing entries this breaks — the build failure is the point.

> `src/content/template.mdx` has `description: ''` but lives outside the glob base (`./src/content/blog`), so it is not validated. Leave it, or move it to `docs/` where it is unambiguously not content.

### 5d. Minor cruft

- `src/components/seo/Plausible.astro` is unused — `Base.astro` imports `GoogleAnalytics`. Delete, or add a comment noting it is parked deliberately.
- `deno.lock` is gitignored _and_ present, with a comment saying Netlify added it. Should disappear once the repo is git-linked; remove if so.
- Fonts load from `fonts.googleapis.com` (Fraunces, Lora, Fira Code). Three families on the render path via a third party. Self-hosting via fontsource removes a round trip and a dependency. **Low priority** — but annoying to retrofit later, and it becomes slightly more load-bearing once mono is carrying body text.

---

## Phase 6 — Capture path (separate session)

Not code in this repo, but the reason the collection exists. Recorded so the design intent is not lost.

**Prerequisite:** the repo is on GitHub but **not yet linked to Netlify** — deploys currently go through the Netlify CLI manually. Link it. Build-on-push is required for any of the below to work, and it also buys deploy previews and rollbacks.

**Mechanism:** a phone shortcut (iOS Shortcuts / Android HTTP Shortcuts) that `PUT`s to the GitHub Contents API:

```
PUT /repos/{owner}/{repo}/contents/src/content/notes/{timestamp}.md
```

with a base64-encoded body and a fine-grained PAT scoped to this repo only. GitHub creates the commit, Netlify builds on push, the note is live in under a minute.

**Why not a CMS admin UI:** the failure mode of a CMS is that it is still ceremony — open browser, navigate to `/admin`, wait for OAuth, click New, pick a collection, fill in a title field you do not want. Ninety seconds of overhead on a fifteen-second thought. The thought does not survive the overhead.

**Why this degrades well:** if the shortcut breaks, it is still just a markdown file in a folder. A convenience is lost, not a system.

---

## Deferred

- **Tag rendering.** `tags: z.array(z.string()).default([])` already exists in the blog schema, validated and defaulted and entirely unrendered. Whenever it is wanted, it is display work, not data work. The `notes` schema mirrors it for the same reason.
- **Note → post backlinks.** The maturation path (note becomes essay becomes paper) is the structural argument this restructure makes, but nothing links a post back to the notes that fed it. Worth doing once there are enough notes for it to mean anything.

---

## Suggested sequence

1. Link the repo to Netlify (unblocks Phase 6, no code)
2. Phase 1 — `Research.astro` derive (self-contained, no dependencies on the rest)
3. Phase 5a + 5b + 5c — small fixes, ~fifteen minutes together
4. Phase 2 + 3 — notes collection and section
5. Phase 4 — RSS (needs Phase 2 to exist for `/notes.xml`)
6. Phase 6 — capture path

Phases 1 and 5 are independently shippable and touch nothing the notes work needs. Land them first so the notes branch is not carrying unrelated changes.

---

## Repo conventions reminder

Per `CLAUDE.md`:

- Commit messages: conventional prose, multi-line, explains _why_ not just _what_.
- **Commit attribution matters.** Any commit whose content Claude authored gets a `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` trailer naming the model that actually did the work. Solo commits get no trailer. Subagents must be told to use their own model name — it does not propagate.
- Confirm before any push, force operation, `reset --hard`, branch deletion, or GitHub PR/issue action.
- **The whimsy is non-negotiable.** The notes section is the most "plain" thing on the site by design — mono, unstyled, no ornament. That restraint is what makes it read as raw material. Do not add decoration to make it match the rest of the page, and do not strip marginalia elsewhere to make the page match the notes.
- `CLAUDE.md` itself has drift worth fixing while in here: it says `/blog/` groups by `tag` (the code uses `category`) and lists four categories (the enum has six, soon five). That file exists to onboard the next assistant; a stale field name there means someone confidently reaches for `post.data.tag` and finds nothing.

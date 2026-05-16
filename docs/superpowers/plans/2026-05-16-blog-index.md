# /blog/ Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/blog/` landing page — a tag-grouped, anchor-navigable index of every post in `src/content/blog`, sharing the home page's design system but functioning as the canonical archive.

**Architecture:** Single Astro page at `src/pages/blog/index.astro`, reading the existing `blog` content collection. Posts are grouped client-side-at-build by their `tag` enum into sections; anchor-jump nav scrolls between sections; each section is omitted entirely when empty. A small new `src/utils/posts.ts` module holds the filter/sort/format helpers that today live inline in `src/components/sections/Writing.astro`, so both the home section and the new index share one implementation.

**Tech Stack:** Astro 5, MDX content collections, TypeScript, Playwright + axe-core for tests.

**Spec:** `docs/superpowers/specs/2026-05-16-blog-index-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/utils/posts.ts` (new) | `getPublishedPosts()` — filtered + sorted collection query. `dateLabel(post)` — `"May 2026"` or `"Drafting"`. `emify(title, em?)` — wraps `em` substring in `<em>`. |
| `src/pages/blog/index.astro` (new) | Listing page. Imports helpers from `src/utils/posts.ts`; reuses `Base` layout, `Nav`, `Footer`. |
| `src/components/sections/Writing.astro` (refactor) | Calls the shared helpers instead of defining them inline. No visible behavior change. |
| `src/pages/blog/[...slug].astro` (one-line edit) | Back-link target changes from `/#writing` to `/blog/`. |
| `tests/e2e/blog-index.spec.ts` (new) | Functional + structural assertions on the new page. |
| `tests/e2e/a11y.spec.ts` (append) | Add `/blog/` to the Axe suite. |
| `CLAUDE.md` (edit) | Update the "URL structure" table to reflect the unified `/blog/<slug>/` model. |

---

## Task 1: Lift shared post helpers into `src/utils/posts.ts`

**Files:**
- Create: `src/utils/posts.ts`
- Modify: `src/components/sections/Writing.astro` (frontmatter only)
- Existing regression: `tests/e2e/home.spec.ts`

This is a pure refactor — `Writing.astro`'s output must not change. The existing `home.spec.ts` is the regression net.

- [ ] **Step 1: Run the existing home test to establish a green baseline**

Run:
```bash
npm run test:e2e -- tests/e2e/home.spec.ts
```
Expected: PASS. If it doesn't pass on `main`, stop and investigate before refactoring.

- [ ] **Step 2: Create `src/utils/posts.ts` with the three helpers**

Write `src/utils/posts.ts`:

```typescript
import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * Returns blog posts ready to render: drafts hidden in production, shown in dev.
 * Sort: published posts by pubDate desc; drafts pinned to the end.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const all = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true;
  });
  return all.sort((a, b) => {
    if (a.data.draft && !b.data.draft) return 1;
    if (!a.data.draft && b.data.draft) return -1;
    const aDate = a.data.pubDate?.getTime() ?? 0;
    const bDate = b.data.pubDate?.getTime() ?? 0;
    return bDate - aDate;
  });
}

/** "May 2026" for published posts; "Drafting" for drafts; "" if no date. */
export function dateLabel(post: BlogPost): string {
  if (post.data.draft) return 'Drafting';
  return post.data.pubDate
    ? post.data.pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : '';
}

/** Wraps the `em` substring of `title` in `<em>…</em>` for the rose-italic treatment. */
export function emify(title: string, em?: string): string {
  if (!em) return title;
  return title.replace(em, `<em>${em}</em>`);
}
```

- [ ] **Step 3: Refactor `Writing.astro` frontmatter to call the shared helpers**

Replace the top frontmatter block in `src/components/sections/Writing.astro` (lines 1–29 in the current file — everything between the two `---` fences) with:

```astro
---
import { getPublishedPosts, dateLabel, emify } from '../../utils/posts';

const posts = await getPublishedPosts();
---
```

Leave the template (`<section>…</section>`) and `<style>` blocks below the frontmatter unchanged. The template already calls `dateLabel(post)` and `emify(post.data.title, post.data.titleEm)` — those references now resolve to the imported functions.

- [ ] **Step 4: Run home test again to confirm no regression**

Run:
```bash
npm run test:e2e -- tests/e2e/home.spec.ts
```
Expected: PASS. The home page's Writing section should render identically.

- [ ] **Step 5: Run Astro's type check**

Run:
```bash
npm run check
```
Expected: 0 errors, 0 warnings (or no new ones beyond the pre-existing baseline).

- [ ] **Step 6: Commit**

```bash
git add src/utils/posts.ts src/components/sections/Writing.astro
git commit -m "Extract blog post helpers into src/utils/posts.ts

Lift getPublishedPosts(), dateLabel(), and emify() out of
Writing.astro so the new /blog/ index can share one source of
truth. Pure refactor — home page output unchanged."
```

---

## Task 2: Add a failing Playwright test for `/blog/`

**Files:**
- Create: `tests/e2e/blog-index.spec.ts`

We write the structural assertions first. The page doesn't exist yet, so all of these fail — that's the red bar Task 3 turns green.

- [ ] **Step 1: Write the test file**

Write `tests/e2e/blog-index.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const TAGS = ['Research', 'Essay', 'Process', 'Personal'] as const;
type Tag = typeof TAGS[number];
const tagToId: Record<Tag, string> = {
  Research: 'research',
  Essay: 'essay',
  Process: 'process',
  Personal: 'personal',
};

test('/blog/ renders the page header', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page).toHaveTitle(/The Writing/);
  await expect(page.locator('h1')).toContainText('Notes from the');
  await expect(page.locator('h1 em')).toContainText('margin');
});

test('/blog/ shows one section per tag that has at least one post', async ({ page }) => {
  await page.goto('/blog/');

  // For each tag, the section is either present with >=1 post, or absent entirely.
  for (const tag of TAGS) {
    const heading = page.locator(`h2#${tagToId[tag]}`);
    const count = await heading.count();
    if (count === 0) continue; // empty tag — section correctly omitted

    // Section exists: it must have at least one post card under it.
    await expect(heading).toBeVisible();
    const section = page.locator(`section[data-tag="${tag}"]`);
    const cards = section.locator('li.post-card');
    await expect.poll(() => cards.count()).toBeGreaterThan(0);
  }
});

test('/blog/ anchor-jump nav matches rendered sections', async ({ page }) => {
  await page.goto('/blog/');

  const anchorLinks = page.locator('nav.anchor-nav a');
  const anchorHrefs = await anchorLinks.evaluateAll(
    (els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href') ?? ''),
  );

  for (const href of anchorHrefs) {
    expect(href).toMatch(/^#(research|essay|process|personal)$/);
    const id = href.slice(1);
    await expect(page.locator(`h2#${id}`)).toBeVisible();
  }

  // Every visible h2 must have a corresponding anchor link
  const visibleHeadingIds = await page
    .locator('h2[id]')
    .evaluateAll((els) => els.map((el) => el.id));
  for (const id of visibleHeadingIds) {
    expect(anchorHrefs).toContain(`#${id}`);
  }
});

test('/blog/ anchor activation lands focus on the section heading', async ({ page }) => {
  await page.goto('/blog/');
  const firstAnchor = page.locator('nav.anchor-nav a').first();
  const targetHref = await firstAnchor.getAttribute('href');
  await firstAnchor.click();

  // Focus is moved inside a requestAnimationFrame, so poll until it lands.
  const targetId = targetHref!.slice(1);
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id ?? null))
    .toBe(targetId);
});

test('/blog/ post card shows date, tag, title, description', async ({ page }) => {
  await page.goto('/blog/');
  const firstCard = page.locator('li.post-card').first();

  await expect(firstCard.locator('time, .draft-label')).toBeVisible();
  await expect(firstCard.locator('.post-card__tag')).toBeVisible();
  await expect(firstCard.locator('h3 a')).toBeVisible();
  await expect(firstCard.locator('.post-card__desc')).toBeVisible();

  const href = await firstCard.locator('h3 a').getAttribute('href');
  expect(href).toMatch(/^\/blog\/[^/]+\/$/);
});
```

- [ ] **Step 2: Run the new test, expect every assertion to fail**

Run:
```bash
npm run test:e2e -- tests/e2e/blog-index.spec.ts
```
Expected: all 5 tests FAIL (most with a 404 from `page.goto('/blog/')` — Astro routes `[...slug].astro` only matches with a slug; the bare `/blog/` returns 404 today).

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/e2e/blog-index.spec.ts
git commit -m "Add failing Playwright spec for /blog/ landing page

Structural assertions covering header, tag-grouped sections,
anchor-jump nav, focus management on anchor activation, and
post card shape. All fail today because /blog/ returns 404."
```

---

## Task 3: Build `/blog/` index — header + tag sections + cards

**Files:**
- Create: `src/pages/blog/index.astro`

This is where the page comes to life. The frontmatter groups posts by tag; the template emits header + anchor nav + sections + cards; the `<style>` block reuses Writing.astro's idioms.

- [ ] **Step 1: Create `src/pages/blog/index.astro`**

Write `src/pages/blog/index.astro`:

```astro
---
import Base from '../../layouts/Base.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import { getPublishedPosts, dateLabel, emify, type BlogPost } from '../../utils/posts';

const posts = await getPublishedPosts();

// Schema enum order is the canonical order on the page.
const TAGS = ['Research', 'Essay', 'Process', 'Personal'] as const;
type Tag = typeof TAGS[number];

const tagSubtitle: Record<Tag, string> = {
  Research: 'Papers and preprints.',
  Essay: 'Working through ideas in public.',
  Process: 'Notes from the bench.',
  Personal: 'What it is like to do this from a desk in Oklahoma.',
};

const tagId: Record<Tag, string> = {
  Research: 'research',
  Essay: 'essay',
  Process: 'process',
  Personal: 'personal',
};

// Group posts by tag, preserving the sort order from getPublishedPosts().
const grouped: Array<{ tag: Tag; id: string; subtitle: string; posts: BlogPost[] }> = TAGS
  .map((tag) => ({
    tag,
    id: tagId[tag],
    subtitle: tagSubtitle[tag],
    posts: posts.filter((p) => p.data.tag === tag),
  }))
  .filter((group) => group.posts.length > 0);
---
<Base
  title="The Writing — Trisha Salas"
  description="The full archive — research papers, essays, process notes, and personal posts from Trisha Salas, grouped by what they are."
>
  <div class="site-wrapper">
    <Nav />
    <main>
      <article class="blog-index">
        <header class="blog-index__header">
          <p class="eyebrow">The Writing</p>
          <h1 class="blog-index__title">Notes from the <em>margin</em>.</h1>
          <p class="blog-index__lede">
            Everything written here, grouped by what it is. Research papers and
            preprints alongside essays, process notes, and the occasional
            personal thread. Some sections are denser than others; drafts sit
            at the bottom of theirs. <em>Not everything is finished — that's sort of the point.</em>
          </p>
        </header>

        {grouped.length > 1 && (
          <nav class="anchor-nav" aria-label="Jump to section">
            <ol>
              {grouped.map((group, i) => (
                <li>
                  {i > 0 && <span class="anchor-nav__sep" aria-hidden="true">·</span>}
                  <a href={`#${group.id}`}>{group.tag}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {grouped.map((group) => (
          <section class="blog-section" data-tag={group.tag}>
            <p class="blog-section__eyebrow">{group.tag}</p>
            <h2 id={group.id} tabindex="-1" class="blog-section__title">
              {group.subtitle}
            </h2>
            <ol class="post-cards">
              {group.posts.map((post) => (
                <li class="post-card">
                  <div class="post-card__meta">
                    {post.data.draft ? (
                      <span class="draft-label">Drafting</span>
                    ) : post.data.pubDate ? (
                      <time datetime={post.data.pubDate.toISOString()}>
                        {dateLabel(post)}
                      </time>
                    ) : (
                      <span />
                    )}
                    <span class="post-card__tag">{post.data.tag}</span>
                  </div>
                  <h3 class="post-card__title">
                    <a
                      href={`/blog/${post.id}/`}
                      set:html={emify(post.data.title, post.data.titleEm)}
                    />
                  </h3>
                  <p class="post-card__desc">{post.data.description}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </article>
    </main>
  </div>
  <Footer />
</Base>

<style>
  .blog-index {
    max-width: 720px;
    padding: 60px 0 80px;
  }

  .blog-index__header {
    margin-bottom: 48px;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--rose-deep);
    margin: 0 0 12px 0;
  }

  .blog-index__title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 400;
    line-height: 1.15;
    margin: 0 0 18px 0;
  }
  .blog-index__title em {
    font-style: italic;
    color: var(--rose-deep);
  }

  .blog-index__lede {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-soft);
    margin: 0;
  }
  .blog-index__lede em {
    font-style: italic;
    color: var(--rose-deep);
  }

  .anchor-nav {
    margin: 0 0 48px;
    padding-bottom: 16px;
    border-bottom: 1px dashed var(--rose-whisper);
  }
  .anchor-nav ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .anchor-nav li {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .anchor-nav a {
    color: var(--rose-deep);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    padding-bottom: 2px;
    transition: border-color 120ms ease;
  }
  .anchor-nav a:hover,
  .anchor-nav a:focus-visible {
    border-bottom-color: currentColor;
  }
  .anchor-nav__sep {
    color: var(--dust);
  }

  .blog-section {
    margin: 0 0 56px;
  }
  .blog-section__eyebrow {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--rose-deep);
    margin: 0 0 6px 0;
  }
  .blog-section__title {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 400;
    font-style: italic;
    margin: 0 0 24px 0;
    color: var(--text-soft);
    outline: none;
  }
  .blog-section__title:focus-visible {
    outline: 2px solid var(--rose-deep);
    outline-offset: 4px;
  }

  .post-cards {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .post-card {
    padding: 22px 0;
    border-bottom: 1px solid var(--rose-whisper);
  }
  .post-card:first-child {
    padding-top: 0;
  }
  .post-card__meta {
    display: flex;
    gap: 14px;
    align-items: baseline;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dust);
    margin-bottom: 8px;
  }
  .post-card__tag {
    color: var(--rose-deep);
  }
  .draft-label {
    color: var(--rose-deep);
    font-style: italic;
  }
  .post-card__title {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 400;
    line-height: 1.3;
    margin: 0 0 6px 0;
  }
  .post-card__title a {
    color: inherit;
    text-decoration: none;
  }
  .post-card__title a:hover,
  .post-card__title a:focus-visible {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .post-card__title em {
    font-style: italic;
    color: var(--rose-deep);
  }
  .post-card__desc {
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--text-soft);
    margin: 0;
  }
</style>
```

- [ ] **Step 2: Add the focus-on-anchor script**

Anchor links scroll to a target with an `id`, but they don't move keyboard focus there in most browsers — only `tabindex="-1"` + `.focus()` does. Add this small inline script inside `<Base>` but outside the `<style>`, just before `</Base>`:

```astro
<script>
  // When an in-page anchor is activated, move keyboard focus to the target
  // heading so screen-reader and keyboard users land at the right place.
  document.querySelectorAll<HTMLAnchorElement>('nav.anchor-nav a').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      // Let the native scroll happen, then move focus.
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    });
  });
</script>
```

Place this just above the closing `</Base>` tag (after the `<style>` block — they're peers under `Base`).

- [ ] **Step 3: Run the blog-index tests, expect green**

Run:
```bash
npm run test:e2e -- tests/e2e/blog-index.spec.ts
```
Expected: all 5 tests PASS.

If the focus-management test fails because focus didn't move: re-check that `script` is reaching the page (Astro hoists `<script>` by default; that's fine — it ships as a module). Confirm the heading has `tabindex="-1"`.

- [ ] **Step 4: Run all e2e tests to confirm no regressions**

Run:
```bash
npm run test:e2e
```
Expected: all tests PASS, including home, a11y, reduced-motion, pause-toggle, viewport-snapshot.

- [ ] **Step 5: Smoke-check in the browser**

Run:
```bash
npm run dev
```
Open `http://localhost:4321/blog/` and confirm:
- The header reads "The Writing" / "Notes from the *margin*."
- Sections appear in the order Research → Essay → Process → Personal (skipping any with zero posts).
- Anchor links navigate to sections; tabbing after an anchor activation continues from inside the target section, not the top of the page.
- Each post links to `/blog/<slug>/` and renders correctly.

Kill the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "Add /blog/ landing page — tag-grouped post archive

Renders the full blog content collection grouped by tag enum
(Research, Essay, Process, Personal) with anchor-jump nav and
focus-on-heading on anchor activation. Empty sections are
omitted entirely, including their anchor link. Cards show
date + tag, title (with rose-italic em treatment), and the
frontmatter description."
```

---

## Task 4: Update `[...slug].astro` back-link to point at the new index

**Files:**
- Modify: `src/pages/blog/[...slug].astro:42-44`

Today the post detail's back-link points to `/#writing` (the home page Writing section). With a real index page, it should land readers on `/blog/`.

- [ ] **Step 1: Edit the back-link**

In `src/pages/blog/[...slug].astro`, change:

```astro
        <p class="post-detail__back">
          <a href="/#writing">← back to the writing</a>
        </p>
```

to:

```astro
        <p class="post-detail__back">
          <a href="/blog/">← back to the writing</a>
        </p>
```

- [ ] **Step 2: Run all e2e tests**

Run:
```bash
npm run test:e2e
```
Expected: all PASS. (No test currently asserts on the back-link href; this is a no-regression check.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "Point post-detail back-link at /blog/ instead of /#writing

Now that /blog/ is a real page, sending readers back to the
home-page anchor is a worse landing than the dedicated archive."
```

---

## Task 5: Add `/blog/` to the Axe accessibility suite

**Files:**
- Modify: `tests/e2e/a11y.spec.ts` (append)

The home page is covered today. Mirror that coverage for the new page.

- [ ] **Step 1: Append the test**

Add to the end of `tests/e2e/a11y.spec.ts`:

```typescript
test('/blog/ has no detectable a11y violations', async ({ page }) => {
  await page.goto('/blog/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

- [ ] **Step 2: Run the a11y suite**

Run:
```bash
npm run test:e2e -- tests/e2e/a11y.spec.ts
```
Expected: PASS. If Axe reports violations, fix them in `src/pages/blog/index.astro` and re-run — do not waive them.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/a11y.spec.ts
git commit -m "Cover /blog/ in the Axe a11y suite

Same WCAG 2.2 AA tag set as the home-page test."
```

---

## Task 6: Update CLAUDE.md to reflect the unified URL model

**Files:**
- Modify: `CLAUDE.md` (the "URL structure" table)

The current table claims `/research/<slug>/` exists. After this work, all posts live at `/blog/<slug>/` and the Research/Essay/Process/Personal distinction lives in the `tag` field.

- [ ] **Step 1: Edit the URL structure block**

In `CLAUDE.md`, replace the existing block:

```markdown
## URL structure

- `/` — home page (Inkling hero design)
- `/research/<slug>/` — formal paper landing pages with full citation metadata
- `/blog/<slug>/` — narrative posts and process notes
- `/about/` — author profile (`Person` JSON-LD with full identifier graph)
```

with:

```markdown
## URL structure

- `/` — home page (Inkling hero design)
- `/blog/` — full writing archive, grouped by `tag` (`Research`, `Essay`, `Process`, `Personal`)
- `/blog/<slug>/` — individual post detail. Research posts get `ScholarlyArticle` JSON-LD + Highwire `citation_*` tags on this same path (no `/research/` split — distinction rides on the `tag` field, not the URL).
- `/about/` — author profile (`Person` JSON-LD with full identifier graph)
```

- [ ] **Step 2: Confirm no other references to `/research/<slug>/` remain in CLAUDE.md**

Run:
```bash
grep -n "/research/" CLAUDE.md
```
Expected: no matches, or only matches that are about the *concept* of research (not a URL).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "CLAUDE.md: unify URL structure under /blog/

Drops the /research/<slug>/ split. Distinction between formal
papers and narrative posts now lives in the tag enum on each
post; per-paper Scholar metadata still applies to Research-tagged
posts on the /blog/<slug>/ path."
```

---

## Task 7: Final verification

- [ ] **Step 1: Full test suite**

Run:
```bash
npm run test:e2e
```
Expected: all PASS.

- [ ] **Step 2: Type check**

Run:
```bash
npm run check
```
Expected: 0 errors.

- [ ] **Step 3: Production build**

Run:
```bash
npm run build
```
Expected: build succeeds; `/blog/index.html` exists in `dist/`. Confirm with:
```bash
ls dist/blog/index.html
```

- [ ] **Step 4: Manual sanity check on the built output**

Run:
```bash
npm run preview
```
Open `http://localhost:4321/blog/` and confirm everything still looks right against the static build (not just dev).

- [ ] **Step 5: Done**

Nothing to commit on this task — verification only. Implementation is complete when all checks above are green.

---

## Out of scope (deliberate — do not implement)

- Per-tag pages like `/blog/tag/research/`.
- Filter UI (chips, dropdowns, tabs).
- Pagination.
- Per-post `ScholarlyArticle` / Highwire `citation_*` metadata (separate Plan 2 work per the Inkling spec).
- Inkling marginalia on `/blog/` — Trisha layers this later.
- Trimming `Writing.astro` on the home page to a curated 3-post preview — flagged as a follow-up, not part of this plan.

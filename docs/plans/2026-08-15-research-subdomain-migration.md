# Research Subdomain Migration Plan

**Date:** 2026-08-15  
**Status:** Approved for implementation  
**Primary site:** `https://trishasalas.com`  
**Research site:** `https://research.trishasalas.com`

## Goal

Create a self-contained research site for formal, citable outputs while keeping
essays, personal writing, process writing, Claude-isms, and short Notes on the
main site.

The research site should visually belong to the same family as the main site,
but it should not link back to the main site. The main site may link one-way to
the research site.

The implementation should make the formal publication pages straightforward
for scholarly crawlers to parse. It cannot guarantee indexing, but it should
follow Google Scholar's published technical requirements wherever the site has
control.

## Decisions

1. The research site will be a separate Astro repository and Netlify project.
2. `research.trishasalas.com` will contain formal publications and research
   outputs only. Notes remain on the main site.
3. The research site will not link back to `trishasalas.com`.
4. The main site's existing category-based writing architecture will remain.
5. The main URL root changes from `/blog/` to `/writing/`.
6. Writing detail URLs remain `/writing/<category>/<slug>/`.
7. `Notes` will be added as a writing category.
8. `Research` will be removed as a writing category.
9. `tags` remain supported in writing frontmatter but will not receive archive
   pages in this migration.
10. Existing URLs may change, but every meaningful old URL must receive an
    exact permanent redirect with no unnecessary redirect chain.
11. Zenodo remains the DOI registry and archival deposit. The research site
    becomes the first-party scholarly landing surface.

## Non-goals

- Guaranteeing or predicting Google Scholar indexing.
- Adding visible tag archives.
- Redesigning the main Writing archive or category sidebar.
- Replacing Zenodo or changing DOI registrations.
- Introducing a shared-package monorepo during the initial migration.
- Adding a link from the research site back to the main site.

## Target information architecture

### Main site

```text
https://trishasalas.com/
https://trishasalas.com/writing/
https://trishasalas.com/writing/essay/
https://trishasalas.com/writing/essay/<slug>/
https://trishasalas.com/writing/personal/
https://trishasalas.com/writing/personal/<slug>/
https://trishasalas.com/writing/process/
https://trishasalas.com/writing/process/<slug>/
https://trishasalas.com/writing/claude-isms/
https://trishasalas.com/writing/claude-isms/<slug>/
https://trishasalas.com/writing/notes/
https://trishasalas.com/writing/notes/<slug>/
https://trishasalas.com/about/
```

Writing categories after migration:

- Essay
- Personal
- Process
- Claude-isms
- Notes

Main navigation:

```text
Research -> https://research.trishasalas.com/
Writing  -> /writing/
About    -> /about/
```

Notes remain discoverable through the Writing archive and category sidebar.
They do not require another top-level navigation item.

### Research site

```text
https://research.trishasalas.com/
https://research.trishasalas.com/publications/
https://research.trishasalas.com/publications/<slug>/
https://research.trishasalas.com/publications/<slug>/<slug>.pdf
```

Research navigation:

```text
Trisha Salas · Research -> /
Publications            -> /publications/
```

The wordmark returns to the research homepage. There is no personal-site or
"back" link.

## Content ownership

| Current content | Destination | Type |
| --- | --- | --- |
| Accessibility Concept Emergence in the Pythia Suite | `research.trishasalas.com/publications/accessibility-concept-emergence-pythia/` | Publication |
| Pythia paper PDF | Inside the matching publication directory | Publication PDF |
| thatDangCircuit | `research.trishasalas.com/publications/that-dang-circuit/` | Software publication |
| Testing Accessibility Knowledge Across Pythia Model Sizes | `trishasalas.com/writing/notes/testing-accessibility-knowledge-pythia/` | Note |
| Existing Essay posts | `/writing/essay/<slug>/` | Writing |
| Existing Personal posts | `/writing/personal/<slug>/` | Writing |
| Existing Process posts | `/writing/process/<slug>/` | Writing |
| Existing Claude-isms posts | `/writing/claude-isms/<slug>/` | Writing |

## Phase 1: Baseline and URL manifest

1. Record the current working-tree state and preserve unrelated changes.
2. Run the current build, type checks, and end-to-end tests.
3. Inventory every current `/blog/` and legacy `/posts/` URL.
4. Assign exactly one final destination to each URL.
5. Store the mapping in a machine-testable redirect manifest.
6. Flag any category or slug collisions before moving routes.

Acceptance criteria:

- Every current public writing URL appears in the manifest.
- Existing cited URLs are listed explicitly rather than relying only on a
  wildcard rule.
- No old URL has more than one proposed destination.

## Phase 2: Research-site foundation

Create a separate repository provisionally named `trishasalas-research`.

Copy only the stable visual foundations from the main site:

- color, typography, spacing, and layout tokens
- global typography and focus styles
- reduced-motion behavior
- relevant card and long-form content patterns
- favicon, social-image treatment, and selected decorative assets

Do not directly import files from the main repository in the first version.
The sites should remain independently buildable and deployable.

Configure Astro with:

```text
site: https://research.trishasalas.com
build command: npm run build
publish directory: dist
```

Build:

- the self-contained research header and navigation
- the research homepage
- a Publications index
- a publication-detail layout
- a research footer with relevant identity links such as ORCID, DOI, GitHub,
  and email, but no link to the personal site

Acceptance criteria:

- The site reads as a visual sibling of the main site.
- The logo and internal navigation remain within the research site.
- Keyboard, focus, contrast, and reduced-motion behavior match the main site's
  accessibility standard.

## Phase 3: Publications collection and scholarly pages

Create a typed Publications collection supporting papers, software, datasets,
and future research outputs.

Suggested fields:

```text
title
shortTitle
shortTitleEm
abstract
authors
publicationDate
kind
doi
repositoryUrl
pdf
keywords
journalTitle
version
featured
```

Validation and drift guards:

- require title, author, date, kind, DOI, and abstract for paper records
- require emphasized title substrings to exist in their source strings
- keep DOI values separate from DOI URLs and display prefixes
- require specified local PDFs to exist
- keep paper PDFs inside their matching publication directory
- never emit Zenodo or another repository as a journal title
- require metadata title, authors, date, and canonical URL to equal the visible
  publication-page values

Each paper page contains:

1. Exact title as the primary heading.
2. Authors directly below the title.
3. Publication date and version.
4. A complete, visibly labelled abstract near the top.
5. DOI link to Zenodo.
6. Direct first-party PDF link.
7. A copyable or downloadable citation.
8. Extended explanation and figures when useful.

Paper pages emit:

- Highwire Press citation tags
- Schema.org `ScholarlyArticle` JSON-LD
- Dublin Core metadata
- canonical URL and DOI identifier
- Open Graph metadata

Software pages use an appropriate software or creative-work schema and do not
pretend to be journal papers.

The Pythia paper uses:

```text
/publications/accessibility-concept-emergence-pythia/
/publications/accessibility-concept-emergence-pythia/accessibility-concept-emergence-pythia.pdf
```

Acceptance criteria:

- Publication pages render without client-side JavaScript.
- Complete abstracts are visible to readers, not present only in metadata.
- PDFs return `200`, use a PDF content type, and contain searchable text.
- Every publication is reachable from the research homepage through ordinary
  HTML links.
- Each output has one canonical first-party landing page.

## Phase 4: Migrate formal research content

1. Move the Pythia publication record, PDF, metadata, and appropriate
   explanatory content to the research site.
2. Create the thatDangCircuit publication page while retaining its Zenodo DOI
   and archival link.
3. Build the research homepage and Publications index from the collection.
4. Add the research site's own `robots.txt`, sitemap, favicon, social image,
   404 page, and analytics configuration if desired.
5. Confirm that the research site contains primarily formal research outputs.

## Phase 5: Preserve and rename the main Writing structure

Rename the route root while retaining the hierarchy:

```text
/blog/                   -> /writing/
/blog/<category>/        -> /writing/<category>/
/blog/<category>/<slug>/ -> /writing/<category>/<slug>/
```

Implementation work:

1. Rename the route directory from `blog` to `writing`.
2. Update route builders and internal links from `/blog/` to `/writing/`.
3. Preserve the existing Writing archive layout.
4. Preserve the category archive layout and category sidebar.
5. Preserve category-scoped post permalinks.
6. Preserve the `tags` frontmatter field without adding tag pages.
7. Add `Notes` to the category schema and display order.
8. Remove `Research` from the category schema and display order.
9. Update Writing archive copy so it no longer describes formal papers as part
   of the archive.

Acceptance criteria:

- The Writing index looks and behaves as it did before migration.
- Category pages exist for Essay, Personal, Process, Claude-isms, and Notes.
- New categories can still be added through the existing schema and category
  list mechanism.
- Tags continue to validate and remain available for future use.
- No main-site writing page emits Highwire or `ScholarlyArticle` metadata.

## Phase 6: Reclassify retained research writing

Move "Testing Accessibility Knowledge Across Pythia Model Sizes" from Research
to Notes:

```text
/writing/notes/testing-accessibility-knowledge-pythia/
```

Review each remaining Research-category entry:

- formal citable output moves to the research site
- shorter exploration, process record, or precursor remains as a Note
- no content is silently deleted

Update links in Notes so formal outputs point to their canonical pages on the
research subdomain.

## Phase 7: Update main-site research links

1. Point the main navigation's Research item to
   `https://research.trishasalas.com/`.
2. Retain a compact research section on the main homepage.
3. Point publication cards to canonical research-subdomain pages.
4. Point "View all research" to the research homepage or Publications index.
5. Keep main-site cards as curated summaries only; do not duplicate full
   abstracts or scholarly metadata.
6. Remove the main site's Publications collection only after all consumers have
   been replaced safely.

## Phase 8: Permanent redirects

Specific research redirects must precede general Writing redirects.

Required examples:

```text
/blog/research/accessibility-concept-emergence-pythia/
  -> https://research.trishasalas.com/publications/accessibility-concept-emergence-pythia/

/blog/research/testing-accessibility-knowledge-pythia/
  -> https://trishasalas.com/writing/notes/testing-accessibility-knowledge-pythia/

/posts/testing-accessibility-knowledge-across-pythia-model-sizes/
  -> https://trishasalas.com/writing/notes/testing-accessibility-knowledge-pythia/

/blog/research/
  -> https://research.trishasalas.com/

/blog/essay/<slug>/
  -> /writing/essay/<slug>/

/blog/personal/<slug>/
  -> /writing/personal/<slug>/

/blog/process/<slug>/
  -> /writing/process/<slug>/

/blog/claude-isms/<slug>/
  -> /writing/claude-isms/<slug>/

/blog/
  -> /writing/
```

Generate final Netlify rules from the complete URL inventory; the examples are
not assumed to be exhaustive.

Acceptance criteria:

- Every inventoried legacy URL returns `301`.
- Every redirect reaches its final destination in one hop.
- Every final destination returns `200`.
- No article redirects to a generic homepage when an exact page exists.
- Query strings and trailing-slash variants behave consistently.
- No redirect loop crosses between the domains.

## Phase 9: Automated and visual verification

Research-site checks:

- publication metadata and drift guards
- canonical URLs and visible abstracts
- PDF availability, content type, size, and searchable text
- DOI links, sitemap inclusion, and robots access
- correct schema for papers versus software
- keyboard navigation, landmarks, reduced motion, responsive layout, and color
  contrast

Main-site checks:

- all writing appears under `/writing/<category>/<slug>/`
- Notes appears in the archive and category sidebar
- Research no longer appears as a writing category
- tags remain accepted by the schema
- research cards point to the subdomain
- no stale internal `/blog/` links remain
- redirect-manifest tests pass
- existing accessibility and responsive-layout tests remain green

Compare both sites at desktop, tablet, and mobile widths. They should read as
siblings without requiring identical navigation or content structure.

## Phase 10: Netlify preview deployment

Before changing production:

1. Create the research Netlify project.
2. Connect the research repository.
3. Configure the build command and publish directory.
4. Deploy to the temporary `.netlify.app` address.
5. Test every publication and asset at the temporary address.
6. Inspect rendered HTML source for scholarly metadata.
7. Review the visual result before attaching the custom subdomain.

The current production site remains unchanged during this phase.

## Phase 11: Coordinated launch

Launch order:

1. Attach `research.trishasalas.com` to the research Netlify project.
2. Wait for DNS verification and HTTPS provisioning.
3. Verify every research URL on the custom subdomain.
4. Deploy the renamed and reclassified main Writing structure.
5. Activate the old-to-new redirects.
6. Run the complete legacy URL manifest against production.
7. Verify canonical URLs, sitemaps, robots files, PDFs, and navigation on both
   sites.

The research destination must be live before the main site redirects visitors
to it.

## Phase 12: Post-launch checks

1. Add or verify the research subdomain in Google Search Console.
2. Submit the research sitemap.
3. Request indexing for the Publications index and initial paper page.
4. Search Google Scholar by exact paper title rather than relying only on the
   `site:` operator.
5. Monitor Netlify logs and Search Console crawl reports.
6. Correct observable crawl or metadata failures.
7. Avoid changing canonical publication URLs while indexing settles.

## Rollback strategy

Keep the current main-site production deploy available in Netlify.

If launch fails:

1. Restore the preceding main-site deploy.
2. Leave the research site online only if its pages and domain are healthy.
3. Do not remove old redirects or source content until final destinations have
   been verified in production.
4. Re-run the redirect manifest before attempting launch again.

## Completion criteria

The migration is complete when:

- the research subdomain is live over HTTPS
- all formal publications have canonical first-party landing pages
- the Pythia PDF is served from its publication directory
- the main Writing archive uses `/writing/<category>/<slug>/`
- Notes exists as a main-site category
- Research no longer exists as a main-site category
- categories and unsurfaced tags remain supported
- every legacy URL reaches the correct final destination with one permanent
  redirect
- both sites pass their build, metadata, accessibility, and responsive-layout
  checks
- the final URL and redirect manifests are documented

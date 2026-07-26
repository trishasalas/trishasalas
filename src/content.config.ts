import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    // Substring of `title` to wrap in <em> for the rose-italic em treatment.
    // Matches the card pattern from the original hardcoded posts.
    titleEm: z.string().optional(),
    description: z.string(),
    // Optional so drafts without a confirmed publish date still validate.
    // Drafts render the "Drafting" date label instead of a formatted date.
    pubDate: z.coerce.date().optional(),
    category: z.enum([
      "Research",
      "Essay",
      "Personal",
      "Process",
      "Claude-isms",
      "The-Notes"
    ]),
    // Optional tags that accept any new string entry
    tags: z.array(z.string()).default([]),
    // Scholarly metadata no longer rides on the blog entry — it lives in the
    // `publications` collection, and a post's citation tags switch on when a
    // publication references it via `post`. See ScholarlyMeta + [slug].astro.
    draft: z.boolean().default(false),
  }),
});

// Research artifacts: external, DOI'd, dated. No routes of their own — they
// surface on the home Research section, and when `post` is set they lend
// scholarly metadata to that post page. Deliberately NOT `research` (collides
// with the `Research` blog category) and NOT a `paper` block on `blog` (an
// artifact with no write-up, like thatDangCircuit, has no business being a post).
const publications = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/publications" }),
  schema: z.object({
    title: z.string(),                  // full scholarly title — what gets cited
    shortTitle: z.string(),             // running head — what the card displays
    shortTitleEm: z.string().optional(),// substring of shortTitle for the rose-italic <em>
    abstract: z.string(),               // scholarly prose (≠ a post's ~155-char description)
    doi: z.string(),
    venue: z.string(),                  // the DOI's home (e.g. "Zenodo") — card display, NOT a journal tag
    // citation_journal_title is emitted IFF set. Presence-driven: only when a
    // journal/conference actually published the work. Repository deposits leave
    // this unset rather than asserting the repository name as the journal.
    journalTitle: z.string().optional(),
    kind: z.enum(['article', 'software']),
    publicationDate: z.coerce.date(),
    hostedAt: z.string().url(),
    citedBy: z.number().optional(),
    scope: z.string().optional(),       // e.g. "Software · v1.0.0"
    post: z.string().optional(),        // slug of the write-up, if one exists
    // Citation-facing fields — consumed by ScholarlyMeta when `post` is set.
    // Self-contained here so the component needs no fallbacks to the post.
    authors: z.array(z.string()).default(['Trisha Salas']),   // natural order
    pdf: z.string().optional(),                               // "/papers/<slug>.pdf" — citation_pdf_url
    keywords: z.array(z.string()).default([]),
  }).refine(
    (d) => !d.shortTitleEm || d.shortTitle.includes(d.shortTitleEm),
    { message: 'shortTitleEm must be a substring of shortTitle', path: ['shortTitleEm'] },
  ),
});

export const collections = { blog, publications };

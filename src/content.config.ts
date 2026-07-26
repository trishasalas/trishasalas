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
    // Optional scholarly metadata. Presence of this block (not the category)
    // is the on/off switch for per-paper Highwire/Schema.org/Dublin Core tags.
    paper: z.object({
      authors: z.array(z.string()).default(['Trisha Salas']), // natural order
      publicationDate: z.coerce.date().optional(),            // falls back to pubDate
      doi: z.string().optional(),                             // bare "10.…/v2"; URL built downstream
      pdf: z.string().optional(),                             // "/papers/<slug>.pdf" — self-hosted
      venue: z.string().optional(),                           // the DOI's home (e.g. "Zenodo") — card display, NOT a journal tag
      // citation_journal_title is emitted IFF this is set. Presence-driven: set it
      // only when a journal/conference actually published the work. A repository
      // deposit (Zenodo, etc.) has no journal, so this stays unset and no tag is
      // emitted — rather than asserting the repository name as the journal.
      journalTitle: z.string().optional(),
      abstract: z.string().optional(),                        // falls back to description
      keywords: z.array(z.string()).default([]),
    }).optional(),
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
    // this unset (see the blog `paper` block for the same rule, shipped ahead of here).
    journalTitle: z.string().optional(),
    kind: z.enum(['article', 'software']),
    publicationDate: z.coerce.date(),
    hostedAt: z.string().url(),
    citedBy: z.number().optional(),
    scope: z.string().optional(),       // e.g. "Software · v1.0.0"
    post: z.string().optional(),        // slug of the write-up, if one exists
  }).refine(
    (d) => !d.shortTitleEm || d.shortTitle.includes(d.shortTitleEm),
    { message: 'shortTitleEm must be a substring of shortTitle', path: ['shortTitleEm'] },
  ),
});

export const collections = { blog, publications };

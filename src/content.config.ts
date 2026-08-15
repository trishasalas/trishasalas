import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    // Substring of `title` to wrap in <em> for the rose-italic em treatment.
    // Matches the card pattern from the original hardcoded posts.
    titleEm: z.string().optional(),
    // .min(1): an empty description becomes an empty <meta name="description">
    // and og:description. Fail the build instead of shipping a blank tag.
    description: z.string().min(1),
    // Optional so drafts without a confirmed publish date still validate.
    // Drafts render the "Drafting" date label instead of a formatted date.
    pubDate: z.coerce.date().optional(),
    category: z.enum([
      "Notes",
      "Essay",
      "Personal",
      "Process",
      "Claude-isms",
    ]),
    // Optional tags that accept any new string entry
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }).refine(
    // Mirrors the shortTitleEm guard on publications: if titleEm isn't a
    // substring of title, emify's .replace() is a silent no-op and the rose
    // italic just vanishes. Catch it at build time.
    (d) => !d.titleEm || d.title.includes(d.titleEm),
    { message: 'titleEm must be a substring of title', path: ['titleEm'] },
  ),
});

// Research artifacts retained as a small main-site feed for homepage cards.
// Their canonical landing pages live on research.trishasalas.com.
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
    authors: z.array(z.string()).default(['Trisha Salas']),   // natural order
    pdf: z.string().optional(),                               // "/papers/<slug>.pdf" — citation_pdf_url
    keywords: z.array(z.string()).default([]),
  }).refine(
    (d) => !d.shortTitleEm || d.shortTitle.includes(d.shortTitleEm),
    { message: 'shortTitleEm must be a substring of shortTitle', path: ['shortTitleEm'] },
  ),
});

export const collections = { blog, publications };

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
      venue: z.string().optional(),                           // citation_journal_title (DOI's home)
      abstract: z.string().optional(),                        // falls back to description
      keywords: z.array(z.string()).default([]),
    }).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

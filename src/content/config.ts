import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Substring of `title` to wrap in <em> for the rose-italic em treatment.
    // Matches the card pattern from the original hardcoded posts.
    titleEm: z.string().optional(),
    description: z.string(),
    // Optional so drafts without a confirmed publish date still validate.
    // Drafts render the "Drafting" date label instead of a formatted date.
    pubDate: z.coerce.date().optional(),
    tag: z.enum(['Research', 'Essay', 'Personal', 'Process']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

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

import { getCollection, type CollectionEntry } from 'astro:content';

export type Publication = CollectionEntry<'publications'>;

/**
 * Research artifacts, newest first. These have no routes of their own — the
 * home Research section renders them, and when `post` is set the matching post
 * page pulls scholarly metadata from here (see ScholarlyMeta, Phase 3).
 */
export async function getPublications(): Promise<Publication[]> {
  const all = await getCollection('publications');
  return all.sort(
    (a, b) => b.data.publicationDate.getTime() - a.data.publicationDate.getTime(),
  );
}

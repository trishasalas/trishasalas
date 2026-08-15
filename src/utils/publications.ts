import { getCollection, type CollectionEntry } from 'astro:content';

export type Publication = CollectionEntry<'publications'>;

/**
 * A small research feed for main-site homepage cards. Canonical publication
 * pages and scholarly metadata live on research.trishasalas.com.
 */
export async function getPublications(): Promise<Publication[]> {
  const all = await getCollection('publications');
  return all.sort(
    (a, b) => b.data.publicationDate.getTime() - a.data.publicationDate.getTime(),
  );
}

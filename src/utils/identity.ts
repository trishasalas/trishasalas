// Single source of truth for the keystone author identity. ORCID is the
// canonical @id that links every "Trisha Salas" reference across the site
// (home WebSite, About Person, per-paper ScholarlyArticle author) to one
// ORCID record. Values mirror docs/social-urls.md.

export const ORCID = 'https://orcid.org/0009-0007-5105-7874';

export const AUTHOR = {
  name: 'Trisha Salas',
  orcid: ORCID,
  aboutUrl: 'https://trishasalas.com/about/',
  /** Person-profile URLs only — work identifiers (DOIs) live on the article. */
  sameAs: [
    ORCID,
    'https://github.com/trishasalas',
    'https://www.linkedin.com/in/trishasalas/',
    'https://openreview.net/profile?id=%7ETrisha_Salas1',
    // Add Google Scholar / Semantic Scholar profile URLs here post-indexing.
  ],
} as const;

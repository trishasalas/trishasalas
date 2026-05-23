import { test, expect, type Page } from '@playwright/test';

const ORCID = 'https://orcid.org/0009-0007-5105-7874';
const PAPER_URL = '/blog/research/accessibility-concept-emergence-pythia/';
const PRECURSOR_URL = '/blog/research/testing-accessibility-knowledge-pythia/';

function metaContent(page: Page, name: string) {
  return page.locator(`meta[name="${name}"]`).first().getAttribute('content');
}

async function jsonLdBlocks(page: Page): Promise<any[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((t) => JSON.parse(t));
}

test('home declares robots index,follow', async ({ page }) => {
  await page.goto('/');
  expect(await metaContent(page, 'robots')).toBe('index, follow');
});

test('home has WebSite JSON-LD crediting the ORCID author', async ({ page }) => {
  await page.goto('/');
  const blocks = await jsonLdBlocks(page);
  const website = blocks.find((b) => b['@type'] === 'WebSite');
  expect(website, 'a WebSite JSON-LD block exists').toBeTruthy();
  expect(website.author['@id']).toBe(ORCID);
  // The standalone Person block has moved to /about/.
  expect(blocks.find((b) => b['@type'] === 'Person')).toBeUndefined();
});

test('about has Person JSON-LD keyed on ORCID with profile sameAs', async ({ page }) => {
  await page.goto('/about/');
  const blocks = await jsonLdBlocks(page);
  const person = blocks.find((b) => b['@type'] === 'Person');
  expect(person, 'a Person JSON-LD block exists').toBeTruthy();
  expect(person['@id']).toBe(ORCID);
  expect(person.url).toBe('https://trishasalas.com/about/');
  expect(person.sameAs).toContain('https://github.com/trishasalas');
  // sameAs holds person profiles only — the paper DOI is NOT a person identifier.
  expect(person.sameAs).not.toContain('https://doi.org/10.22541/au.177282002.24340653/v2');
});

test('paper page emits Highwire citation tags', async ({ page }) => {
  await page.goto(PAPER_URL);
  expect(await metaContent(page, 'citation_title')).toContain('Accessibility Concept Emergence');
  expect(await metaContent(page, 'citation_author')).toBe('Trisha Salas');
  // Exactly one author tag — guards the multi-author .map() against duplicates/drift.
  expect(await page.locator('meta[name="citation_author"]').count()).toBe(1);
  expect(await metaContent(page, 'citation_doi')).toBe('10.22541/au.177282002.24340653/v2');
  expect(await metaContent(page, 'citation_pdf_url')).toBe(
    'https://trishasalas.com/papers/accessibility-concept-emergence-pythia.pdf',
  );
  expect(await metaContent(page, 'citation_journal_title')).toBe('TechRxiv');
  expect(await metaContent(page, 'citation_publication_date')).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  expect(await metaContent(page, 'citation_keywords')).toContain('mechanistic interpretability');
});

test('paper page emits ScholarlyArticle JSON-LD with ORCID author', async ({ page }) => {
  await page.goto(PAPER_URL);
  const blocks = await jsonLdBlocks(page);
  const article = blocks.find((b) => b['@type'] === 'ScholarlyArticle');
  expect(article, 'a ScholarlyArticle block exists').toBeTruthy();
  const trisha = article.author.find((a) => a.name === 'Trisha Salas');
  expect(trisha['@id']).toBe(ORCID);
  expect(article.identifier).toBe('https://doi.org/10.22541/au.177282002.24340653/v2');
});

test('paper page emits Dublin Core tags', async ({ page }) => {
  await page.goto(PAPER_URL);
  expect(await metaContent(page, 'DC.title')).toContain('Accessibility Concept Emergence');
  expect(await metaContent(page, 'DC.creator')).toBe('Trisha Salas');
  expect(await metaContent(page, 'DC.type')).toBe('Text');
});

test('non-paper post emits no citation/article/DC metadata', async ({ page }) => {
  await page.goto(PRECURSOR_URL);
  expect(await page.locator('meta[name="citation_title"]').count()).toBe(0);
  const blocks = await jsonLdBlocks(page);
  expect(blocks.find((b) => b['@type'] === 'ScholarlyArticle')).toBeUndefined();
  expect(await page.locator('meta[name="DC.title"]').count()).toBe(0);
});

test('paper page shows a visible author byline', async ({ page }) => {
  await page.goto(PAPER_URL);
  const byline = page.locator('.post-detail__byline');
  await expect(byline).toBeVisible();
  await expect(byline).toContainText('Trisha Salas');
});

test('non-paper post shows no byline', async ({ page }) => {
  await page.goto(PRECURSOR_URL);
  expect(await page.locator('.post-detail__byline').count()).toBe(0);
});

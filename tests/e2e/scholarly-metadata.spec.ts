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

import { test, expect, type Page } from '@playwright/test';

const ORCID = 'https://orcid.org/0009-0007-5105-7874';
const NOTE_URL = '/writing/notes/testing-accessibility-knowledge-pythia/';
const PAPER_URL = 'https://research.trishasalas.com/publications/accessibility-concept-emergence-pythia/';

function metaContent(page: Page, name: string) {
  return page.locator(`meta[name="${name}"]`).first().getAttribute('content');
}

async function jsonLdBlocks(page: Page): Promise<any[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((text) => JSON.parse(text));
}

test('home declares robots index,follow', async ({ page }) => {
  await page.goto('/');
  expect(await metaContent(page, 'robots')).toBe('index, follow');
});

test('home has WebSite JSON-LD crediting the ORCID author', async ({ page }) => {
  await page.goto('/');
  const blocks = await jsonLdBlocks(page);
  const website = blocks.find((block) => block['@type'] === 'WebSite');
  expect(website, 'a WebSite JSON-LD block exists').toBeTruthy();
  expect(website.author['@id']).toBe(ORCID);
});

test('about has Person JSON-LD keyed on ORCID with profile sameAs', async ({ page }) => {
  await page.goto('/about/');
  const blocks = await jsonLdBlocks(page);
  const person = blocks.find((block) => block['@type'] === 'Person');
  expect(person, 'a Person JSON-LD block exists').toBeTruthy();
  expect(person['@id']).toBe(ORCID);
  expect(person.url).toBe('https://trishasalas.com/about/');
  expect(person.sameAs).toContain('https://github.com/trishasalas');
});

test('main-site Note emits no scholarly publication metadata', async ({ page }) => {
  await page.goto(NOTE_URL);
  expect(await page.locator('meta[name="citation_title"]').count()).toBe(0);
  expect(await page.locator('meta[name="DC.title"]').count()).toBe(0);
  const blocks = await jsonLdBlocks(page);
  expect(blocks.find((block) => block['@type'] === 'ScholarlyArticle')).toBeUndefined();
});

test('Note links to the canonical research publication', async ({ page }) => {
  await page.goto(NOTE_URL);
  await expect(page.locator(`.post-detail__body a[href="${PAPER_URL}"]`).first()).toBeVisible();
});

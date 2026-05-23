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

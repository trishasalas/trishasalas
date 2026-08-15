import { test, expect } from '@playwright/test';

// The blog index is a flat, chronological list of all published posts.
// Category grouping lives on the per-category index pages (/writing/<category>/),
// not here — the old grouped-sections + anchor-nav jump design was retired in
// the route restructure.

test('/writing/ renders the page header', async ({ page }) => {
  await page.goto('/writing/');
  await expect(page).toHaveTitle(/The Writing/);
  await expect(page.locator('h1.blog-index__title')).toContainText('Notes from the');
  await expect(page.locator('h1.blog-index__title em')).toContainText('margin');
});

test('/writing/ renders a flat list of post cards', async ({ page }) => {
  await page.goto('/writing/');
  const cards = page.locator('ul.blog-index__list > li.post-card');
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
});

test('/writing/ post card shows date (or draft label), tag, title, description', async ({ page }) => {
  await page.goto('/writing/');
  const firstCard = page.locator('li.post-card').first();

  await expect(firstCard.locator('time, .draft-label')).toBeVisible();
  await expect(firstCard.locator('.post-card__tag')).toBeVisible();
  await expect(firstCard.locator('h3 a')).toBeVisible();
  await expect(firstCard.locator('.post-card__desc')).toBeVisible();

  // Post links use the two-segment route: /writing/<category>/<slug>/
  const href = await firstCard.locator('h3 a').getAttribute('href');
  expect(href).toMatch(/^\/writing\/[^/]+\/[^/]+\/$/);
});

test('/writing/ category tag links point to the category index', async ({ page }) => {
  await page.goto('/writing/');
  // The tag chip links to the single-segment category index: /writing/<category>/
  const href = await page.locator('li.post-card .post-card__tag').first().getAttribute('href');
  expect(href).toMatch(/^\/writing\/[^/]+\/$/);
});

import { test, expect } from '@playwright/test';

// The blog index is a flat, chronological list of all published posts.
// Category grouping lives on the per-category index pages (/blog/<category>/),
// not here — the old grouped-sections + anchor-nav jump design was retired in
// the route restructure.

test('/blog/ renders the page header', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page).toHaveTitle(/The Writing/);
  await expect(page.locator('h1.blog-index__title')).toContainText('Notes from the');
  await expect(page.locator('h1.blog-index__title em')).toContainText('margin');
});

test('/blog/ renders a flat list of post cards', async ({ page }) => {
  await page.goto('/blog/');
  const cards = page.locator('ul.blog-index__list > li.post-card');
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
});

test('/blog/ post card shows date (or draft label), tag, title, description', async ({ page }) => {
  await page.goto('/blog/');
  const firstCard = page.locator('li.post-card').first();

  await expect(firstCard.locator('time, .draft-label')).toBeVisible();
  await expect(firstCard.locator('.post-card__tag')).toBeVisible();
  await expect(firstCard.locator('h3 a')).toBeVisible();
  await expect(firstCard.locator('.post-card__desc')).toBeVisible();

  // Post links use the two-segment route: /blog/<category>/<slug>/
  const href = await firstCard.locator('h3 a').getAttribute('href');
  expect(href).toMatch(/^\/blog\/[^/]+\/[^/]+\/$/);
});

test('/blog/ category tag links point to the category index', async ({ page }) => {
  await page.goto('/blog/');
  // The tag chip links to the single-segment category index: /blog/<category>/
  const href = await page.locator('li.post-card .post-card__tag').first().getAttribute('href');
  expect(href).toMatch(/^\/blog\/[^/]+\/$/);
});

import { test, expect } from '@playwright/test';

test('home page renders all major sections', async ({ page }) => {
  await page.goto('/');

  // Hero
  await expect(page.locator('.hero h1')).toContainText('Following the');
  await expect(page.locator('.hero h1 em')).toContainText('inkling');

  // Hero meta
  await expect(page.getByText('Broken Arrow, OK', { exact: true })).toBeVisible();

  // Research section
  await expect(page.locator('#research h2')).toContainText('research');
  await expect(page.locator('.paper').first()).toBeVisible();

  // Writing section
  await expect(page.locator('#writing h2')).toContainText('margin');

  // Lineage section
  await expect(page.locator('#about h2')).toContainText('inklings');

  // Footer + pause toggle
  await expect(page.getByRole('button', { name: /pause animations/i })).toBeVisible();
});

test('hero Inkling raster loads', async ({ page }) => {
  await page.goto('/');
  const inkling = page.locator('img[alt="Inkling, in flight."]');
  await expect(inkling).toBeVisible();
  // Verify the file actually loaded (not a broken image)
  const naturalWidth = await inkling.evaluate(
    (img: HTMLImageElement) => img.naturalWidth,
  );
  expect(naturalWidth).toBeGreaterThan(0);
});

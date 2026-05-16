import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no detectable a11y violations (default)', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('home page has no detectable a11y violations (motion paused)', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /pause animations/i }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('all images have alt attribute', async ({ page }) => {
  await page.goto('/');
  const imgs = await page.locator('img').all();
  for (const img of imgs) {
    const alt = await img.getAttribute('alt');
    expect(alt, 'every <img> must have an alt attribute').not.toBeNull();
  }
});

test('/blog/ has no detectable a11y violations', async ({ page }) => {
  await page.goto('/blog/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

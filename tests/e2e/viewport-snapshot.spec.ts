import { test, expect } from '@playwright/test';

const breakpoints = [
  { name: '1920-desktop', width: 1920, height: 1080 },
  { name: '1440-laptop',  width: 1440, height: 900 },
  { name: '1280-laptop',  width: 1280, height: 800 },
  { name: '1024-tablet-l', width: 1024, height: 768 },
  { name: '900-tablet',   width: 900,  height: 1200 },
  { name: '768-tablet-p', width: 768,  height: 1024 },
  { name: '600-mobile-l', width: 600,  height: 800 },
  { name: '375-mobile',   width: 375,  height: 800 },
];

for (const bp of breakpoints) {
  test(`snapshot at ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `test-results/snapshots/${bp.name}.png`,
      fullPage: false,
    });
    // Sanity: hero is visible at every breakpoint
    await expect(page.locator('.hero h1')).toBeVisible();
  });
}

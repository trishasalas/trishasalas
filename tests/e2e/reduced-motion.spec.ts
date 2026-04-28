import { test, expect } from '@playwright/test';

test.describe('prefers-reduced-motion', () => {
  test('applies motion-paused on load when system requests reduced motion', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');

    // motion-init runs in <head> before paint; class should be present
    // immediately on body once it parses.
    await expect(page.locator('body')).toHaveClass(/motion-paused/);
    await context.close();
  });

  test('without reduced-motion setting, animations are NOT paused by default', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
  });

  test('reduced-motion does not write to localStorage', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    const stored = await page.evaluate(() =>
      localStorage.getItem('motion-paused'),
    );
    // System pref triggers the class but should NOT persist as user choice
    expect(stored).toBeNull();
    await context.close();
  });
});

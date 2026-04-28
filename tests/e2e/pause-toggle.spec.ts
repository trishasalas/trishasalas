import { test, expect } from '@playwright/test';

test.describe('pause-animations toggle (WCAG 2.2.2)', () => {
  test('toggles motion-paused class on body', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');
    await expect(body).not.toHaveClass(/motion-paused/);

    await page.getByRole('button', { name: /pause animations/i }).click();

    await expect(body).toHaveClass(/motion-paused/);
    await expect(
      page.getByRole('button', { name: /animations paused/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /pause animations/i }).click();

    await page.reload();

    await expect(page.locator('body')).toHaveClass(/motion-paused/);
    await expect(
      page.getByRole('button', { name: /animations paused/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('un-pause clears persisted state', async ({ page }) => {
    await page.goto('/');
    // Pause
    await page.getByRole('button', { name: /pause animations/i }).click();
    // Un-pause
    await page.getByRole('button', { name: /animations paused/i }).click();

    await page.reload();

    await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
    const stored = await page.evaluate(() =>
      localStorage.getItem('motion-paused'),
    );
    expect(stored).toBeNull();
  });

  test('keyboard: space and enter toggle the button', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /pause animations/i });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveClass(/motion-paused/);
    await page.keyboard.press('Space');
    await expect(page.locator('body')).not.toHaveClass(/motion-paused/);
  });
});

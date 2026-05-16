import { test, expect } from '@playwright/test';

const TAGS = ['Research', 'Essay', 'Process', 'Personal'] as const;
type Tag = typeof TAGS[number];
const tagToId: Record<Tag, string> = {
  Research: 'research',
  Essay: 'essay',
  Process: 'process',
  Personal: 'personal',
};

test('/blog/ renders the page header', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page).toHaveTitle(/The Writing/);
  await expect(page.locator('h1')).toContainText('Notes from the');
  await expect(page.locator('h1 em')).toContainText('margin');
});

test('/blog/ shows one section per tag that has at least one post', async ({ page }) => {
  await page.goto('/blog/');

  // For each tag, the section is either present with >=1 post, or absent entirely.
  for (const tag of TAGS) {
    const heading = page.locator(`h2#${tagToId[tag]}`);
    const count = await heading.count();
    if (count === 0) continue; // empty tag — section correctly omitted

    // Section exists: it must have at least one post card under it.
    await expect(heading).toBeVisible();
    const section = page.locator(`section[data-tag="${tag}"]`);
    const cards = section.locator('li.post-card');
    await expect.poll(() => cards.count()).toBeGreaterThan(0);
  }
});

test('/blog/ anchor-jump nav matches rendered sections', async ({ page }) => {
  await page.goto('/blog/');

  const anchorLinks = page.locator('nav.anchor-nav a');
  const anchorHrefs = await anchorLinks.evaluateAll(
    (els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href') ?? ''),
  );

  for (const href of anchorHrefs) {
    expect(href).toMatch(/^#(research|essay|process|personal)$/);
    const id = href.slice(1);
    await expect(page.locator(`h2#${id}`)).toBeVisible();
  }

  // Every visible tag-section h2 must have a corresponding anchor link
  const visibleHeadingIds = await page
    .locator('section.blog-section h2[id]')
    .evaluateAll((els) => els.map((el) => el.id));
  for (const id of visibleHeadingIds) {
    expect(anchorHrefs).toContain(`#${id}`);
  }
});

test('/blog/ anchor activation lands focus on the section heading', async ({ page }) => {
  await page.goto('/blog/');
  const firstAnchor = page.locator('nav.anchor-nav a').first();
  await expect(firstAnchor).toBeVisible();
  const targetHref = await firstAnchor.getAttribute('href');
  expect(targetHref).toBeTruthy();
  await firstAnchor.click();

  // Focus is moved inside a requestAnimationFrame, so poll until it lands.
  const targetId = targetHref!.slice(1);
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.id ?? null))
    .toBe(targetId);
});

test('/blog/ post card shows date, tag, title, description', async ({ page }) => {
  await page.goto('/blog/');
  const firstCard = page.locator('li.post-card').first();

  await expect(firstCard.locator('time, .draft-label')).toBeVisible();
  await expect(firstCard.locator('.post-card__tag')).toBeVisible();
  await expect(firstCard.locator('h3 a')).toBeVisible();
  await expect(firstCard.locator('.post-card__desc')).toBeVisible();

  const href = await firstCard.locator('h3 a').getAttribute('href');
  expect(href).toMatch(/^\/blog\/[^/]+\/$/);
});

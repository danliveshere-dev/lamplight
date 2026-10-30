import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const open = async (page, attrs = {}) => {
  await page.goto('/test/browser/fixture.html');
  await page.locator('[data-testid="room"]').evaluate((room, values) => {
    for (const [key, value] of Object.entries(values)) room.dataset[key] = value;
  }, attrs);
  await page.locator('#qa-tab-reading').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
};
const prop = (locator, name) => locator.evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);

test('Night is unchanged when no mode is set', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-testid="room"]')).toHaveCSS('color-scheme', 'dark');
});

test('Day turns the Room to ink on parchment', async ({ page }) => {
  await open(page, { mode: 'day' });
  const room = page.locator('[data-testid="room"]');
  await expect(room).toHaveCSS('color-scheme', 'light');
  await expect(room).toHaveCSS('color', 'rgb(20, 17, 24)');
  await expect(room).toHaveCSS('background-color', 'rgb(246, 236, 217)');
});

test('the focal subject stays a block of night in Day', async ({ page }) => {
  await open(page, { mode: 'day' });
  await expect(page.locator('.l-focal-catch').first()).toHaveCSS('color', 'rgb(232, 220, 196)');
});

test('Day has no serious accessibility findings', async ({ page }) => {
  await open(page, { mode: 'day' });
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = report.violations.filter((item) => ['serious', 'critical'].includes(item.impact));
  expect(serious, serious.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
});

test('nested rooms inherit Day and explicit Night restores it', async ({ page }) => {
  await open(page, { mode: 'day' });
  const nested = page.getByTestId('reduced-room');
  await expect(nested).toHaveCSS('color-scheme', 'light');
  await nested.evaluate(el => el.dataset.mode = 'night');
  await expect(nested).toHaveCSS('color-scheme', 'dark');
  expect(await prop(nested, '--lamp-surface-page')).toBe('#141118');
});

test('Folio overrides a Day focal island when nested', async ({ page }) => {
  await open(page, { mode: 'day' });
  const focal = page.locator('.l-focal-catch');
  await focal.evaluate(el => el.parentElement.dataset.surface = 'folio');
  await expect(focal).toHaveCSS('color-scheme', 'light');
  await expect(focal).toHaveCSS('color', 'rgb(20, 17, 24)');
});

test('Day on the document reaches an embedded Room', async ({ page }) => {
  await open(page);
  await page.locator('html').evaluate(el => el.dataset.mode = 'day');
  const room = page.getByTestId('room');
  await expect(room).toHaveCSS('color-scheme', 'light');
  await expect(room).toHaveCSS('background-color', 'rgb(246, 236, 217)');
});

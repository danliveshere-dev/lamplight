import { expect, test } from '@playwright/test';

test('local installed Chrome renders the core fixture @local-chrome', async ({ page, browserName }) => {
  await page.goto('/test/browser/fixture.html');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-testid="room"]')).toHaveCSS('color-scheme', 'dark');
  expect(browserName).toBe('chromium');
});

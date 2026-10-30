import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const url = '/examples/showcase/dist/index.html';
for (const mode of ['night', 'day']) {
  for (const surface of ['study', 'ledger', 'folio']) {
    test(`${mode} ${surface} is operable and accessible`, async ({ page }) => {
      await page.goto(url);
      await page.locator(`input[name=mode][value=${mode}]`).check();
      await page.locator(`input[name=surface][value=${surface}]`).check();
      await expect(page.locator('#showcase')).toHaveAttribute('data-mode', mode);
      await expect(page.locator('#showcase')).toHaveAttribute('data-surface', surface);
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(report.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
    });
  }
}
test('controls work with keyboard and the example does not save', async ({ page }) => {
  await page.goto(url);
  await page.getByLabel('Day', { exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#showcase')).toHaveAttribute('data-mode', 'day');
  await page.getByRole('button', { name: 'Show an example state' }).click();
  await expect(page.getByRole('status')).toContainText('Nothing was saved');
});
test('default content is readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Field notes' })).toBeVisible();
  await expect(page.getByText('Enable JavaScript to change the display.', { exact: false })).toBeVisible();
  await context.close();
});
test('desktop and mobile fit and render with reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`showcase-${viewport.width}.png`), fullPage: true });
  }
});

test('print shows the entered value as static text', async ({ page }) => {
  await page.goto(url);
  await page.getByLabel('A note to keep').fill('An illustrative note');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#note')).toBeHidden();
  await expect(page.locator('#print-note')).toHaveText('An illustrative note');
  await expect(page.locator('#print-note')).toBeVisible();
});

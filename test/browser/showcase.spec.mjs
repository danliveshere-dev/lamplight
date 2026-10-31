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
test('explains choices before the switcher and links to the references', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#examples > p').first()).toBeVisible();
  await expect(page.locator('#examples > p').first()).toContainText('Folio prepares content for print.');
  expect(await page.locator('.intro').evaluate(el => Boolean(el.compareDocumentPosition(document.querySelector('.controls')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(page.getByRole('rowheader', { name: 'North bed' })).toBeVisible();
  await expect(page.locator('table tbody tr').filter({ has: page.locator('th[scope=row]') })).toHaveCount(12);
  await page.getByRole('link', { name: 'Components', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Leads, threads and knots' })).toBeVisible();
  await expect(page.locator('.l-lead-line')).toBeVisible();
  await expect(page.locator('.l-knot')).toHaveCount(3);
  await page.getByRole('link', { name: 'Principles', exact: true }).click();
  await expect(page.locator('.principle-list article')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Everyone can read it' })).toBeVisible();
});
test('keyboard settings, filtering and selection update the local detail', async ({ page }) => {
  await page.goto(url);
  await page.getByLabel('Day', { exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#showcase')).toHaveAttribute('data-mode', 'day');
  await page.getByLabel('Show places').selectOption('Paths');
  await expect(page.getByRole('button', { name: /North bed/ })).toBeHidden();
  await expect(page.locator('#detail-name')).toHaveText('Creek path');
  const east = page.getByRole('button', { name: /East walk/ });
  await east.focus();
  await page.keyboard.press('Space');
  await expect(east).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#detail-state')).toHaveText('Review');
  await expect(page.locator('#detail-done')).toHaveText('5');
});
test('default content is readable without JavaScript and controls are disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Making room to grow.' })).toBeVisible();
  await expect(page.getByText('Enable JavaScript to change the display', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Show places')).toBeDisabled();
  await expect(page.getByRole('button', { name: /North bed/ })).toBeDisabled();
  await context.close();
});
test('desktop and mobile fit and render with reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['index.html', 'components.html', 'principles.html']) {
      await page.goto(`/examples/showcase/dist/${path}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${path}-${viewport.width}.png`), fullPage: true });
    }
  }
});
test('print retains current filter and detail without controls or hidden contexts', async ({ page }) => {
  await page.goto(url);
  await page.getByLabel('Show places').selectOption('Paths');
  await page.getByRole('button', { name: /East walk/ }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#filter')).toBeHidden();
  await expect(page.locator('.place-list')).toBeHidden();
  await expect(page.locator('#print-filter')).toHaveText('Paths');
  await expect(page.locator('#print-filter')).toBeVisible();
  await expect(page.locator('#detail-name')).toHaveText('East walk');
  await expect(page.locator('#detail-name')).toBeVisible();
});

for (const path of ['components.html','principles.html']) for (const mode of ['night','day']) {
 test(`${path} ${mode} reference is accessible`,async({page})=>{
  await page.goto(`/examples/showcase/dist/${path}`);
  await page.locator('#showcase').evaluate((el,mode)=>el.dataset.mode=mode,mode);
  const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(report.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
 });
}

test('mobile report keeps every comparison heading readable without horizontal loss',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(url);
 const sizes=await page.locator('#examples > .l-table-wrap').evaluate(wrap=>({width:wrap.clientWidth,scroll:wrap.scrollWidth,headers:[...wrap.querySelectorAll('thead th')].map(el=>({client:el.clientWidth,scroll:el.scrollWidth}))}));
 expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
 for(const header of sizes.headers)expect(header.scroll).toBeLessThanOrEqual(header.client);
 await expect(page.getByRole('columnheader',{name:'Completed',exact:true})).toBeVisible();
});

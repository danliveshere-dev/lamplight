import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
const root = '/examples/showcase/dist/';

test('landing restores compact sample, labelled unsaved note and reference navigation', async ({ page }) => {
  await page.goto(root + 'index.html');
  await expect(page.locator('.intro')).toContainText('Folio');
  await expect(page.getByRole('heading', { name: 'Field notes' })).toBeVisible();
  await expect(page.locator('#recipes, .recipe-grid, .example-section')).toHaveCount(0);
  await expect(page.locator('.ai-starters details')).toHaveCount(4);
  await expect(page.locator('.ai-starters details[open]')).toHaveCount(0);
  await expect(page.locator('#sample tbody tr')).toHaveCount(3);
  await page.getByLabel('A note to keep').fill('Garden note');
  await page.getByRole('button', { name: 'Show an example state' }).click();
  await expect(page.locator('#action-status')).toHaveText('Example state shown. Nothing was saved.');
  await expect(page.locator('#print-note')).toHaveText('Garden note');
  await page.getByLabel('Day', { exact: true }).check();
  await expect(page.locator('#showcase')).toHaveAttribute('data-mode', 'day');
  await expect(page.getByRole('link', { name: 'Explore the full examples' })).toHaveAttribute('href', './examples.html');
  await page.getByRole('link', { name: 'Components', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Leads, threads and knots' })).toBeVisible();
  await page.getByRole('link', { name: 'Principles', exact: true }).click();
  await expect(page.locator('.principle-list article')).toHaveCount(7);
  await expect(page.getByRole('link', { name: 'Examples', exact: true })).toHaveAttribute('href', './examples.html');
});

test('examples have independent presets and scrolling reflects retained changes', async ({ page }) => {
  await page.goto(root + 'examples.html');
  for (const [id, mode, surface] of [['reading','night','study'],['report','day','ledger'],['dashboard','night','ledger'],['print','day','folio']]) {
    const room = page.locator(`#${id} .example-room`);
    await expect(room).toHaveAttribute('data-mode', mode);
    await expect(room).toHaveAttribute('data-surface', surface);
  }
  await page.locator('#reading').scrollIntoViewIfNeeded();
  await expect(page.locator('#active-example')).toHaveText('Reading');
  await page.getByLabel('Day', { exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#reading .example-room')).toHaveAttribute('data-mode', 'day');
  await page.locator('#report').scrollIntoViewIfNeeded();
  await expect(page.locator('#active-example')).toHaveText('Report');
  await expect(page.getByLabel('Ledger', { exact: true })).toBeChecked();
  await page.getByLabel('Night', { exact: true }).check();
  await page.locator('#reading').scrollIntoViewIfNeeded();
  await expect(page.locator('#active-example')).toHaveText('Reading');
  await expect(page.getByLabel('Day', { exact: true })).toBeChecked();
  await expect(page.locator('#report .example-room')).toHaveAttribute('data-mode', 'night');
  await expect(page.locator('#report tbody tr').filter({ has: page.locator('th[scope=row]') })).toHaveCount(12);
});

test('dashboard selection and filter carry through to print', async ({ page }) => {
  await page.goto(root + 'examples.html#dashboard');
  await page.getByLabel('Show places').selectOption('Paths');
  await expect(page.locator('#detail-name')).toHaveText('Creek path');
  await page.getByRole('button', { name: /East walk/ }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#detail-state')).toHaveText('Review');
  await expect(page.locator('#snapshot-name')).toHaveText('East walk');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#filter')).toBeHidden();
  await expect(page.locator('#print-filter')).toHaveText('Paths');
  await expect(page.locator('#snapshot-filter')).toHaveText('Paths');
  await expect(page.locator('#snapshot-name')).toBeVisible();
  await expect(page.locator('#snapshot-done')).toHaveText('5');
});

test('no JavaScript keeps content legible and controls disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(root + 'examples.html');
  await expect(page.getByRole('heading', { name: 'Making room to grow.' })).toBeVisible();
  await expect(page.locator('#script-note')).toBeVisible();
  await expect(page.getByLabel('Show places')).toBeDisabled();
  await expect(page.getByLabel('Night', { exact: true })).toBeDisabled();
  await expect(page.locator('.active-summary')).toBeHidden();
  await expect(page.locator('.example-toolbar')).toHaveCSS('position','static');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(root + 'index.html#start');
  await page.locator('.ai-starters summary').first().click();
  await expect(page.locator('.copy-prompt').first()).toBeDisabled();
  await expect(page.locator('#prompt-common-coding-agent')).toBeVisible();
  await context.close();
});

test('scroll tracking works without IntersectionObserver', async ({ page }) => {
  await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  await page.goto(root + 'examples.html');
  await page.locator('#dashboard').scrollIntoViewIfNeeded();
  await expect(page.locator('#active-example')).toHaveText('Dashboard');
  await expect(page.getByLabel('Ledger', { exact: true })).toBeChecked();
});

test('pages fit and capture desktop and mobile including the active toolbar', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['index.html', 'examples.html', 'components.html', 'principles.html']) {
      await page.goto(root + path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${path}-${viewport.width}.png`), fullPage: true });
      if (path === 'index.html') {
        await page.locator('#start').scrollIntoViewIfNeeded();
        await page.locator('.ai-starters summary').first().click();
        await page.locator('.ai-starters').scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`ai-expanded-${viewport.width}.png`) });
      }
      if (path === 'examples.html') {
        await page.locator('#report').scrollIntoViewIfNeeded();
        await expect(page.locator('#active-example')).toHaveText('Report');
        const sizes = await page.locator('#report .l-table-wrap').evaluate(w => ({ width:w.clientWidth, scroll:w.scrollWidth, headers:[...w.querySelectorAll('thead th')].map(h => [h.clientWidth,h.scrollWidth]) }));
        expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
        for (const [client, scroll] of sizes.headers) expect(scroll).toBeLessThanOrEqual(client);
        await page.screenshot({ path: testInfo.outputPath(`toolbar-${viewport.width}.png`) });
      }
    }
  }
});
for (const path of ['index.html', 'examples.html', 'components.html', 'principles.html']) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(root + path);
    const report = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(report.violations.filter(v => ['serious','critical'].includes(v.impact))).toEqual([]);
  });
}

test('anchor navigation and the end of the page select the visible example', async ({page}) => {
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:844});
  await page.goto(root+'examples.html');
  await page.getByRole('navigation',{name:'Example sections'}).getByRole('link',{name:'Report',exact:true}).click();
  await expect(page.locator('#active-example')).toHaveText('Report');
  await page.getByLabel('Night',{exact:true}).check();
  await expect(page.locator('#report .example-room')).toHaveAttribute('data-mode','night');
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await expect(page.locator('#active-example')).toHaveText('Print');
 }
});

test('report headings stay above its first rows and narrow tables scroll by keyboard', async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(root+'examples.html#report');
 const geometry=await page.locator('#report table').evaluate(table=>({head:table.querySelector('thead th').getBoundingClientRect().bottom,body:table.querySelector('tbody tr').getBoundingClientRect().top}));
 expect(geometry.head).toBeLessThanOrEqual(geometry.body+1);
 await page.setViewportSize({width:320,height:844});
 await page.goto(root+'examples.html#report');
 const region=page.getByRole('region',{name:'Field report table'});
 await expect(page.locator('.table-hint')).toBeVisible();
 await region.focus();await expect(region).toBeFocused();await page.keyboard.press('ArrowRight');
 await expect.poll(()=>region.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('landing print keeps the note as text and omits the sample actions', async({page})=>{
 await page.goto(root+'index.html');
 await page.getByLabel('A note to keep').fill('An unsaved garden note');
 await page.emulateMedia({media:'print'});
 await expect(page.locator('#print-note')).toBeVisible();
 await expect(page.locator('#print-note')).toHaveText('An unsaved garden note');
 await expect(page.locator('.sample-panel .l-actions')).toBeHidden();
});


test('main navigation loads distinct pages and only Get started uses a fragment', async ({ page }) => {
  await page.goto(root + 'index.html');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  for (const [name, path] of [['Examples','examples.html'], ['Components','components.html'], ['Principles','principles.html']]) {
    await nav.getByRole('link', { name, exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(root + path);
    expect(new URL(page.url()).hash).toBe('');
    await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
    if (name === 'Examples') await expect(page.getByRole('heading', { name: 'Examples', level: 1 })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Get started' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(root + 'index.html');
  expect(new URL(page.url()).hash).toBe('#start');
  await expect(page.locator('#start')).toBeVisible();
  await page.locator('.brand').click();
  expect(new URL(page.url()).hash).toBe('');
});

test('AI starters use keyboard disclosure and select text when clipboard is missing or denied', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); });
  await page.goto(root + 'index.html#start');
  const summary = page.getByText('Coding agents', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ai-starters details').first()).toHaveAttribute('open', '');
  const copy = page.getByRole('button', { name: 'Copy Common coding agent starter' });
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(copy.locator('+ .copy-status')).toContainText('Text selected');
  expect(await page.evaluate(() => window.getSelection().toString())).toContain('Build [brief]');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await copy.click();
  await expect(copy.locator('+ .copy-status')).toContainText('Text selected');
});

test('copy starter writes the full prompt when clipboard access succeeds',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedStarter=text;}}}));
 await page.goto(root+'index.html#start');
 await page.getByText('Coding agents',{exact:true}).click();
 await page.getByRole('button',{name:'Copy Common coding agent starter'}).click();
 await expect(page.locator('#prompt-common-coding-agent').locator('..').locator('.copy-status')).toHaveText('Copied.');
 expect(await page.evaluate(()=>window.copiedStarter)).toBe(await page.locator('#prompt-common-coding-agent').textContent());
});

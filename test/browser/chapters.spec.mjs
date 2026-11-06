import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const example = '/examples/showcase/dist/chapters.html';
const evidence = '.impeccable/review/chapters';
mkdirSync(evidence, { recursive: true });
test.use({ reducedMotion: 'reduce', deviceScaleFactor: 2 });

async function open(page) {
  await page.goto(example);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.l-chapter-rail')).toHaveAttribute('data-enhanced', '');
}

async function geometry(page) {
  return page.evaluate(() => {
    const items = [...document.querySelectorAll('.l-chapter-rail-item')];
    const values = items.map(item => {
      const rect = item.getBoundingClientRect();
      const dot = getComputedStyle(item, '::before');
      const line = getComputedStyle(item, '::after');
      const name = item.querySelector('.l-chapter-name');
      const nameRect = name.getBoundingClientRect();
      return {
        dotX: rect.left + parseFloat(dot.left) + parseFloat(dot.width) / 2,
        lineX: rect.left + parseFloat(line.left) + parseFloat(line.width) / 2,
        dotY: rect.top + parseFloat(dot.top) + parseFloat(dot.height) / 2,
        lineStart: rect.top + parseFloat(line.top),
        lineEnd: rect.top + parseFloat(line.top) + parseFloat(line.height),
        nameY: nameRect.top + parseFloat(getComputedStyle(name).lineHeight) / 2,
        nameX: nameRect.left,
        subX: item.querySelector('.l-chapter-rail-items a').getBoundingClientRect().left,
      };
    });
    return values;
  });
}

for (const width of [1400, 1100, 834, 390]) {
  for (const appearance of ['Night', 'Day', 'Folio']) {
    test(`${width}px ${appearance} chapters align and fit`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await open(page);
      await page.getByRole('group', { name: 'Appearance' }).getByRole('button', { name: appearance, exact: true }).click();
      const rail = page.locator('.l-chapter-rail');
      const first = page.locator('.l-chapter').first();
      const stem = `${width}-${appearance.toLowerCase()}-${testInfo.project.name}`;
      // Capture the rail before the anchor jump so sticky positioning cannot move the crop.
      if (appearance !== 'Folio') {
        await page.screenshot({ path: join(evidence, `${stem}-rail.png`), clip: await rail.boundingBox() });
      }
      await page.locator('.l-case-overview').screenshot({ path: join(evidence, `${stem}-overview.png`) });
      await page.locator('.l-case-overview a').first().click();
      await expect(page.locator('#chapter-purpose')).toBeInViewport();
      if (width > 1100 && appearance !== 'Folio') {
        const muted = await rail.locator('.l-chapter-rail-number').first().evaluate(node => getComputedStyle(node).color);
        await expect(rail.locator('.l-chapter-rail-items a').first()).toHaveCSS('color', muted);
      }
      const secondary = await first.locator('.l-chapter-argument').evaluate(node => getComputedStyle(node).color);
      await expect(page.locator('.l-case-overview a').first()).toHaveCSS('color', secondary);
      if (appearance === 'Folio') {
        await expect(rail).toBeHidden();
        await expect(first).toHaveCSS('break-before', 'page');
      } else {
        await expect(rail).toBeVisible();
        if (width > 1100) {
          await expect(rail).toHaveCSS('display', 'block');
          const measured = await geometry(page);
          for (let index = 0; index < measured.length; index++) {
            const current = measured[index];
            expect(Math.abs(current.dotY - current.nameY)).toBeLessThan(0.25);
            if (index < measured.length - 1) {
              expect(Math.abs(current.dotX - current.lineX)).toBeLessThan(0.1);
              expect(Math.abs(current.lineStart - current.dotY)).toBeLessThan(0.1);
              expect(Math.abs(current.lineEnd - measured[index + 1].dotY)).toBeLessThan(0.25);
            }
          }
          expect(Math.abs(measured[0].nameX - measured[0].subX)).toBeLessThan(0.1);
          writeFileSync(join(evidence, `${stem}-geometry.json`), JSON.stringify(measured, null, 2));
        } else {
          await expect(rail).toHaveCSS('display', 'flex');
          await expect(rail.locator('.l-chapter-rail-items').first()).toBeHidden();
        }
      }
      const baseline = await first.evaluate(element => {
        function mark(selector) {
          const target = element.querySelector(selector);
          const probe = document.createElement('span');
          probe.setAttribute('aria-hidden', 'true');
          Object.assign(probe.style, { display: 'inline-block', width: '0', height: '0', verticalAlign: 'baseline' });
          target.prepend(probe);
          const result = probe.getBoundingClientRect().top;
          probe.remove();
          return result;
        }
        return {
          numeral: mark('.l-chapter-number'),
          title: mark('.l-chapter-title'),
          titleX: element.querySelector('.l-chapter-title').getBoundingClientRect().left,
          argumentX: element.querySelector('.l-chapter-argument').getBoundingClientRect().left,
        };
      });
      expect(Math.abs(baseline.numeral - baseline.title)).toBeLessThan(0.25);
      expect(Math.abs(baseline.titleX - baseline.argumentX)).toBeLessThan(0.1);
      await first.screenshot({ path: join(evidence, `${stem}-opener.png`) });
      await page.screenshot({ path: join(evidence, `${stem}-page.png`) });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const scan = await new AxeBuilder({ page }).analyze();
      expect(scan.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
    });
  }
}

test('rail tracks jumps, reversal, resized headers and keyboard focus', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await open(page);
  const rail = page.locator('.l-chapter-rail');
  const links = rail.locator('.l-chapter-link');
  await links.first().focus();
  await expect(links.first()).toHaveCSS('outline-style', 'solid');
  // WebKit follows Safari's native Option-Tab preference for focusing links.
  await page.keyboard.press(testInfo.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(rail.locator('.l-chapter-rail-items a').first()).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(links.last()).toHaveAttribute('aria-current', 'location');
  await expect(rail.locator('.l-chapter-rail-items a').first()).toBeFocused();
  await expect(rail.locator('.l-chapter-rail-items').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(links.first()).toHaveAttribute('aria-current', 'location');

  await page.locator('.masthead').evaluate(header => { header.style.paddingBottom = 'var(--lamp-space-12)'; });
  await expect.poll(async () => page.locator('.l-chapter-layout').evaluate(layout =>
    parseFloat(layout.style.getPropertyValue('--l-chapter-header-offset')) - document.querySelector('.masthead').getBoundingClientRect().height
  )).toBe(0);
  await links.nth(2).click();
  await expect(links.nth(2)).toHaveAttribute('aria-current', 'location');
  expect(await page.locator('#chapter-care').evaluate(target => target.getBoundingClientRect().top - document.querySelector('.masthead').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  await expect(rail.locator('.is-done')).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => rail.locator('.l-chapter-link[aria-current]').evaluate(link => {
    const track = link.closest('.l-chapter-rail').getBoundingClientRect();
    const box = link.getBoundingClientRect();
    return box.left >= track.left - 1 && box.right <= track.right + 1;
  })).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(links.last()).toHaveAttribute('aria-current', 'location');
  const reveal = await links.last().evaluate(link => {
    const track = link.closest('.l-chapter-rail').getBoundingClientRect();
    const box = link.getBoundingClientRect();
    return box.left >= track.left - 1 && box.right <= track.right + 1;
  });
  expect(reveal).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('geometry follows a larger rail text size', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await open(page);
  await page.locator('.l-chapter-rail').evaluate(rail => rail.style.setProperty('--lamp-text-md', '1.25rem'));
  const measured = await geometry(page);
  for (const item of measured) expect(Math.abs(item.dotY - item.nameY)).toBeLessThan(0.25);
  await page.locator('.l-chapter-rail').screenshot({ path: join(evidence, `large-text-${testInfo.project.name}-rail.png`) });
});

test('static contents, observer fallback, cleanup and Folio print work', async ({ browser, page }, testInfo) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage({ viewport: { width: 1400, height: 1000 } });
  await staticPage.goto(example);
  for (const list of await staticPage.locator('.l-chapter-rail-items').all()) await expect(list).toBeVisible();
  await staticContext.close();

  await page.addInitScript(() => { window.IntersectionObserver = undefined; window.ResizeObserver = undefined; });
  await open(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.l-chapter-link').last()).toHaveAttribute('aria-current', 'location');
  const disposed = await page.evaluate(async () => {
    const source = document.querySelector('script[type="module"]').textContent;
    const modulePath = source.match(/from '([^']+)'/)[1];
    const { initChapterRail } = await import(new URL(modulePath, location.href).href);
    const rail = document.querySelector('.l-chapter-rail');
    const dispose = initChapterRail(rail, { header: document.querySelector('.masthead') });
    dispose();
    return !rail.hasAttribute('data-enhanced') && !rail.querySelector('[aria-current]');
  });
  expect(disposed).toBe(true);
  const inactive = page.locator('.l-chapter-rail-items a').first();
  await inactive.evaluate(link => link.setAttribute('aria-current', 'false'));
  const muted = await page.locator('.l-chapter-rail-number').first().evaluate(node => getComputedStyle(node).color);
  await expect(inactive).toHaveCSS('color', muted);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.l-chapter-rail')).toBeHidden();
  for (const chapter of await page.locator('.l-chapter').all()) await expect(chapter).toHaveCSS('break-before', 'page');
  if (testInfo.project.name === 'chromium') await page.pdf({ path: join(evidence, 'chapters-folio.pdf'), format: 'A4', printBackground: true });
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
  { width: 1440, height: 900 },
  { width: 2200, height: 1200 },
];

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await expect(page.locator('[data-testid="room"]')).toHaveCSS('color-scheme', 'dark');
});

test('five release viewports reflow without horizontal loss', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heading: document.querySelector('h1').getBoundingClientRect().toJSON(),
    }));
    expect(geometry.scrollWidth, `${viewport.width} px viewport`).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.heading.left).toBeGreaterThanOrEqual(0);
    expect(geometry.heading.right).toBeLessThanOrEqual(geometry.clientWidth);
  }
});

test('keyboard focus and tab selection stay visible and operable', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('#qa-note')).toBeFocused();
  const outline = await page.locator('#qa-note').evaluate((node) => {
    const style = getComputedStyle(node);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThanOrEqual(1);

  const toggle = page.locator('.l-toggle input');
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(toggle).not.toBeChecked();
  await page.locator('#qa-keep').focus();
  await expect(page.locator('#qa-keep')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#qa-outcome')).toHaveText('Kept. The note remains here.');

  await page.locator('#qa-tab-reading').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#qa-tab-notes')).toBeFocused();
  await expect(page.locator('#qa-tab-notes')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#qa-panel-notes')).toBeVisible();
  await expect(page.locator('#qa-panel-reading')).toBeHidden();
});

test('JavaScript-disabled core keeps semantic content', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4317/test/browser/fixture.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('One calm surface, at every width.');
  await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Reading windows' })).toBeVisible();
  await expect(page.locator('[data-testid="no-js-note"]')).toBeVisible();
  await context.close();
});

test('reduced motion disables ambient and nested Room effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const globalMotion = await page.evaluate(() => {
    const button = getComputedStyle(document.querySelector('#qa-keep'));
    return {
      orb: getComputedStyle(document.querySelector('.l-orb')).animationName,
      buttonDurations: button.transitionDuration,
      buttonProperties: button.transitionProperty,
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
  expect(globalMotion.orb).toBe('none');
  expect(globalMotion.buttonDurations.split(',').every((value) => {
    const milliseconds = value.trim().endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000;
    return milliseconds <= 50;
  })).toBe(true);
  expect(globalMotion.buttonProperties).not.toContain('transform');
  expect(globalMotion.scroll).toBe('auto');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const reducedButton = page.locator('[data-testid="reduced-button"]');
  await reducedButton.click({ position: { x: 12, y: 12 } });
  await reducedButton.focus();
  await expect(reducedButton).not.toHaveAttribute('data-press-phase', /.+/);
  const nestedMotion = await reducedButton.evaluate((node) => ({
    sheenOpacity: getComputedStyle(node, '::before').opacity,
    sheenTransition: getComputedStyle(node, '::before').transitionDuration,
    transitionProperties: getComputedStyle(node).transitionProperty,
  }));
  expect(parseFloat(nestedMotion.sheenOpacity)).toBe(0);
  expect(nestedMotion.sheenTransition.split(',').every((value) => parseFloat(value) === 0)).toBe(true);
  expect(nestedMotion.transitionProperties).not.toContain('transform');
});

test('computed text and primary-action contrast meet WCAG AA', async ({ page }) => {
  const ratios = await page.evaluate(() => {
    function parseColour(value) {
      const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (value.startsWith('color(srgb')) return [...numbers.slice(0, 3).map((part) => part * 255), numbers[3] ?? 1];
      if (value.startsWith('rgb')) return [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1];
      throw new Error(`Unsupported computed colour: ${value}`);
    }
    function composite(foreground, background) {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [0, 1, 2].map((index) => (
        (foreground[index] * foreground[3] + background[index] * background[3] * (1 - foreground[3])) / alpha
      )).concat(alpha);
    }
    function backgroundFor(node) {
      let colour = [0, 0, 0, 0];
      for (let current = node; current; current = current.parentElement) {
        colour = composite(parseColour(getComputedStyle(current).backgroundColor), colour);
        if (colour[3] >= .999) break;
      }
      return colour;
    }
    function luminance(colour) {
      const channels = colour.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    }
    function ratio(selector) {
      const node = document.querySelector(selector);
      const foreground = parseColour(getComputedStyle(node).color);
      const background = backgroundFor(node);
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return (light + .05) / (dark + .05);
    }
    return { body: ratio('.qa-copy'), primary: ratio('[data-kind="primary"]') };
  });
  expect(ratios.body).toBeGreaterThanOrEqual(4.5);
  expect(ratios.primary).toBeGreaterThanOrEqual(4.5);
});

test('axe finds no WCAG A or AA violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

for (const viewport of viewports) {
  test(`visual baseline ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await expect(page).toHaveScreenshot(`surface-${viewport.width}x${viewport.height}.png`, { fullPage: true });
  });
}

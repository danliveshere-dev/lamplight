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

test('Ledger tightens rows and uses tabular numbers', async ({ page }) => {
  await open(page, { surface: 'ledger' });
  const room = page.locator('[data-testid="room"]');
  expect(await prop(room, '--lamp-row-height')).toBe('2rem');
  const table = await room.evaluate(() => {
    const t = document.createElement('table');
    t.className = 'l-table';
    t.innerHTML = '<thead><tr><th>Name</th></tr></thead><tbody><tr><td>1</td></tr></tbody>';
    document.querySelector('[data-testid="room"]').append(t);
    const th = getComputedStyle(t.querySelector('th'));
    return { numeric: getComputedStyle(t).fontVariantNumeric, position: th.position };
  });
  expect(table).toEqual({ numeric: 'tabular-nums', position: 'sticky' });
});

test('Ledger turns ambient light off, in either mode', async ({ page }) => {
  await open(page, { surface: 'ledger', mode: 'day' });
  const room = page.locator('[data-testid="room"]');
  expect(await prop(room, '--lamp-sheen-follow')).toBe('transparent');
  await expect(room).toHaveCSS('color-scheme', 'light');
});

test('Folio is ink on plain paper', async ({ page }) => {
  await open(page, { surface: 'folio' });
  const room = page.locator('[data-testid="room"]');
  expect(await prop(room, '--lamp-surface-page')).toBe('transparent');
  await expect(room).toHaveCSS('color', 'rgb(20, 17, 24)');
});

test('printing any Room gives ink, even a Night one', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  const room = page.locator('[data-testid="room"]');
  await expect(room).toHaveCSS('color', 'rgb(20, 17, 24)');
  expect(await prop(room, '--lamp-surface-page')).toBe('transparent');
});

test('print hides presence and keeps focal as a heavy rule', async ({ page }) => {
  await open(page);
  await page.locator('[data-testid="room"]').evaluate((room) => {
    room.insertAdjacentHTML('beforeend',
      '<div class="l-presence" id="p"></div><div class="l-panel" data-depth="focal" id="f">x</div>');
  });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#p')).toBeHidden();
  await expect(page.locator('#f')).toHaveCSS('border-top-width', '2px');
});

for (const attrs of [{ surface: 'ledger' }, { surface: 'ledger', mode: 'day' }, { surface: 'folio' }]) {
  test(`${JSON.stringify(attrs)} has no serious accessibility findings`, async ({ page }) => {
    await open(page, attrs);
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = report.violations.filter((item) => ['serious', 'critical'].includes(item.impact));
    expect(serious, serious.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
  });
}

test('wide tables do not clip in print', async ({ page }) => {
  await open(page);
  await page.locator('[data-testid="room"]').evaluate(room => room.insertAdjacentHTML('beforeend', '<div class="l-table-wrap"><table class="l-table"><tr><td>Example</td></tr></table></div>'));
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.l-table-wrap').first()).toHaveCSS('overflow-x', 'visible');
});

test('Folio overrides explicit Night and removes focal light', async ({ page }) => {
  await open(page, { mode: 'night', surface: 'folio' });
  const room = page.getByTestId('room');
  await expect(room).toHaveCSS('color-scheme', 'light');
  await expect(room).toHaveCSS('color', 'rgb(20, 17, 24)');
  await expect(page.locator('.l-focal-source')).toBeHidden();
  await expect(page.locator('.l-focal-subject')).toHaveCSS('border-top-width', '2px');
  await expect(page.locator('.l-focal-subject')).toHaveCSS('background-image', 'none');
});

test('Folio chip states have distinct non-colour cues', async ({ page }) => {
  await open(page, { surface: 'folio' });
  await page.getByTestId('room').evaluate(room => room.insertAdjacentHTML('beforeend', '<span class="l-chip" data-state="live" id="live-chip">Live</span><span class="l-chip" data-state="attention" id="attention-chip">Attention</span>'));
  const cue = id => page.locator(id).evaluate(el => getComputedStyle(el, '::before').content);
  expect(await cue('#live-chip')).toContain('●');
  expect(await cue('#attention-chip')).toContain('▲');
});


for (const surface of ['folio', 'print']) {
  test(`${surface} resets arbitrary nested Night islands to ink`, async ({ page }) => {
    await open(page, surface === 'folio' ? { surface: 'folio', mode: 'day' } : { mode: 'day' });
    await page.getByTestId('room').evaluate(room => room.insertAdjacentHTML('beforeend',
      '<section data-mode="night" id="night-island" style="background:var(--lamp-glass-bg)">Nested island</section>'));
    const island = page.locator('#night-island');
    if (surface === 'print') await page.emulateMedia({ media: 'print' });
    await expect(island).toHaveCSS('color', 'rgb(20, 17, 24)');
    await expect(island).toHaveCSS('color-scheme', 'light');
    expect(await prop(island, '--lamp-glass-bg')).toBe('transparent');
  });
}

test('an arbitrary Night island remains Night on a Day screen', async ({ page }) => {
  await open(page, { mode: 'day' });
  await page.getByTestId('room').evaluate(room => room.insertAdjacentHTML('beforeend',
    '<section data-mode="night" id="night-island">Nested island</section>'));
  await expect(page.locator('#night-island')).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('#night-island')).toHaveCSS('color', 'rgb(232, 220, 196)');
});

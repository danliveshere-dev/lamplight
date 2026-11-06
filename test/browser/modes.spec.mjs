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

test('the focal catch follows Day paper and ink without the Night glow', async ({ page }) => {
  await open(page, { mode: 'day' });
  const focal = page.locator('.l-focal-catch').first();
  await expect(focal).toHaveCSS('color', 'rgb(20, 17, 24)');
  await expect(focal).toHaveCSS('color-scheme', 'light');
  expect(await prop(focal, '--l-focal-light-strength')).toBe('0');
  const shadows = await focal.locator('.l-focal-source').evaluate(node => [
    getComputedStyle(node).boxShadow, getComputedStyle(node, '::before').boxShadow,
  ]);
  for (const shadow of shadows) expect(shadow).not.toMatch(/20px|54px|6px|22px/);
  await expect(focal.locator('.l-focal-subject')).toHaveCSS('background-color', 'rgba(251, 247, 238, 0.92)');
  await focal.evaluate(node => node.dataset.mode = 'night');
  await expect(focal).toHaveCSS('color', 'rgb(232, 220, 196)');
  expect(await prop(focal, '--l-focal-light-strength')).toBe('1');
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


test('Folio makes controls plain and still immediately after leaving Night', async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const room = page.getByTestId('room');
  const result = await room.evaluate(el => {
    el.dataset.surface = 'folio';
    const field = el.querySelector('.l-input');
    const css = getComputedStyle(field);
    return { background: css.backgroundColor, shadow: css.boxShadow, transition: css.transitionProperty };
  });
  expect(result).toEqual({ background: 'rgba(0, 0, 0, 0)', shadow: 'none', transition: 'none' });
});

test('Folio prevents opt-in living light even with full motion declared', async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByTestId('room').evaluate(el => { el.dataset.surface = 'folio'; el.dataset.motion = 'full'; });
  const button = page.locator('#qa-keep');
  await button.dispatchEvent('pointerdown', { pointerId: 19, pointerType: 'mouse', button: 0 });
  await expect(button).not.toHaveAttribute('data-press-phase');
});


test('host appearance attributes leave host styling alone while reaching embedded Rooms', async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.evaluate(() => {
    document.documentElement.classList.remove('l-document');
    const host = document.createElement('section');
    host.id = 'host-isolation';
    host.innerHTML = '<div id="host-child" style="transition: opacity 2s"><a href="https://example.com">Host link</a></div><div class="l-room" id="embedded"><div data-mode="night" id="island">Island</div></div>';
    document.body.append(host);
  });
  const host = page.locator('#host-isolation');
  const child = page.locator('#host-child');
  const hostBaseline = await host.evaluate(el => { const style = getComputedStyle(el); return [style.color, style.backgroundColor, style.fontSize, style.colorScheme]; });
  const baseline = await child.evaluate(el => [getComputedStyle(el).transitionDuration, getComputedStyle(el.querySelector('a'), '::after').content]);
  for (const attrs of [{ mode: 'day' }, { mode: 'night' }, { surface: 'folio' }, { surface: 'ledger' }]) {
    await host.evaluate((el, values) => { delete el.dataset.mode; delete el.dataset.surface; Object.assign(el.dataset, values); }, attrs);
    expect(await host.evaluate(el => { const style = getComputedStyle(el); return [style.color, style.backgroundColor, style.fontSize, style.colorScheme]; })).toEqual(hostBaseline);
    expect(await child.evaluate(el => [getComputedStyle(el).transitionDuration, getComputedStyle(el.querySelector('a'), '::after').content])).toEqual(baseline);
    const room = page.locator('#embedded');
    await expect(room).toHaveCSS('color-scheme', attrs.mode === 'night' || attrs.surface === 'ledger' ? 'dark' : 'light');
    await expect(page.locator('#island')).toHaveCSS('color-scheme', attrs.surface === 'folio' ? 'light' : 'dark');
  }
});

test('nested Rooms honour their nearest explicit mode and Folio takes precedence', async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.evaluate(() => {
    document.documentElement.classList.remove('l-document');
    const host = document.createElement('div');
    host.dataset.mode = 'day';
    host.innerHTML = '<div class="l-room" id="outer-mode"><div class="l-room" data-mode="night" id="inner-mode"><div class="l-room" id="inherited-mode"><div class="l-panel" data-depth="focal">Focal</div></div></div></div>';
    document.body.append(host);
  });
  const outer = page.locator('#outer-mode');
  const inner = page.locator('#inner-mode');
  const inherited = page.locator('#inherited-mode');
  await expect(outer).toHaveCSS('color-scheme', 'light');
  await expect(inner).toHaveCSS('color-scheme', 'dark');
  await expect(inherited).toHaveCSS('color-scheme', 'dark');
  expect(await prop(inherited, '--lamp-surface-page')).toBe('#141118');
  await outer.evaluate(el => { el.parentElement.dataset.mode = 'night'; el.dataset.mode = 'night'; });
  await inner.evaluate(el => el.dataset.mode = 'day');
  await expect(inner).toHaveCSS('color-scheme', 'light');
  await expect(inherited).toHaveCSS('color-scheme', 'light');
  await expect(inherited).toHaveCSS('background-color', 'rgb(246, 236, 217)');
  await outer.evaluate(el => el.dataset.surface = 'folio');
  await inner.evaluate(el => el.dataset.mode = 'night');
  await expect(inner).toHaveCSS('color-scheme', 'light');
  await expect(inherited).toHaveCSS('color-scheme', 'light');
  expect(await prop(inherited, '--lamp-surface-page')).toBe('transparent');
  await expect(inherited.locator('.l-panel')).toHaveCSS('border-top-width', '2px');
});

for (const [modes, expected] of [
  [['day', 'night'], 'dark'],
  [['night', 'day', 'night'], 'dark'],
  [['day', 'night', 'day'], 'light'],
]) {
  test(`nearest host mode wins for ${modes.join(' > ')}`, async ({ page }) => {
    await page.goto('/test/browser/fixture.html');
    await page.evaluate(values => {
      document.documentElement.classList.remove('l-document');
      let parent = document.body;
      for (const value of values) {
        const node = document.createElement('div');
        node.dataset.mode = value;
        parent.append(node);
        parent = node;
      }
      parent.insertAdjacentHTML('beforeend', '<div class="l-room" id="host-mode-room">Room</div>');
    }, modes);
    const room = page.locator('#host-mode-room');
    await expect(room).toHaveCSS('color-scheme', expected);
    await expect(room).toHaveCSS('background-color', expected === 'dark' ? 'rgb(20, 17, 24)' : 'rgb(246, 236, 217)');
  });
}

test('Ledger suppresses light in nested mode islands', async ({ page }) => {
  await open(page, { surface: 'ledger', mode: 'day' });
  await page.getByTestId('room').evaluate(room => room.insertAdjacentHTML('beforeend', '<div data-mode="night" id="ledger-mode">Island</div>'));
  expect(await prop(page.locator('#ledger-mode'), '--lamp-sheen-follow')).toBe('transparent');
  expect(await prop(page.locator('#ledger-mode'), '--lamp-wire-warm-halo')).toBe('0 0 0 transparent');
});


test('Ledger keeps Day focal islands and presence free of ambient light', async ({ page }) => {
  await open(page, { surface: 'ledger', mode: 'day' });
  const room = page.locator('[data-testid="room"]');
  await room.evaluate(el => {
    const panel = document.createElement('div');
    panel.id = 'ledger-focal'; panel.className = 'l-panel'; panel.dataset.depth = 'focal';
    const presence = document.createElement('div');
    presence.id = 'ledger-presence'; presence.className = 'l-presence';
    el.append(panel, presence);
  });
  for (const id of ['ledger-focal', 'ledger-presence']) {
    const island = page.locator(`#${id}`);
    expect(await prop(island, '--lamp-sheen-follow')).toBe('transparent');
    expect(await prop(island, '--lamp-sheen-focus')).toBe('transparent');
    expect(await prop(island, '--lamp-wire-warm-halo')).toBe('0 0 0 transparent');
    expect(await prop(island, '--lamp-wire-live-halo')).toBe('0 0 0 transparent');
  }
});

import { build } from 'esbuild';
import { expect, test } from '@playwright/test';

// Bundle the real source and installed React in memory, without writing build assets.
const bundle = await build({
  entryPoints: ['test/browser/react-menu-fixture.js'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"development"' },
});

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/fixture.html');
  await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByRole('button', { name: 'Controlled', exact: true })).toBeVisible();
});

for (const kind of ['Controlled', 'Uncontrolled']) {
  test(`${kind} menu preserves focus across parent renders and closes with the latest callback`, async ({ page }) => {
    const section = page.getByRole('region', { name: `${kind} menu` });
    const trigger = section.getByRole('button', { name: kind, exact: true });
    const first = section.getByRole('menuitem', { name: 'First' });
    const second = section.getByRole('menuitem', { name: 'Second' });
    const third = section.getByRole('menuitem', { name: 'Third' });

    await trigger.focus();
    await trigger.press('ArrowDown');
    await expect(first).toBeFocused();
    await first.press('ArrowDown');
    await expect(second).toBeFocused();
    await page.evaluate(() => window.rerenderMenuParent());
    await expect(page.getByTestId('generation')).toHaveText('1');
    await expect(second).toBeFocused();
    await second.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('last-change')).toHaveText('1:false');

    await trigger.press('ArrowUp');
    await expect(third).toBeFocused();
    await page.evaluate(() => window.rerenderMenuParent());
    await expect(page.getByTestId('generation')).toHaveText('2');
    await expect(third).toBeFocused();
    await page.getByRole('button', { name: 'Outside' }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('last-change')).toHaveText('2:false');
    // Preserve the browser's pointer-focus behaviour, which differs in Safari.
    await expect(trigger).not.toBeFocused();
  });
}

test('repeated menu instances have independent identifiers and selection restores the right trigger', async ({ page }) => {
  const controlled = page.getByRole('region', { name: 'Controlled menu' });
  const uncontrolled = page.getByRole('region', { name: 'Uncontrolled menu' });
  const firstTrigger = controlled.getByRole('button', { name: 'Controlled', exact: true });
  const secondTrigger = uncontrolled.getByRole('button', { name: 'Uncontrolled', exact: true });
  expect(await firstTrigger.getAttribute('aria-controls')).not.toBe(await secondTrigger.getAttribute('aria-controls'));
  await secondTrigger.click();
  await uncontrolled.getByRole('menuitem', { name: 'Second' }).click();
  await expect(secondTrigger).toBeFocused();
  await expect(secondTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
});

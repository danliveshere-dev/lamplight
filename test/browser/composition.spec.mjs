import { expect, test } from '@playwright/test';

async function open(page, attrs = {}) {
  await page.goto('/test/browser/fixture.html');
  await page.getByTestId('room').evaluate((room, attrs) => {
    for (const [key, value] of Object.entries(attrs)) room.dataset[key] = value;
    room.insertAdjacentHTML('beforeend', `<section id="composition" aria-label="Composition examples" style="padding:24px;display:grid;gap:24px">
      <article class="l-panel" style="padding:24px"><div id="lead" class="l-lead-line l-etched" style="--l-tone:var(--lamp-dusk)">Evidence collected</div></article>
      <article id="thread" class="l-panel l-thread" style="--l-tone:var(--lamp-dusk)">
        <div class="l-knot" data-kind="lead">Already proven</div>
        <div class="l-knot" id="live-knot" data-state="live">Live: source checked</div>
        <div class="l-knot">Review: confirm the result</div>
      </article><div class="l-lead" id="ledger-lead">Region lead</div>
    </section>`);
  }, attrs);
}
const read = (page, selector, pseudo = null) => page.locator(selector).evaluate((el, pseudo) => {
  const c = getComputedStyle(el, pseudo);
  return { color:c.color, background:c.backgroundColor, image:c.backgroundImage, size:c.backgroundSize, shadow:c.boxShadow, width:parseFloat(c.width), height:parseFloat(c.height), content:c.content, display:c.display, radius:c.borderRadius, animation:c.animationName, transition:c.transitionDuration, left:c.left, top:c.top };
}, pseudo);

for (const mode of ['night','day']) for (const surface of ['study','ledger','folio']) {
  test(`composition marks keep their material in ${mode} ${surface}`, async ({page},testInfo) => {
    await open(page, {mode,surface});
    const lead = await read(page,'#lead','::before');
    const head = await read(page,'#thread','::before');
    const knot = await read(page,'#live-knot','::before');
    expect(lead.height).toBe(2);
    expect(lead.radius).toBe('0px');
    expect(head.width).toBe(9);
    expect(knot.width).toBe(6);
    expect(lead.content).toBe('""');
    expect(head.content).toBe('""');
    expect(head.animation).toBe('none');
    expect(lead.transition).toBe('0s');
    expect((await read(page,'#thread .l-knot:first-child','::before')).display).toBe('none');
    const contentWidth = await page.locator('#lead').evaluate(el => el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight));
    expect(Math.abs(lead.width - contentWidth * .75)).toBeLessThan(1);
    // A Panel retains its grain pseudo, while its own background draws the thread.
    expect((await read(page,'#thread')).image).toContain('linear-gradient');
    expect((await read(page,'#thread')).size).toMatch(/^2px /);
    if (surface === 'folio') expect((await read(page,'#thread')).background).toBe('rgba(0, 0, 0, 0)');
    if (surface !== 'folio') expect((await read(page,'#thread','::after')).image).toContain('url(');
    const glows = mode === 'night' && surface === 'study';
    for (const mark of [lead,head,knot]) expect(mark.shadow.includes('10px')).toBe(glows);
    if (surface === 'folio') {
      const ink = (await read(page,'#thread')).color;
      for (const mark of [lead,head,knot]) expect(mark.background).toBe(ink);
    }
    await expect(page.locator('#live-knot')).toHaveText('Live: source checked');
    await page.locator('#composition').screenshot({path:testInfo.outputPath(`${mode}-${surface}.png`)});
  });
}
test('Lead line aligns to padded text and knots align with the head line',async({page})=>{
  await open(page);
  const geometry=await page.locator('#composition').evaluate(root=>{
    const lead=root.querySelector('#lead'),thread=root.querySelector('#thread'),knot=root.querySelector('#live-knot');
    const l=getComputedStyle(lead),t=getComputedStyle(thread),h=getComputedStyle(thread,'::before'),k=getComputedStyle(knot,'::before');
    return {leadLeft:lead.getBoundingClientRect().left,panelLeft:lead.parentElement.getBoundingClientRect().left,padding:parseFloat(getComputedStyle(lead.parentElement).paddingLeft),border:parseFloat(getComputedStyle(lead.parentElement).borderLeftWidth),headCentre:parseFloat(h.left)+4.5,knotCentre:parseFloat(t.paddingLeft)+parseFloat(k.left)+3};
  });
  expect(geometry.leadLeft-geometry.panelLeft).toBeCloseTo(geometry.padding+geometry.border,1);
  expect(geometry.headCentre).toBeCloseTo(geometry.knotCentre,1);
});
test('Ledger lead stays full width and distinct from Lead line',async({page})=>{
  await open(page,{surface:'ledger'});
  await expect(page.locator('#ledger-lead')).toHaveCSS('border-top-width','2px');
  await expect(page.locator('#lead')).toHaveCSS('border-top-width','0px');
});
test('printing overrides custom and live tones to plain ink in every mode',async({page})=>{
  for(const mode of ['night','day']) {
    await open(page,{mode,surface:'ledger'});
    await page.emulateMedia({media:'print'});
    const ink=(await read(page,'#thread')).color;
    for(const [selector,pseudo] of [['#lead','::before'],['#thread','::before'],['#live-knot','::before']]) {
      const mark=await read(page,selector,pseudo);
      expect(mark.background).toBe(ink);
      expect(mark.shadow).not.toContain('10px');
      expect(mark.animation).toBe('none');
    }
    expect((await read(page,'#thread')).image).toContain('linear-gradient');
    expect((await read(page,'#thread')).size).toMatch(/^2px /);
    expect((await read(page,'#thread')).background).toBe('rgba(0, 0, 0, 0)');
    await expect(page.locator('#live-knot')).toBeVisible();
  }
});

test('a Thread preserves the focal background and ordinary knots remap their own tone',async({page})=>{
  await open(page,{mode:'day'});
  await page.locator('#thread').evaluate(el=>{
    el.dataset.depth='focal';
    const knot=el.querySelector('.l-knot:last-child');
    knot.style.setProperty('--l-tone','var(--lamp-dusk)');
    knot.dataset.mode='day';
  });
  const panel=await read(page,'#thread');
  expect(panel.image.match(/gradient/g).length).toBeGreaterThanOrEqual(2);
  expect((await read(page,'#thread','::before')).shadow).not.toContain('10px');
  const knot=await read(page,'#thread .l-knot:last-child','::before');
  const ink=await page.locator('#thread .l-knot:last-child').evaluate(el=>{
    const p=document.createElement('span');p.style.color='var(--lamp-dusk)';el.append(p);
    const result=getComputedStyle(p).color;p.remove();return result;
  });
  expect(knot.background).toBe(ink);
  expect(knot.shadow).not.toContain('10px');
});

test('Ledger keeps report row headers in flow while column headings stay sticky',async({page})=>{
 await open(page,{surface:'ledger'});
 await page.locator('#composition').evaluate(el=>el.insertAdjacentHTML('beforeend','<table class="l-table" id="row-headings"><thead><tr><th scope="col">Place</th><th scope="col">Count</th></tr></thead><tbody><tr><th scope="row">North bed</th><td>12</td></tr></tbody></table>'));
 await expect(page.locator('#row-headings thead th').first()).toHaveCSS('position','sticky');
 await expect(page.locator('#row-headings tbody th')).toHaveCSS('position','static');
 const padding=await page.locator('#row-headings tbody').evaluate(el=>[...el.querySelector('tr').children].map(n=>getComputedStyle(n).paddingTop));
 expect(padding[0]).toBe(padding[1]);
});

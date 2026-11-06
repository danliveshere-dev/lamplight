const instances = new WeakMap();

/** Enhance a chapter navigation rail. Returns a function that removes the enhancement. */
export function initChapterRail(rail, { header } = {}) {
  const view = rail?.ownerDocument?.defaultView;
  if (!view || !(rail instanceof view.HTMLElement)) return () => {};

  instances.get(rail)?.();

  const document = rail.ownerDocument;
  const scope = rail.closest('.l-chapter-layout') || rail.parentElement;
  const items = Array.from(rail.querySelectorAll('.l-chapter-rail-chapters > .l-chapter-rail-item'));
  const targets = [];
  const links = Array.from(rail.querySelectorAll('a[href]'));
  const chapterItems = [];

  function targetFor(link) {
    const href = link.getAttribute('href');
    if (!href) return null;
    try {
      const url = new URL(href, document.baseURI);
      const current = new URL(document.URL);
      if (!url.hash || url.origin !== current.origin || url.pathname !== current.pathname || url.search !== current.search) return null;
      const id = decodeURIComponent(url.hash.slice(1));
      return document.getElementById(id);
    } catch {
      return null;
    }
  }

  for (const item of items) {
    const link = item.querySelector(':scope > .l-chapter-link');
    if (!link) continue;
    const target = targetFor(link);
    if (!target || !target.classList.contains('l-chapter')) continue;
    const chapter = { item, link };
    chapterItems.push(chapter);
    targets.push({ target, chapter, link, isChapter: true });
    for (const sublink of item.querySelectorAll(':scope > .l-chapter-rail-items a[href]')) {
      const subtarget = targetFor(sublink);
      if (subtarget) targets.push({ target: subtarget, chapter, link: sublink, isChapter: false });
    }
  }

  if (!targets.length) return () => {};

  const properties = ['--l-chapter-header-offset', '--l-chapter-rail-height'];
  const previousProperties = properties.map(name => ({
    value: scope?.style.getPropertyValue(name) || '',
    priority: scope?.style.getPropertyPriority(name) || ''
  }));
  const previousEnhanced = rail.getAttribute('data-enhanced');
  const previousLinks = links.map(link => link.getAttribute('aria-current'));
  const previousClasses = chapterItems.map(({ item }) => ({
    active: item.classList.contains('is-active'),
    done: item.classList.contains('is-done')
  }));
  let frame = null;
  let activeChapter = null;
  let stopped = false;

  function measure() {
    if (!scope) return;
    if (header instanceof view.HTMLElement) {
      scope.style.setProperty('--l-chapter-header-offset', `${header.getBoundingClientRect().height}px`);
    }
    scope.style.setProperty('--l-chapter-rail-height', `${rail.getBoundingClientRect().height}px`);
  }

  function reveal(link) {
    if (rail.scrollWidth <= rail.clientWidth) return;
    const railRect = rail.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (linkRect.left < railRect.left) rail.scrollLeft += linkRect.left - railRect.left;
    else if (linkRect.right > railRect.right) rail.scrollLeft += linkRect.right - railRect.right;
  }

  function update() {
    frame = null;
    if (stopped) return;
    let selected = targets[0];
    for (const entry of targets) {
      const margin = parseFloat(view.getComputedStyle(entry.target).scrollMarginTop) || 0;
      if (Math.floor(entry.target.getBoundingClientRect().top) <= Math.ceil(margin)) selected = entry;
    }
    const scrollingElement = document.scrollingElement;
    if (scrollingElement) {
      const maxScroll = scrollingElement.scrollHeight - scrollingElement.clientHeight;
      if (maxScroll > 0 && Math.ceil(scrollingElement.scrollTop) >= maxScroll) selected = targets[targets.length - 1];
    }
    const activeIndex = chapterItems.indexOf(selected.chapter);
    chapterItems.forEach(({ item }, index) => {
      item.classList.toggle('is-active', index === activeIndex);
      item.classList.toggle('is-done', index < activeIndex);
    });
    links.forEach(link => link.removeAttribute('aria-current'));
    selected.chapter.link.setAttribute('aria-current', 'location');
    if (!selected.isChapter) selected.link.setAttribute('aria-current', 'location');
    if (activeChapter !== selected.chapter) {
      activeChapter = selected.chapter;
      reveal(selected.chapter.link);
    }
  }

  function schedule() {
    if (!stopped && frame === null) frame = view.requestAnimationFrame(update);
  }

  const intersectionObserver = typeof view.IntersectionObserver === 'function'
    ? new view.IntersectionObserver(schedule) : null;
  for (const { target } of targets) intersectionObserver?.observe(target);
  const resizeObserver = typeof view.ResizeObserver === 'function'
    ? new view.ResizeObserver(onResize) : null;
  resizeObserver?.observe(rail, { box: 'border-box' });
  if (header instanceof view.HTMLElement) resizeObserver?.observe(header, { box: 'border-box' });
  view.addEventListener('scroll', schedule, { passive: true });
  view.addEventListener('resize', onResize);
  function onResize() { measure(); activeChapter = null; schedule(); }
  measure();
  rail.setAttribute('data-enhanced', '');
  update();

  function cleanup() {
    if (stopped) return;
    stopped = true;
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    view.removeEventListener('scroll', schedule);
    view.removeEventListener('resize', onResize);
    if (frame !== null) view.cancelAnimationFrame(frame);
    if (previousEnhanced === null) rail.removeAttribute('data-enhanced');
    else rail.setAttribute('data-enhanced', previousEnhanced);
    links.forEach((link, index) => {
      if (previousLinks[index] === null) link.removeAttribute('aria-current');
      else link.setAttribute('aria-current', previousLinks[index]);
    });
    chapterItems.forEach(({ item }, index) => {
      item.classList.toggle('is-active', previousClasses[index].active);
      item.classList.toggle('is-done', previousClasses[index].done);
    });
    properties.forEach((name, index) => {
      if (!scope) return;
      const previous = previousProperties[index];
      if (previous.value) scope.style.setProperty(name, previous.value, previous.priority);
      else scope.style.removeProperty(name);
    });
    if (instances.get(rail) === cleanup) instances.delete(rail);
  }
  instances.set(rail, cleanup);
  return cleanup;
}

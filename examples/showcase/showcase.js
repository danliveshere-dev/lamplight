const room = document.querySelector('#showcase');
const sections = [...document.querySelectorAll('.example-section')];
let active = sections[0] || null;
const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
const controls = [...document.querySelectorAll('.controls input')];
function syncControls() {
  const target = active ? active.querySelector('.example-room') : room;
  if (!target) return;
  controls.forEach(control => { control.checked = target.dataset[control.name] === control.value; });
  if (active) {
    document.querySelector('#active-example').textContent = active.dataset.example;
    document.querySelector('#active-settings').textContent = `${titleCase(target.dataset.mode)} · ${titleCase(target.dataset.surface)}`;
  }
}
document.querySelectorAll('.controls fieldset').forEach(fieldset => { fieldset.disabled = false; });
const note = document.querySelector('#script-note');
if (note) note.hidden = true;
controls.forEach(control => control.addEventListener('change', () => {
  const target = active ? active.querySelector('.example-room') : room;
  target.dataset[control.name] = control.value;
  syncControls();
}));
if (sections.length) {
  const toolbar = document.querySelector('.example-toolbar');
  room.dataset.enhanced = 'true';
  let measuredHeight = 0;
  const measureToolbar = () => {
    const height = Math.ceil(toolbar.getBoundingClientRect().height);
    if (height !== measuredHeight) {
      measuredHeight = height;
      room.style.setProperty('--example-toolbar-height', `${height}px`);
    }
  };
  measureToolbar();
  let scheduled = false;
  const updateActive = () => {
    scheduled = false;
    const line = toolbar.getBoundingClientRect().bottom + 24;
    let next = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= line) next = section;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) next = sections.at(-1);
    if (next !== active) { active = next; syncControls(); }
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateActive); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { measureToolbar(); schedule(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measureToolbar(); schedule(); }).observe(toolbar);
  syncControls();
  updateActive();
}
const sampleAction = document.querySelector('#sample-action');
const sampleNote = document.querySelector('#note');
if (sampleAction && sampleNote) {
  sampleAction.disabled = false;
  sampleNote.disabled = false;
  sampleNote.addEventListener('input', () => { document.querySelector('#print-note').textContent = sampleNote.value || 'No note entered.'; });
  sampleAction.addEventListener('click', () => { document.querySelector('#action-status').textContent = 'Example state shown. Nothing was saved.'; });
}
const filter = document.querySelector('#filter');
if (filter) {
  const items = [...document.querySelectorAll('.place-list li')];
  const selectPlace = item => {
    items.forEach(row => row.querySelector('button').setAttribute('aria-pressed', String(row === item)));
    for (const key of ['name', 'group', 'state', 'planned', 'done']) {
      document.querySelector(`#detail-${key}`).textContent = item.dataset[key];
      document.querySelector(`#snapshot-${key}`).textContent = item.dataset[key];
    }
  };
  filter.disabled = false;
  items.forEach(item => { const button = item.querySelector('button'); button.disabled = false; button.addEventListener('click', () => selectPlace(item)); });
  filter.addEventListener('change', () => {
    items.forEach(item => { item.hidden = filter.value !== 'All' && item.dataset.group !== filter.value; });
    const label = filter.options[filter.selectedIndex].text;
    document.querySelector('#print-filter').textContent = label;
    document.querySelector('#snapshot-filter').textContent = label;
    const selected = items.find(item => item.querySelector('button').getAttribute('aria-pressed') === 'true');
    if (selected.hidden) selectPlace(items.find(item => !item.hidden));
  });
}

const reportScroll = document.querySelector('#report .l-table-wrap');
if (reportScroll) reportScroll.addEventListener('keydown', event => {
  if (event.target !== reportScroll || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (direction && reportScroll.scrollWidth > reportScroll.clientWidth) {
    event.preventDefault();
    reportScroll.scrollBy({ left: direction * 48, behavior: 'auto' });
  }
});

// Copy is an enhancement; the text remains available for manual selection.
document.querySelectorAll('.copy-prompt').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', async () => {
    const text = document.getElementById(button.dataset.copy);
    const status = button.nextElementSibling;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text.textContent);
      status.textContent = 'Copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(text);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Text selected. Copy it using your keyboard or menu.';
    }
  });
});

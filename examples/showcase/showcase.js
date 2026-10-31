const room = document.querySelector('#showcase');
document.querySelectorAll('.controls fieldset').forEach(fieldset => { fieldset.disabled = false; });
const note = document.querySelector('#script-note');
if (note) note.hidden = true;
for (const control of document.querySelectorAll('input[name="mode"], input[name="surface"]')) {
  control.addEventListener('change', () => { room.dataset[control.name] = control.value; });
}
const filter = document.querySelector('#filter');
if (filter) {
  const items = [...document.querySelectorAll('.place-list li')];
  const selectPlace = item => {
    for (const row of items) row.querySelector('button').setAttribute('aria-pressed', String(row === item));
    for (const key of ['name', 'group', 'state', 'planned', 'done']) document.querySelector(`#detail-${key}`).textContent = item.dataset[key];
  };
  filter.disabled = false;
  items.forEach(item => { const button = item.querySelector('button'); button.disabled = false; button.addEventListener('click', () => selectPlace(item)); });
  filter.addEventListener('change', () => {
    items.forEach(item => { item.hidden = filter.value !== 'All' && item.dataset.group !== filter.value; });
    document.querySelector('#print-filter').textContent = filter.options[filter.selectedIndex].text;
    const selected = items.find(item => item.querySelector('button').getAttribute('aria-pressed') === 'true');
    if (selected.hidden) selectPlace(items.find(item => !item.hidden));
  });
}

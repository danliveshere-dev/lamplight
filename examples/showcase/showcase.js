const room = document.querySelector('#showcase');
document.querySelectorAll('.controls fieldset').forEach(fieldset => { fieldset.disabled = false; });
document.querySelector('#script-note').hidden = true;
for (const control of document.querySelectorAll('input[name="mode"], input[name="surface"]')) {
  control.addEventListener('change', () => { room.dataset[control.name] = control.value; });
}
document.querySelector('#sample-action').disabled = false;
document.querySelector('#note').disabled = false;
document.querySelector('#note').addEventListener('input', event => {
  document.querySelector('#print-note').textContent = event.target.value || 'No note entered.';
});
document.querySelector('#sample-action').addEventListener('click', () => {
  document.querySelector('#action-status').textContent = 'Example state shown. Nothing was saved.';
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-doc-filter]').forEach((input) => {
    const targetId = input.getAttribute('data-doc-filter');
    const scope = targetId === 'page' ? document : document.getElementById(targetId);
    if (!scope) return;
    const rows = Array.from(scope.querySelectorAll('.doc-row'));

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      rows.forEach((row) => {
        const matches = query === '' || row.textContent.toLowerCase().includes(query);
        row.classList.toggle('is-hidden', !matches);
      });
    });
  });
});

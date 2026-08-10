document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-year-filter]').forEach((container) => {
    const targetId = container.getAttribute('data-year-filter');
    const scope = targetId === 'page' ? document : document.getElementById(targetId);
    if (!scope) return;

    const rows = Array.from(scope.querySelectorAll('.doc-row[data-year]'));
    if (!rows.length) return;

    const fromSelect = container.querySelector('[data-role="from"]');
    const untilSelect = container.querySelector('[data-role="until"]');
    if (!fromSelect || !untilSelect) return;

    const years = Array.from(new Set(rows.map((row) => parseInt(row.dataset.year, 10)))).sort((a, b) => a - b);

    years.forEach((year) => {
      const fromOption = document.createElement('option');
      fromOption.value = String(year);
      fromOption.textContent = String(year);
      fromSelect.appendChild(fromOption);

      const untilOption = document.createElement('option');
      untilOption.value = String(year);
      untilOption.textContent = String(year);
      untilSelect.appendChild(untilOption);
    });

    fromSelect.value = String(years[0]);
    untilSelect.value = String(years[years.length - 1]);

    function applyFilter() {
      let from = parseInt(fromSelect.value, 10);
      let until = parseInt(untilSelect.value, 10);
      if (from > until) {
        [from, until] = [until, from];
      }
      rows.forEach((row) => {
        const year = parseInt(row.dataset.year, 10);
        row.classList.toggle('is-hidden', year < from || year > until);
      });
    }

    fromSelect.addEventListener('change', applyFilter);
    untilSelect.addEventListener('change', applyFilter);
  });
});

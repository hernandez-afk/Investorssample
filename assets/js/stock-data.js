(function () {
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const TODAY = new Date('2026-08-10T00:00:00Z');
  const TOTAL_DAYS = 5 * 365;
  const rand = mulberry32(42);

  const fullSeries = [];
  let price = 6.85;
  for (let i = TOTAL_DAYS; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // trading days only
    const drift = (rand() - 0.485) * 0.045;
    price = Math.max(1.2, price * (1 + drift));
    fullSeries.push({ date: d, close: price });
  }

  function shortLabel(d, range) {
    if (range === '5Y') return d.getFullYear().toString();
    if (range === '1Y' || range === '6M') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const RANGE_DAYS = { '1M': 21, '3M': 63, '6M': 126, '1Y': 252, '5Y': fullSeries.length };

  function seriesForRange(range) {
    const n = RANGE_DAYS[range];
    const slice = fullSeries.slice(-n);
    return slice.map((d) => ({ date: d.date, value: d.close, label: shortLabel(d.date, range) }));
  }

  function fmtUsd(v) {
    return '$' + v.toFixed(2);
  }

  function fmtCompact(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    return '$' + n.toFixed(0);
  }

  const SHARES_OUTSTANDING = 32_400_000;

  function buildQuoteRow(d, prevClose) {
    const jitterSeed = d.close;
    const range = d.close * 0.035;
    const open = prevClose != null ? prevClose * (1 + (rand() - 0.5) * 0.01) : d.close;
    const high = Math.max(open, d.close) + range * rand();
    const low = Math.min(open, d.close) - range * rand();
    const volume = Math.round(180000 + rand() * 420000);
    return { date: d.date, open, high, low, close: d.close, volume };
  }

  function init() {
    const chartCanvas = document.getElementById('stockChart');
    const tooltip = document.getElementById('stockTooltip');
    if (!chartCanvas) return;

    let currentRange = '1Y';
    const chart = createLineChart(chartCanvas, tooltip, seriesForRange(currentRange), { valueFormatter: fmtUsd });

    function updateStats(range) {
      const n = RANGE_DAYS[range];
      const slice = fullSeries.slice(-n);
      const last = slice[slice.length - 1];
      const prev = slice[slice.length - 2] || last;
      const change = last.close - prev.close;
      const changePct = (change / prev.close) * 100;

      document.getElementById('statPrice').textContent = fmtUsd(last.close);
      const changeEl = document.getElementById('statChange');
      changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
      changeEl.className = 'stat-tile__delta ' + (change >= 0 ? 'is-up' : 'is-down');

      const yearSlice = fullSeries.slice(-252);
      const dayHigh = Math.max(...slice.slice(-1).map(() => last.close), last.close);
      document.getElementById('statDayRange').textContent = `${fmtUsd(last.close * 0.985)} – ${fmtUsd(last.close * 1.015)}`;
      const wLow = Math.min(...yearSlice.map((d) => d.close));
      const wHigh = Math.max(...yearSlice.map((d) => d.close));
      document.getElementById('stat52wRange').textContent = `${fmtUsd(wLow)} – ${fmtUsd(wHigh)}`;

      document.getElementById('statVolume').textContent = (280000 + Math.round(rand() * 60000)).toLocaleString('en-US');
      document.getElementById('statMarketCap').textContent = fmtCompact(last.close * SHARES_OUTSTANDING);
    }

    function updateTable() {
      const tbody = document.querySelector('#quoteTable tbody');
      tbody.innerHTML = '';
      const recent = fullSeries.slice(-10).reverse();
      recent.forEach((d, i) => {
        const idxInFull = fullSeries.length - 1 - i;
        const prevClose = idxInFull > 0 ? fullSeries[idxInFull - 1].close : null;
        const row = buildQuoteRow(d, prevClose);
        const change = prevClose != null ? row.close - prevClose : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
          <td>${fmtUsd(row.open)}</td>
          <td>${fmtUsd(row.high)}</td>
          <td>${fmtUsd(row.low)}</td>
          <td>${fmtUsd(row.close)}</td>
          <td class="${change >= 0 ? 'is-up' : 'is-down'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}</td>
          <td>${row.volume.toLocaleString('en-US')}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.querySelectorAll('.range-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.range-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentRange = btn.dataset.range;
        chart.setData(seriesForRange(currentRange));
        updateStats(currentRange);
      });
    });

    updateStats(currentRange);
    updateTable();

    const downloadBtn = document.getElementById('downloadCsv');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const rows = [['Date', 'Open', 'High', 'Low', 'Close', 'Volume']];
        let prevClose = null;
        fullSeries.forEach((d) => {
          const row = buildQuoteRow(d, prevClose);
          rows.push([
            row.date.toISOString().slice(0, 10),
            row.open.toFixed(2),
            row.high.toFixed(2),
            row.low.toFixed(2),
            row.close.toFixed(2),
            row.volume,
          ]);
          prevClose = d.close;
        });
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'atari-share-price-history-sample.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }
  }

  document.addEventListener('partials:loaded', init);
})();
